import {
    Body,
    Controller,
    Post,
    HttpException,
    HttpStatus,
    Inject,
    forwardRef,
    Get,
    Param,
    Put,
    Query, Delete
} from '@nestjs/common';
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

    @Put('/:database/:id/:jsonType')
    async updateMovie(
        @Param('database') db: string,
        @Param('id') id: number,
        @Param('jsonType') jsonType: string,
        @Body() movieData: Movie,
    ) {
        switch (db) {
            case 'Oracle':
                return await this.oracleService.updateMovieData(id,movieData, jsonType);

            case 'SQLServer':
                return await this.sqlServerService.updateMovieData(id,movieData, jsonType);

            case 'PostgreSQL':
                return await this.postgresService.updateMovieData(id,movieData, jsonType);

            default:
                throw new HttpException(`Unsupported db: ${db}`, HttpStatus.BAD_REQUEST);
        }
    }

    @Put('/partOfMovie/:database/:id/:jsonType')
    async updatePartOfMovie(
        @Param('database') db: string,
        @Param('id') id: number,
        @Param('jsonType') jsonType: string,
        @Body() movieData: Movie,
    ) {
        switch (db) {
            case 'Oracle':
                return await this.oracleService.updatePartOfMovie(id,movieData, jsonType);

            case 'SQLServer':
                return await this.sqlServerService.updatePartOfMovie(id,movieData, jsonType);

            case 'PostgreSQL':
                return await this.postgresService.updatePartOfMovie(id,movieData, jsonType);

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
            case 'oracle_clob':
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

    @Get('findAll')
    async findAllMovies(@Query('selectedOption') selectedOption: string) {
        const jsonType  = selectedOption;
        console.log(jsonType)
        if (!jsonType ) {
            throw new HttpException('jsonType is required.', HttpStatus.BAD_REQUEST);
        }

        switch (jsonType) {
            case 'oracle_json':
            case 'oracle_clob':
                return await this.oracleService.findAllByType(jsonType);

            case 'mssql_json':
            case 'mssql_varchar':
                return await this.sqlServerService.findAllByType(jsonType);

            case 'postgres_json':
            case 'postgres_jsonb':
                return await this.postgresService.findAllByType(jsonType);

            default:
                throw new HttpException(`Unsupported jsonType: ${jsonType}`, HttpStatus.BAD_REQUEST);
        }
    }

    @Delete('delete/:databaseType/:id')
    async deleteMovie(
        @Param('databaseType') databaseType: string,
        @Param('id') id: number,
    ): Promise<any> {
        switch (databaseType) {
            case 'Oracle':
                return await this.oracleService.deleteMovie(id);

            case 'SQLServer':
                return await this.sqlServerService.deleteMovie(id);

            case 'PostgreSQL':
                return await this.postgresService.deleteMovie(id);

            default:
                throw new HttpException(`Unsupported db: ${databaseType}`, HttpStatus.BAD_REQUEST);
        }
    }
}
