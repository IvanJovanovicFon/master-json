import { Module } from '@nestjs/common';
import { OracleService } from './oracle.service';
import {MoviesController} from "../movies.controller";
import {ConfigService} from "@nestjs/config";

@Module({
  controllers:[MoviesController],
  providers: [OracleService, ConfigService]
})
export class MoviesModule {}
