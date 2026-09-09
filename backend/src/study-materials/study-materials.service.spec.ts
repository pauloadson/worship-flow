import { Test, TestingModule } from '@nestjs/testing';
import { StudyMaterialsService } from './study-materials.service.js';

import { PrismaService } from '../prisma/prisma.service.js';

describe('StudyMaterialsService', () => {
  let service: StudyMaterialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudyMaterialsService,
        {
          provide: PrismaService,
          useValue: {},
        }
      ],
    }).compile();

    service = module.get<StudyMaterialsService>(StudyMaterialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
