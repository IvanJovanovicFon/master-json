import {Body, Controller, Post, HttpException, HttpStatus, Inject, forwardRef} from '@nestjs/common';
import {OracleService} from './oracle/oracle.service';
import {SqlServerService} from './sqlServer/mssql.service'
import {PostgresService} from './postgres/postgres.service';
import {Movie} from "../Model/movie";

@Controller('/api/movies')
export class MoviesController {
    constructor(
        private readonly oracleService: OracleService,
        private readonly sqlServerService: SqlServerService,
        private readonly postgresService: PostgresService,
    ) {
    }

    @Post()
    async handleMovieRequest(@Body() body: {movie: Movie, jsonType: string }) {
        const {movie, jsonType } = body;
        if (!jsonType || !movie) {
            throw new HttpException('jsonType and movieData are required.', HttpStatus.BAD_REQUEST);
        }

        switch (jsonType) {
            case 'oracle_json':
            case 'oracle_blob':
                return await this.oracleService.handleMovieData(jsonType, movie);

            case 'mssql_json':
            case 'mssql_varchar':
                return await this.sqlServerService.handleMovieData(jsonType, movie);

            case 'postgres_json':
            case 'postgres_jsonb':
                return await this.postgresService.handleMovieData(jsonType, movie);

            default:
                throw new HttpException(`Unsupported jsonType: ${jsonType}`, HttpStatus.BAD_REQUEST);
        }
    }
}
