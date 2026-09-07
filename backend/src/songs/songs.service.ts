import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSongDto, UpdateSongDto } from './dto/index.js';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, groupId: string, dto: CreateSongDto) {
    await this.verifyMembership(userId, groupId);

    return this.prisma.song.create({
      data: {
        groupId,
        ...dto,
      },
    });
  }

  async findAllByGroup(userId: string, groupId: string) {
    await this.verifyMembership(userId, groupId);

    return this.prisma.song.findMany({
      where: { groupId },
      orderBy: { title: 'asc' },
    });
  }

  async update(userId: string, groupId: string, songId: string, dto: UpdateSongDto) {
    await this.verifyMembership(userId, groupId);

    const song = await this.prisma.song.findUnique({ where: { id: songId } });
    if (!song || song.groupId !== groupId) {
      throw new NotFoundException('Música não encontrada.');
    }

    return this.prisma.song.update({
      where: { id: songId },
      data: dto,
    });
  }

  async delete(userId: string, groupId: string, songId: string) {
    await this.verifyMembership(userId, groupId);

    const song = await this.prisma.song.findUnique({ where: { id: songId } });
    if (!song || song.groupId !== groupId) {
      throw new NotFoundException('Música não encontrada.');
    }

    return this.prisma.song.delete({
      where: { id: songId },
    });
  }

  private async verifyMembership(userId: string, groupId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: { userId, groupId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Você não faz parte deste ministério.');
    }

    return member;
  }
}
