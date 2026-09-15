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

// Rate limiter em memória: máximo de chamadas por grupo por janela de tempo
const RATE_LIMIT_MAX = 5;           // máx. 5 sugestões
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // por hora
const MINIMUM_SETLIST_SONGS = 4;

interface RateLimitEntry { count: number; windowStart: number; }
const rateLimitMap = new Map<string, RateLimitEntry>();

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY não configurada no servidor.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
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

    // Rate limiting: máx. 5 sugestões por grupo por hora. Validações não consomem a cota.
    const now = Date.now();
    const entry = rateLimitMap.get(groupId);
    if (entry && now - entry.windowStart < RATE_LIMIT_WINDOW_MS) {
      if (entry.count >= RATE_LIMIT_MAX) {
        const minutesLeft = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)) / 60000);
        throw new HttpException(
          `Limite de ${RATE_LIMIT_MAX} sugestões por hora atingido. Tente novamente em ${minutesLeft} minuto(s).`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      entry.count++;
    } else {
      rateLimitMap.set(groupId, { count: 1, windowStart: now });
    }


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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
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
      throw new InternalServerErrorException('Não foi possível gerar sugestões no momento. Tente novamente.');
    }
  }
}
