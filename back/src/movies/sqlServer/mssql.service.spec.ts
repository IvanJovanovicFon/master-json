import { Test, TestingModule } from '@nestjs/testing';
import { SqlServerService } from './mssql.service';

describe('MssqlService', () => {
  let service: SqlServerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqlServerService],
    }).compile();

    service = module.get<SqlServerService>(SqlServerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
