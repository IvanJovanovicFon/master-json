import { Test, TestingModule } from '@nestjs/testing';
import { MssqlService } from './mssql.service';

describe('MssqlService', () => {
  let service: MssqlService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MssqlService],
    }).compile();

    service = module.get<MssqlService>(MssqlService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
