import { Module } from '@nestjs/common';
import { SqlServerService } from './mssql.service';
import { MssqlController } from './mssql.controller';

@Module({
  controllers: [MssqlController],
  providers: [SqlServerService],
})
export class MssqlModule {}
