import { Injectable } from '@nestjs/common';

@Injectable()
export class SqlServerService {
  async handleMovieData(jsonType: string, movieData: any): Promise<any> {
    // Add logic to handle SQL Server-specific operations here
    if (jsonType === 'mssql_json') {
      return { message: 'Stored in SQL Server as JSON', data: movieData };
    } else if (jsonType === 'mssql_varchar') {
      return { message: 'Stored in SQL Server as VARCHAR', data: movieData };
    }
  }
}
