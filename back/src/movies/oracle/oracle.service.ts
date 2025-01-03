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

    async updateMovieData(id: number, movieData: any) {
        return Promise.resolve(undefined);
    }

    async readData( movieId: number): Promise<any> {
        try {

            const query = `SELECT MOVIEJSON, MOVIECLOB FROM MOVIES WHERE ID = :movieId`;
            const parameters = [movieId];
            const result = await this.dataSource.manager.query(query, parameters);

            if (result && result.length > 0) {
                const movieData = result[0];

                if (movieData.MOVIEJSON) {
                    try {
                        const parsedJson = JSON.parse(movieData.MOVIEJSON);
                        return { message: 'Movie data retrieved as JSON', data: parsedJson };
                    } catch (error) {
                        return { message: 'Invalid JSON in MOVIEJSON column', data: null };
                    }
                }


                if (movieData.MOVIECLOB) {
                    const jsonString = movieData.MOVIECLOB.toString();
                    try {
                        const parsedJson = JSON.parse(jsonString); // Try to parse it as JSON
                        return { message: 'Movie data retrieved from BLOB as JSON', data: parsedJson };
                    } catch (error) {
                        return { message: 'Invalid JSON in MOVIECLOB column', data: null };
                    }
                }
            }

            return { message: 'No movie data found', data: null };
        } catch (error) {
            console.log('Error retrieving movie data:', error);
            throw error;
        }
    }
}