import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { StudyMaterialsService } from './study-materials.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('study-materials')
export class StudyMaterialsController {
  constructor(private readonly studyMaterialsService: StudyMaterialsService) {}

  @Post()
  async createMaterial(
    @Req() req: any,
    @Body() body: { title: string; url: string; groupId?: string; songId?: string; eventId?: string }
  ) {
    return this.studyMaterialsService.createMaterial(req.user.sub, body);
  }

  @Get()
  async getMaterials(
    @Req() req: any,
    @Query('groupId') groupId?: string,
    @Query('songId') songId?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.studyMaterialsService.getMaterials(req.user.sub, { groupId, songId, eventId });
  }

  @Delete(':id')
  async deleteMaterial(@Req() req: any, @Param('id') id: string) {
    return this.studyMaterialsService.deleteMaterial(req.user.sub, id);
  }
}
