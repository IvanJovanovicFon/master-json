import {Injectable} from '@nestjs/common';
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";
import {InjectDataSource} from "@nestjs/typeorm";

@Injectable()
export class OracleService {
    constructor(
        @InjectDataSource('oracleConnection') private readonly dataSource: DataSource, // Correct connection name
    ) {
    }

    async handleMovieData(jsonType: string, movieData: Movie): Promise<any> {
        try {
            if (jsonType === 'oracle_json') {
                const query = `
                    INSERT INTO MOVIES (MOVIEJSON)
                    VALUES (:movieData)
                `;
                const parameters = [JSON.stringify(movieData)];
                await this.dataSource.manager.query(query, parameters);
                return {message: 'Stored in ORACLE as JSON', data: movieData};

            } else if (jsonType === 'oracle_blob') {
                const query = `
                    INSERT INTO MOVIES (MOVIECLOB)
                    VALUES (:movieData)
                `;
                const parameters = [JSON.stringify(movieData)];

                await this.dataSource.manager.query(query, parameters);
                return {message: 'Stored in ORACLE as BLOB', data: movieData};
            }

            return {message: 'Invalid JSON type', data: null};
        } catch (error) {
            console.log('Error inserting movie data:', error);
            throw error;
        }
    }
}