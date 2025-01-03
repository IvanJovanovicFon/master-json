import {Body, Controller, Post, HttpException, HttpStatus, Inject, forwardRef, Get, Param, Put} from '@nestjs/common';
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

    @Get('/:database/:id')
    async getMovie(@Param('database') db: string, @Param('id') id: number) {

        switch (db) {
            case 'Oracle':
                return await this.oracleService.readData(id);

            case 'SQLServer':
                return await this.sqlServerService.readData(id);

            case 'PostgreSQL':
                return await this.postgresService.readData(id);

            default:
                throw new HttpException(`Unsupported db: ${db}`, HttpStatus.BAD_REQUEST);
        }
    }

    @Put('/:database/:id')
    async updateMovie(
        @Param('database') db: string,
        @Param('id') id: number,
        @Body() movieData: any,
    ) {
        switch (db) {
            case 'oracle':
                return await this.oracleService.updateMovieData(id,movieData);

            case 'mssql':
                return await this.sqlServerService.udateMovieData(id,movieData);

            case 'postgres':
                return await this.postgresService.updateMovieData(id,movieData);

            default:
                throw new HttpException(`Unsupported db: ${db}`, HttpStatus.BAD_REQUEST);
        }
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
