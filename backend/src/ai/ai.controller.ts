import { Controller, Post, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /groups/:groupId/ai/suggest-setlist?theme=opcional
   * Sugere 4 músicas do repertório do grupo usando o Google Gemini.
   */
  @Post('suggest-setlist')
  suggestSetlist(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Query('theme') theme?: string,
  ) {
    return this.aiService.suggestSetlist(req.user.sub, groupId, theme);
  }
}
