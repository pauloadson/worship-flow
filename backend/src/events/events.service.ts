import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(groupId: string, data: any, userId: string) {
    // Verificamos se é admin
    const member = await this.prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } }
    });
    
    if (!member || !member.isAdmin) {
      // Como o owner tem isAdmin=true ao criar, isso vai cobrir. Mas para garantir, podemos buscar o ownerId do group:
      const group = await this.prisma.group.findUnique({ where: { id: groupId } });
      if (group?.ownerId !== userId && !member?.isAdmin) {
        throw new ForbiddenException('Apenas administradores podem criar eventos.');
      }
    }

    return this.prisma.event.create({
      data: {
        groupId,
        title: data.title,
        date: new Date(data.date),
        eventType: data.eventType || 'Ensaio'
      }
    });
  }

  async getEvents(groupId: string) {
    return this.prisma.event.findMany({
      where: { groupId },
      orderBy: { date: 'asc' },
      include: {
        rsvps: {
          include: {
            member: {
              include: { user: { select: { name: true, id: true } } }
            }
          }
        }
      }
    });
  }

  async updateRsvp(groupId: string, eventId: string, userId: string, status: string) {
    return this.prisma.eventRsvp.upsert({
      where: {
        eventId_userId: { eventId, userId }
      },
      update: { status },
      create: {
        eventId,
        userId,
        groupId,
        status
      }
    });
  }
}
