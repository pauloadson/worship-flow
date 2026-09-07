import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

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

  @Put(':eventId/rsvp')
  updateRsvp(
    @Param('groupId') groupId: string,
    @Param('eventId') eventId: string,
    @Body('status') status: string,
    @Request() req: any
  ) {
    return this.eventsService.updateRsvp(groupId, eventId, req.user.sub, status);
  }
}
