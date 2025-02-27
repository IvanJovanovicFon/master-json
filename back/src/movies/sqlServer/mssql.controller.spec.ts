import { Test, TestingModule } from '@nestjs/testing';
import { MssqlController } from './mssql.controller';
import { SqlServerService } from './mssql.service';

describe('MssqlController', () => {
  let controller: MssqlController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MssqlController],
      providers: [SqlServerService],
    }).compile();

    controller = module.get<MssqlController>(MssqlController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
