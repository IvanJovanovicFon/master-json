import { Injectable } from '@nestjs/common';

@Injectable()
export class PostgresService {
  async handleMovieData(jsonType: string, movieData: any): Promise<any> {
    // Add logic to handle Postgres-specific operations here
    if (jsonType === 'postgres_json') {
      return { message: 'Stored in Postgres as JSON', data: movieData };
    } else if (jsonType === 'postgres_jsonb') {
      return { message: 'Stored in Postgres as JSONB', data: movieData };
    }
  }
} 
