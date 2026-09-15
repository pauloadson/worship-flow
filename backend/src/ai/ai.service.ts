import { Injectable, InternalServerErrorException, ForbiddenException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service.js';

export interface SetlistSuggestion {
  titulo: string;
  artista: string;
  tom: string;
  justificativa: string;
}

// Limite de produto por grupo, independente da cota do projeto Gemini.
const RATE_LIMIT_MAX = 5;           // máx. 5 sugestões
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // por hora
const MINIMUM_SETLIST_SONGS = 4;
const PROVIDER_COOLDOWN_KEY = 'gemini';
const DEFAULT_PROJECT_RPM = 5;
const DEFAULT_PROJECT_RPD = 100;
const FALLBACK_429_DELAY_MS = 60 * 1000;
const FALLBACK_503_DELAY_MS = 10 * 1000;
const MAX_SERVICE_UNAVAILABLE_RETRIES = 1;

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private readonly projectRequestsPerMinute: number;
  private readonly projectRequestsPerDay: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY não configurada no servidor.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.projectRequestsPerMinute = this.readPositiveNumber('GEMINI_PROJECT_RPM', DEFAULT_PROJECT_RPM);
    this.projectRequestsPerDay = this.readPositiveNumber('GEMINI_PROJECT_RPD', DEFAULT_PROJECT_RPD);
  }

  async suggestSetlist(userId: string, groupId: string, theme?: string): Promise<SetlistSuggestion[]> {
    // Verifica se o usuário é membro do grupo
    const member = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });

    if (!member) {
      throw new ForbiddenException('Você não faz parte deste ministério.');
    }

    // Busca todas as músicas do grupo
    const songs = await this.prisma.song.findMany({
      where: { groupId },
      select: { id: true, title: true, artist: true, key: true },
      orderBy: { title: 'asc' },
    });

    if (songs.length < MINIMUM_SETLIST_SONGS) {
      throw new BadRequestException(`Cadastre pelo menos ${MINIMUM_SETLIST_SONGS} músicas no repertório para usar esta funcionalidade.`);
    }

    await this.ensureProviderIsAvailable();

    // Limite de produto por grupo. As janelas ficam no banco e sobrevivem a reinicializações.
    const groupNow = new Date();
    const groupHourStart = new Date(groupNow);
    groupHourStart.setMinutes(0, 0, 0);
    const millisecondsUntilNextHour = RATE_LIMIT_WINDOW_MS -
      (groupNow.getMinutes() * 60 * 1000 + groupNow.getSeconds() * 1000 + groupNow.getMilliseconds());
    await this.incrementWindow(`group:${groupId}:hour`, groupHourStart, RATE_LIMIT_MAX, millisecondsUntilNextHour);
    await this.enforceProjectLimits();


    // Monta o catálogo de músicas como texto
    const catalog = songs
      .map((s, i) => `${i + 1}. Título: "${s.title}", Artista: "${s.artist || 'Desconhecido'}", Tom: "${s.key || 'Não informado'}"`)
      .join('\n');

    const themeInstruction = theme
      ? `O tema ou critério do culto é: "${theme}". Priorize músicas que se encaixem neste tema.`
      : 'Sugira músicas com boa progressão harmônica, variando entre momentos de adoração e louvor.';

    const prompt = `
Você é um assistente especialista em repertórios para ministérios de louvor evangélicos.

Abaixo está o catálogo completo de músicas disponíveis (com título, artista e tom):
${catalog}

Tarefa: Selecione exatamente 4 músicas do catálogo acima para compor um setlist coeso para um culto.
${themeInstruction}

Critérios de seleção:
- Escolha músicas com tons musicais compatíveis ou próximos (para facilitar transições suaves)
- Varie o andamento (comece com louvor animado, termine com adoração íntima, ou seja criativo)
- Justifique brevemente a escolha de cada música (máx. 1 frase)
- Use SOMENTE músicas que existem no catálogo acima. Não invente músicas.

IMPORTANTE: Responda APENAS com um array JSON válido, sem nenhum texto extra antes ou depois, sem blocos de código markdown. Siga exatamente este formato:
[
  {"titulo": "Nome exato da música", "artista": "Nome do artista", "tom": "Tom musical", "justificativa": "Por que esta música foi escolhida."},
  {"titulo": "Nome exato da música", "artista": "Nome do artista", "tom": "Tom musical", "justificativa": "Por que esta música foi escolhida."},
  {"titulo": "Nome exato da música", "artista": "Nome do artista", "tom": "Tom musical", "justificativa": "Por que esta música foi escolhida."},
  {"titulo": "Nome exato da música", "artista": "Nome do artista", "tom": "Tom musical", "justificativa": "Por que esta música foi escolhida."}
]
`;

    try {
      const result = await this.generateContentWithRetry(prompt);
      const text = result.response.text().trim();

      // Remove possíveis blocos de código markdown que a IA possa ter incluído
      const jsonText = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

      const suggestions: SetlistSuggestion[] = JSON.parse(jsonText);

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('Resposta inválida da IA.');
      }

      return suggestions;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      const providerStatus = this.getProviderStatus(error);
      if (providerStatus === HttpStatus.TOO_MANY_REQUESTS || providerStatus === HttpStatus.SERVICE_UNAVAILABLE) {
        const delayMs = this.getProviderRetryDelay(error) ??
          (providerStatus === HttpStatus.TOO_MANY_REQUESTS ? FALLBACK_429_DELAY_MS : FALLBACK_503_DELAY_MS);
        await this.setProviderCooldown(delayMs);
        throw this.createRetryException(providerStatus, delayMs);
      }

      throw new InternalServerErrorException('Não foi possível gerar sugestões no momento. Tente novamente.');
    }
  }

  private readPositiveNumber(name: string, fallback: number): number {
    const value = Number(this.config.get<string>(name));
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }

  private async generateContentWithRetry(prompt: string) {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    for (let attempt = 0; attempt <= MAX_SERVICE_UNAVAILABLE_RETRIES; attempt++) {
      try {
        return await model.generateContent(prompt);
      } catch (error) {
        const status = this.getProviderStatus(error);
        if (status !== HttpStatus.SERVICE_UNAVAILABLE || attempt === MAX_SERVICE_UNAVAILABLE_RETRIES) {
          throw error;
        }

        const delayMs = this.getProviderRetryDelay(error) ?? FALLBACK_503_DELAY_MS;
        await this.setProviderCooldown(delayMs);
        await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Não foi possível gerar sugestões no momento.');
  }

  private async enforceProjectLimits(): Promise<void> {
    const now = new Date();
    const minuteStart = new Date(now);
    minuteStart.setSeconds(0, 0);
    await this.incrementWindow('project:minute', minuteStart, this.projectRequestsPerMinute, 60 * 1000);

    const pacificDateParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now).map(({ type, value }) => [type, value]));
    const pacificDate = `${pacificDateParts.year}-${pacificDateParts.month}-${pacificDateParts.day}`;
    // A data identifica a janela da cota diária do Gemini, que reinicia à meia-noite do Pacífico.
    const dayStart = new Date(`${pacificDate}T00:00:00.000Z`);
    await this.incrementWindow('project:day', dayStart, this.projectRequestsPerDay, this.millisecondsUntilPacificMidnight(now));
  }

  private async incrementWindow(key: string, windowStart: Date, limit: number, retryAfterMs: number): Promise<void> {
    const usage = await this.prisma.aiUsageWindow.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
    });

    if (usage.count > limit) {
      throw this.createRetryException(HttpStatus.TOO_MANY_REQUESTS, retryAfterMs);
    }
  }

  private async ensureProviderIsAvailable(): Promise<void> {
    const cooldown = await this.prisma.aiProviderCooldown.findUnique({
      where: { key: PROVIDER_COOLDOWN_KEY },
    });
    if (cooldown && cooldown.retryAfter > new Date()) {
      throw this.createRetryException(HttpStatus.TOO_MANY_REQUESTS, cooldown.retryAfter.getTime() - Date.now());
    }
  }

  private async setProviderCooldown(delayMs: number): Promise<void> {
    const retryAfter = new Date(Date.now() + delayMs);
    await this.prisma.aiProviderCooldown.upsert({
      where: { key: PROVIDER_COOLDOWN_KEY },
      create: { key: PROVIDER_COOLDOWN_KEY, retryAfter },
      update: { retryAfter },
    });
  }

  private getProviderStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error !== null && 'status' in error) {
      const status = (error as { status?: unknown }).status;
      return typeof status === 'number' ? status : undefined;
    }
    return undefined;
  }

  private getProviderRetryDelay(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null || !('errorDetails' in error)) return undefined;
    const details = (error as { errorDetails?: unknown }).errorDetails;
    if (!Array.isArray(details)) return undefined;

    const retryInfo = details.find((detail) =>
      typeof detail === 'object' && detail !== null &&
      String((detail as Record<string, unknown>)['@type'] ?? '').includes('RetryInfo'),
    ) as Record<string, unknown> | undefined;
    const retryDelay = retryInfo?.retryDelay;
    if (typeof retryDelay !== 'string') return undefined;

    const seconds = Number.parseFloat(retryDelay.replace(/s$/, ''));
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds * 1000) : undefined;
  }

  private createRetryException(status: HttpStatus, delayMs: number): HttpException {
    const retryAfterSeconds = Math.max(1, Math.ceil(delayMs / 1000));
    const message = status === HttpStatus.SERVICE_UNAVAILABLE
      ? `O serviço Gemini está temporariamente indisponível. Tente novamente em ${retryAfterSeconds} segundo(s).`
      : `Limite temporário da IA atingido. Tente novamente em ${retryAfterSeconds} segundo(s).`;
    return new HttpException(
      {
        statusCode: status,
        message,
        retryAfterSeconds,
      },
      status,
    );
  }

  private millisecondsUntilPacificMidnight(now: Date): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
    });
    const parts = Object.fromEntries(formatter.formatToParts(now).map(({ type, value }) => [type, value]));
    const secondsToday = Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
    return Math.max(1000, (24 * 3600 - secondsToday) * 1000);
  }
}
