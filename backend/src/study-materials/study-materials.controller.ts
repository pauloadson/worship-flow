import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { StudyMaterialsService } from './study-materials.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('study-materials')
export class StudyMaterialsController {
  constructor(private readonly studyMaterialsService: StudyMaterialsService) {}

  @Post()
  async createMaterial(
    @Body() body: { title: string; url: string; groupId?: string; songId?: string; eventId?: string }
  ) {
    return this.studyMaterialsService.createMaterial(body);
  }

  @Get()
  async getMaterials(
    @Query('groupId') groupId?: string,
    @Query('songId') songId?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.studyMaterialsService.getMaterials({ groupId, songId, eventId });
  }

  @Delete(':id')
  async deleteMaterial(@Param('id') id: string) {
    return this.studyMaterialsService.deleteMaterial(id);
  }
}
