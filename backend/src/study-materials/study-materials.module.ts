import { Module } from '@nestjs/common';
import { StudyMaterialsController } from './study-materials.controller.js';
import { StudyMaterialsService } from './study-materials.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [StudyMaterialsController],
  providers: [StudyMaterialsService],
})
export class StudyMaterialsModule {}
