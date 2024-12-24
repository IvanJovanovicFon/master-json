import { Body, Controller, Post, HttpException, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { OracleService } from './oracle/oracle.service';
import { SqlServerService } from './sqlServer/mssql.service'
import { PostgresService } from './postgres/postgres.service';

@Controller('/api/movies')
export class MoviesController {
    constructor(
        private readonly oracleService: OracleService,
        private readonly sqlServerService: SqlServerService,
        private readonly postgresService: PostgresService,
    ) {}

    @Post()
    async handleMovieRequest(@Body() body: { jsonType: string; movieData: any }) {
        const { jsonType, movieData } = body;

        if (!jsonType || !movieData) {
            throw new HttpException('jsonType and movieData are required.', HttpStatus.BAD_REQUEST);
        }

        switch (jsonType) {
            case 'oracle_json':
            case 'oracle_blob':
                return await this.oracleService.handleMovieData(jsonType, movieData);

            case 'mssql_json':
            case 'mssql_varchar':
                return await this.sqlServerService.handleMovieData(jsonType, movieData);

            case 'postgres_json':
            case 'postgres_jsonb':
                return await this.postgresService.handleMovieData(jsonType, movieData);

            default:
                throw new HttpException(`Unsupported jsonType: ${jsonType}`, HttpStatus.BAD_REQUEST);
        }
    }
}
