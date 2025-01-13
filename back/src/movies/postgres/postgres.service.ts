import { Injectable } from '@nestjs/common';
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";
import {InjectDataSource} from "@nestjs/typeorm";

@Injectable()
export class PostgresService {
    constructor(
        @InjectDataSource('postgresConnection') private readonly dataSource: DataSource, // Correct connection name
    ) {}// Inject the PostgreSQL DataSource


  async handleMovieData(jsonType: string, movieData: Movie): Promise<any> {
    try {
      if (jsonType === 'postgres_json') {
          console.log("postgresjon123")
        const query = `
          INSERT INTO master (json, jsontype)
          VALUES ($1, $2)
        `;
        const parameters = [JSON.stringify(movieData), jsonType]; // Array of values for positional parameters
console.log(parameters)
        await this.dataSource.manager.query(query, parameters); // Execute the query
        return { message: 'Stored in Postgres as JSON', data: movieData };

      } else if (jsonType === 'postgres_jsonb') {
        const query = `
          INSERT INTO master (jsonb, jsontype)
          VALUES ($1, $2)
        `;
        const parameters = [JSON.stringify(movieData), jsonType]; // Array of values for positional parameters

        await this.dataSource.manager.query(query, parameters); // Execute the query
        return { message: 'Stored in Postgres as JSONB', data: movieData };
      }

      return { message: 'Invalid JSON type', data: null };
    } catch (error) {
      console.log('Error inserting movie data:', error);
      throw error;
    }
  }

    async updateMovieData(id: number, movieData: any, jsonType: string): Promise<any> {
        try {
            if (jsonType === 'postgres_json') {
                const query = `
                UPDATE master
                SET json = $1
                WHERE id = $2
            `;
                const parameters = [JSON.stringify(movieData), id];
                console.log(parameters);
                await this.dataSource.manager.query(query, parameters);
                return { message: 'Updated in Postgres as JSON', data: movieData };

            } else if (jsonType === 'postgres_jsonb') {
                const query = `
                UPDATE master
                SET jsonb = $1
                WHERE id = $2
            `;
                const parameters = [JSON.stringify(movieData), id];
                await this.dataSource.manager.query(query, parameters);
                return { message: 'Updated in Postgres as JSONB', data: movieData };
            }

            return { message: 'Invalid JSON type', data: null };
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }

    async readData(movieId: number): Promise<any> {
        try {
            const query = `
            SELECT json, jsonb, jsontype
            FROM master
            WHERE ID = $1
        `;
            const parameters = [movieId]; // Parameterized query for safety

            // Execute query
            const result = await this.dataSource.manager.query(query, parameters);

            if (result && result.length > 0) {
                const movieData = result[0];


                if (movieData.json) {
                    return {
                        message: 'Movie data retrieved as JSON',
                        data: movieData.json,
                        jsonType: movieData.jsontype
                    };
                }

                // Check if jsonb exists and return it along with jsonType
                if (movieData.jsonb) {
                    return {
                        message: 'Movie data retrieved as JSONB',
                        data: movieData.jsonb,
                        jsonType: movieData.jsontype
                    };
                }
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

            // Determine the query based on the JSON type
            if (jsonType === 'postgres_json') {
                query = `
                SELECT json
                FROM master
                WHERE json IS NOT NULL
            `;
            } else if (jsonType === 'postgres_jsonb') {
                query = `
                SELECT jsonb
                FROM master
                WHERE jsonb IS NOT NULL
            `;
            } else {
                return { message: 'Invalid JSON type', data: null };
            }

            // Execute the query
            result = await this.dataSource.manager.query(query);

            // Format and return the result
            return {
                message: `Retrieved data from ${jsonType}`,
                data: result.map((row) => {
                    // For both JSON and JSONB, the content is directly usable
                    return { data: row.json || row.jsonb };
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

            query = `DELETE FROM master WHERE ID = $1`;
            parameters = [id];

            await this.dataSource.manager.query(query, parameters);
            return { message: `Movie with ID ${id} deleted successfully from PostreSQL` };
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }
} 
