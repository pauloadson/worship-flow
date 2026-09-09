import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StudyMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMaterial(data: { title: string; url: string; groupId?: string; songId?: string; eventId?: string }) {
    return this.prisma.studyMaterial.create({
      data: {
        title: data.title,
        url: data.url,
        groupId: data.groupId,
        songId: data.songId,
        eventId: data.eventId,
      },
    });
  }

  async getMaterials(query: { groupId?: string; songId?: string; eventId?: string }) {
    const where: any = {};
    if (query.groupId) where.groupId = query.groupId;
    if (query.songId) where.songId = query.songId;
    if (query.eventId) where.eventId = query.eventId;

    return this.prisma.studyMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteMaterial(id: string) {
    const exists = await this.prisma.studyMaterial.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Material not found');
    }
    return this.prisma.studyMaterial.delete({
      where: { id },
    });
  }
}
