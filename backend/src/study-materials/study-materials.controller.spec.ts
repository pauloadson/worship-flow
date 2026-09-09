import { Test, TestingModule } from '@nestjs/testing';
import { StudyMaterialsController } from './study-materials.controller.js';

import { StudyMaterialsService } from './study-materials.service.js';

describe('StudyMaterialsController', () => {
  let controller: StudyMaterialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudyMaterialsController],
      providers: [
        {
          provide: StudyMaterialsService,
          useValue: {},
        }
      ]
    }).compile();

    controller = module.get<StudyMaterialsController>(StudyMaterialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
