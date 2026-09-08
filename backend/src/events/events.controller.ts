import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('groups/:groupId/events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getEvents(@Param('groupId') groupId: string) {
    return this.eventsService.getEvents(groupId);
  }

  @Post()
  createEvent(
    @Param('groupId') groupId: string,
    @Body() data: any,
    @Request() req: any
  ) {
    return this.eventsService.createEvent(groupId, data, req.user.sub);
  }

  @Delete(':eventId')
  deleteEvent(
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string
  ) {
    return this.eventsService.deleteEvent(groupId, eventId);
  }

  @Put(':eventId/rsvp')
  updateRsvp(
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string,
    @Body('status') status: string,
    @Body('role') role: string,
    @Body('userId') targetUserId: string,
    @Request() req: any
  ) {
    const userId = targetUserId || req.user.sub;
    return this.eventsService.updateRsvp(groupId, eventId, userId, status, role);
  }

  @Post(':eventId/songs')
  addSong(
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string,
    @Body('songId') songId: string
  ) {
    return this.eventsService.addSongToEvent(groupId, eventId, songId);
  }

  @Delete(':eventId/songs/:songId')
  removeSong(
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string,
    @Param('songId') songId: string
  ) {
    return this.eventsService.removeSongFromEvent(groupId, eventId, songId);
  }

  @Get('schedules')
  getSchedules(@Param('groupId') groupId: string) {
    return this.eventsService.getSchedules(groupId);
  }

  @Post('schedules')
  createSchedule(
    @Param('groupId') groupId: string,
    @Body() data: any
  ) {
    return this.eventsService.createSchedule(groupId, data);
  }

  @Delete('schedules/:scheduleId')
  deleteSchedule(
    @Param('groupId') groupId: string,
    @Param('scheduleId') scheduleId: string
  ) {
    return this.eventsService.deleteSchedule(groupId, scheduleId);
  }
}
