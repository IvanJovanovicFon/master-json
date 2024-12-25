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
} 
