import { Controller, Post, Get, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { SongsService } from './songs.service.js';
import { CreateSongDto, UpdateSongDto } from './dto/index.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Post()
  create(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Body() dto: CreateSongDto,
  ) {
    return this.songsService.create(req.user.sub, groupId, dto);
  }

  @Get()
  findAll(@Req() req: any, @Param('groupId') groupId: string) {
    return this.songsService.findAllByGroup(req.user.sub, groupId);
  }

  @Put(':id')
  update(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSongDto,
  ) {
    return this.songsService.update(req.user.sub, groupId, id, dto);
  }

  @Delete(':id')
  delete(
    @Req() req: any,
    @Param('groupId') groupId: string,
    @Param('id') id: string,
  ) {
    return this.songsService.delete(req.user.sub, groupId, id);
  }
}
