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
                    INSERT INTO MOVIES (MOVIEJSON, JSONTYPE)
                    VALUES (:movieData, :jsonType)
                `;
                const parameters = [JSON.stringify(movieData), jsonType];
                await this.dataSource.manager.query(query, parameters);
                return {message: 'Stored in ORACLE as JSON', data: movieData};

            } else if (jsonType === 'oracle_blob') {
                const query = `
                    INSERT INTO MOVIES (MOVIECLOB, JSONTYPE) 
                    VALUES (:movieData, :jsonType)
                `;
                const parameters = [JSON.stringify(movieData), jsonType];

                await this.dataSource.manager.query(query, parameters);
                return {message: 'Stored in ORACLE as BLOB', data: movieData};
            }

            return {message: 'Invalid JSON type', data: null};
        } catch (error) {
            console.log('Error inserting movie data:', error);
            throw error;
        }
    }

    async updateMovieData(id: number, movieData: any, jsonType: string): Promise<any> {
        try {
            if (jsonType === 'oracle_json') {
                const query = `
                UPDATE MOVIES
                SET MOVIEJSON = :movieData
                WHERE ID = :id
            `;
                const parameters = [JSON.stringify(movieData), id];

                await this.dataSource.manager.query(query, parameters);
                return { message: 'Updated in ORACLE as JSON', data: movieData };

            } else if (jsonType === 'oracle_blob') {
                const query = `
                UPDATE MOVIES
                SET MOVIECLOB = :movieData
                WHERE ID = :id
            `;
                const parameters = [JSON.stringify(movieData), id];

                await this.dataSource.manager.query(query, parameters);
                return { message: 'Updated in ORACLE as BLOB', data: movieData };
            }

            return { message: 'Invalid JSON type', data: null };
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }


    async readData(movieId: number): Promise<any> {
        try {
            const query = `SELECT MOVIEJSON, MOVIECLOB, JSONTYPE
                       FROM MOVIES
                       WHERE ID = :movieId`;
            const parameters = [movieId];
            const result = await this.dataSource.manager.query(query, parameters);

            if (result && result.length > 0) {
                const movieData = result[0];

                // Object to store the final response
                const response: any = {
                    jsonType: movieData.JSONTYPE || null, // Include JSONTYPE
                    data: null,
                };

                if (movieData.MOVIEJSON) {
                    try {
                        response.message = 'Movie data retrieved as JSON';
                        response.data = movieData.MOVIEJSON;
                        return response;
                    } catch (error) {
                        response.message = 'Invalid JSON in MOVIEJSON column';
                        response.data = null;
                        return response;
                    }
                }

                if (movieData.MOVIECLOB) {
                    try {
                        const jsonString = movieData.MOVIECLOB.toString();
                        const parsedJson = JSON.parse(jsonString); // Try to parse it as JSON
                        response.message = 'Movie data retrieved from CLOB as JSON';
                        response.data = parsedJson;
                        return response;
                    } catch (error) {
                        response.message = 'Invalid JSON in MOVIECLOB column';
                        response.data = null;
                        return response;
                    }
                }

                response.message = 'No movie data found';
                return response;
            }

            return { message: 'No movie data found', data: null, jsonType: null };
        } catch (error) {
            console.log('Error retrieving movie data:', error);
            throw error;
        }
    }

    async findAllByType(jsonType: string) {
        try {
            let query: string;
            let result: any[];

            if (jsonType === 'oracle_json') {
                query = `
                SELECT MOVIEJSON
                FROM MOVIES
                WHERE MOVIEJSON IS NOT NULL
            `;
            } else if (jsonType === 'oracle_blob') {
                query = `
                SELECT MOVIECLOB
                FROM MOVIES
                WHERE MOVIECLOB IS NOT NULL
            `;
            } else {
                return { message: 'Invalid JSON type', data: null };
            }

            result = await this.dataSource.manager.query(query);

            return {
                message: `Retrieved data from ${jsonType}`,
                data: result.map((row) => {
                    if (jsonType === 'oracle_blob') {
                        try {
                            const parsedBlob = JSON.parse(row.MOVIECLOB);
                            return { data: parsedBlob };
                        } catch {
                            return { data: null, error: 'Invalid JSON in BLOB' };
                        }
                    }
                    return { data: row.MOVIEJSON };
                }),
            };
        } catch (error) {
            console.error('Error retrieving movie data:', error);
            throw new Error('Failed to retrieve movie data from the database.');
        }
    }

    async deleteMovie(id: number) {
        try {
        let query: string;
        let parameters: any[]

        query = `DELETE FROM MOVIES WHERE ID = :id`;
        parameters = [id];

            await this.dataSource.manager.query(query, parameters);
            return { message: `Movie with ID ${id} deleted successfully from Oracle` };
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }
}