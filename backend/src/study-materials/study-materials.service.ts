import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StudyMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getGroupIdForMaterial(query: { groupId?: string; songId?: string; eventId?: string }): Promise<string> {
    if (query.groupId) return query.groupId;
    if (query.songId) {
      const song = await this.prisma.song.findUnique({ where: { id: query.songId } });
      if (!song) throw new NotFoundException('Song not found');
      return song.groupId;
    }
    if (query.eventId) {
      const event = await this.prisma.event.findUnique({ where: { id: query.eventId } });
      if (!event) throw new NotFoundException('Event not found');
      return event.groupId;
    }
    throw new BadRequestException('Must provide groupId, songId, or eventId');
  }

  private async verifyMembership(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!member) {
      throw new ForbiddenException('Você não tem permissão para acessar os materiais deste ministério.');
    }
    return member;
  }

  async createMaterial(userId: string, data: { title: string; url: string; groupId?: string; songId?: string; eventId?: string }) {
    const groupId = await this.getGroupIdForMaterial(data);
    await this.verifyMembership(userId, groupId);

    return this.prisma.studyMaterial.create({
      data: {
        title: data.title,
        url: data.url,
        groupId: groupId,
        songId: data.songId || undefined,
        eventId: data.eventId || undefined,
      },
    });
  }

  async getMaterials(userId: string, query: { groupId?: string; songId?: string; eventId?: string }) {
    const groupId = await this.getGroupIdForMaterial(query);
    await this.verifyMembership(userId, groupId);

    const where: any = {};
    if (query.groupId) where.groupId = query.groupId;
    if (query.songId) where.songId = query.songId;
    if (query.eventId) where.eventId = query.eventId;

    return this.prisma.studyMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteMaterial(userId: string, id: string) {
    const exists = await this.prisma.studyMaterial.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException('Material not found');
    }

    const groupId = await this.getGroupIdForMaterial({ groupId: exists.groupId || undefined, songId: exists.songId || undefined, eventId: exists.eventId || undefined });
    await this.verifyMembership(userId, groupId);

    return this.prisma.studyMaterial.delete({
      where: { id },
    });
  }
}
