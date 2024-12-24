import { Test, TestingModule } from '@nestjs/testing';
import { PostgresController } from './postgres.controller';
import { PostgresService } from './postgres.service';

describe('PostgresController', () => {
  let controller: PostgresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostgresController],
      providers: [PostgresService],
    }).compile();

    controller = module.get<PostgresController>(PostgresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
