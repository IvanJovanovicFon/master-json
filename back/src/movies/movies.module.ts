import { Module } from '@nestjs/common';
import { MoviesServiceOracle } from './Services/movies.service.oracle';
import {MoviesController} from "./movies.controller";
import {ConfigService} from "@nestjs/config";

@Module({
  controllers:[MoviesController],
  providers: [MoviesServiceOracle, ConfigService]
})
export class MoviesModule {}
