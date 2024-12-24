import { Module } from '@nestjs/common';
import { MssqlService } from './mssql.service';
import { MssqlController } from './mssql.controller';

@Module({
  controllers: [MssqlController],
  providers: [MssqlService],
})
export class MssqlModule {}
