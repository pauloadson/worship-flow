import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('groups/:groupId/events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  getEvents(@Request() req: any, @Param('groupId') groupId: string) {
    return this.eventsService.getEvents(req.user.sub, groupId);
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
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string
  ) {
    return this.eventsService.deleteEvent(req.user.sub, groupId, eventId);
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
    // We pass req.user.sub to verify if the requester has permission to update this RSVP
    return this.eventsService.updateRsvp(req.user.sub, groupId, eventId, userId, status, role);
  }

  @Post(':eventId/songs')
  addSong(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string,
    @Body('songId') songId: string
  ) {
    return this.eventsService.addSongToEvent(req.user.sub, groupId, eventId, songId);
  }

  @Delete(':eventId/songs/:songId')
  removeSong(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string,
    @Param('songId') songId: string
  ) {
    return this.eventsService.removeSongFromEvent(req.user.sub, groupId, eventId, songId);
  }

  @Get('schedules')
  getSchedules(@Request() req: any, @Param('groupId') groupId: string) {
    return this.eventsService.getSchedules(req.user.sub, groupId);
  }

  @Post('schedules')
  createSchedule(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Body() data: any
  ) {
    return this.eventsService.createSchedule(req.user.sub, groupId, data);
  }

  @Delete('schedules/:scheduleId')
  deleteSchedule(
    @Request() req: any,
    @Param('groupId') groupId: string,
    @Param('scheduleId') scheduleId: string
  ) {
    return this.eventsService.deleteSchedule(req.user.sub, groupId, scheduleId);
  }
}
