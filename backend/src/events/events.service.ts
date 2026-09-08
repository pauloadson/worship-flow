import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

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

  async deleteEvent(groupId: string, eventId: string) {
    if (eventId.startsWith('virtual_')) {
      // It's a virtual event, can't delete it directly. The user can delete the schedule instead.
      return { success: true };
    }
    
    return this.prisma.event.delete({
      where: { id: eventId, groupId }
    });
  }

  async getEvents(groupId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(in30Days.getDate() + 30);

    // Get real events
    const realEvents = await this.prisma.event.findMany({
      where: { 
        groupId,
        date: { gte: today, lte: in30Days }
      },
      include: {
        rsvps: {
          include: {
            member: {
              include: { user: { select: { name: true, id: true } } }
            }
          }
        },
        songs: {
          include: { song: true }
        }
      }
    });

    // Get recurring schedules
    const schedules = await this.prisma.recurringSchedule.findMany({
      where: { groupId }
    });

    const virtualEvents = [];
    for (const sched of schedules) {
      const [hour, minute] = sched.time.split(':').map(Number);
      
      for (let i = 0; i <= 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        if (d.getDay() === sched.dayOfWeek) {
          d.setHours(hour, minute, 0, 0);
          
          const exists = realEvents.find(re => re.date.getTime() === d.getTime());
          if (!exists) {
            virtualEvents.push({
              id: `virtual_${sched.id}_${d.getTime()}`,
              title: sched.title,
              date: d,
              eventType: sched.eventType,
              groupId: groupId,
              rsvps: [],
              songs: [],
              isVirtual: true
            });
          }
        }
      }
    }

    return [...realEvents, ...virtualEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private async ensureRealEvent(groupId: string, eventId: string) {
    if (!eventId.startsWith('virtual_')) return eventId;
    
    const parts = eventId.split('_');
    const schedId = parts[1];
    const timestamp = Number(parts[2]);
    const date = new Date(timestamp);
    
    const sched = await this.prisma.recurringSchedule.findUnique({ where: { id: schedId } });
    if (!sched) throw new Error('Schedule not found');

    const realEvent = await this.prisma.event.upsert({
      where: { groupId_date: { groupId, date } },
      update: {},
      create: {
        groupId,
        title: sched.title,
        date: date,
        eventType: sched.eventType
      }
    });
    return realEvent.id;
  }

  async updateRsvp(groupId: string, eventId: string, userId: string, status?: string, role?: string) {
    const realEventId = await this.ensureRealEvent(groupId, eventId);

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (role !== undefined) updateData.role = role;

    return this.prisma.eventRsvp.upsert({
      where: {
        eventId_userId: { eventId: realEventId, userId }
      },
      update: updateData,
      create: {
        eventId: realEventId,
        userId,
        groupId,
        status: status || 'CONFIRMED',
        role
      }
    });
  }

  async addSongToEvent(groupId: string, eventId: string, songId: string) {
    const realEventId = await this.ensureRealEvent(groupId, eventId);
    const count = await this.prisma.eventSong.count({ where: { eventId: realEventId } });
    
    return this.prisma.eventSong.create({
      data: {
        eventId: realEventId,
        songId,
        order: count
      }
    });
  }

  async removeSongFromEvent(groupId: string, eventId: string, songId: string) {
    return this.prisma.eventSong.delete({
      where: { eventId_songId: { eventId, songId } }
    });
  }

  async getSchedules(groupId: string) {
    return this.prisma.recurringSchedule.findMany({ where: { groupId }, orderBy: [{dayOfWeek: 'asc'}, {time: 'asc'}] });
  }

  async createSchedule(groupId: string, data: any) {
    return this.prisma.recurringSchedule.create({
      data: {
        groupId,
        dayOfWeek: parseInt(data.dayOfWeek),
        time: data.time,
        title: data.title,
        eventType: data.eventType || 'Culto'
      }
    });
  }

  async deleteSchedule(groupId: string, scheduleId: string) {
    return this.prisma.recurringSchedule.delete({
      where: { id: scheduleId }
    });
  }
}
