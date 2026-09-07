import { Module } from '@nestjs/common';
import { SongsService } from './songs.service.js';
import { SongsController } from './songs.controller.js';

@Module({
  providers: [SongsService],
  controllers: [SongsController]
})
export class SongsModule {}
