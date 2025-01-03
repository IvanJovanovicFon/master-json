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
          INSERT INTO master (json)
          VALUES ($1)
        `;
        const parameters = [JSON.stringify(movieData)]; // Array of values for positional parameters
console.log(parameters)
        await this.dataSource.manager.query(query, parameters); // Execute the query
        return { message: 'Stored in Postgres as JSON', data: movieData };

      } else if (jsonType === 'postgres_jsonb') {
        const query = `
          INSERT INTO master (jsonb)
          VALUES ($1)
        `;
        const parameters = [JSON.stringify(movieData)]; // Array of values for positional parameters

        await this.dataSource.manager.query(query, parameters); // Execute the query
        return { message: 'Stored in Postgres as JSONB', data: movieData };
      }

      return { message: 'Invalid JSON type', data: null };
    } catch (error) {
      console.log('Error inserting movie data:', error);
      throw error;
    }
  }

    async updateMovieData(id: number, movieData: any) {
        return Promise.resolve(undefined);
    }

    async readData(movieId: number): Promise<any> {
        try {
            // Adjusted query for PostgreSQL to retrieve JSON or JSONB columns
            const query = `
      SELECT json, jsonb
      FROM master
      WHERE ID = $1
    `;
            const parameters = [movieId]; // Parameterized query for safety

            // Execute query
            const result = await this.dataSource.manager.query(query, parameters);

            if (result && result.length > 0) {
                const movieData = result[0];

                // Check if MOVIEJSON is a valid JSON type (PostgreSQL will automatically return it as a JavaScript object)
                if (movieData.json) {
                    return { message: 'Movie data retrieved as JSON', data: movieData.json };
                }

                // Check if MOVIEJSONB is a valid JSONB type (PostgreSQL will automatically return it as a JavaScript object)
                if (movieData.jsonb) {
                    return { message: 'Movie data retrieved as JSONB', data: movieData.jsonb };
                }
            }

            return { message: 'No movie data found', data: null };
        } catch (error) {
            console.log('Error retrieving movie data:', error);
            throw error;
        }
    }


} 
