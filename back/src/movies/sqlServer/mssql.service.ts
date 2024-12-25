import { Injectable } from '@nestjs/common';
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";

@Injectable()
export class SqlServerService {
  constructor(
      @InjectDataSource('mssqlConnection') private readonly dataSource: DataSource, // Correct connection name
  ) {
  }

  async handleMovieData(jsonType: string, movieData: Movie): Promise<any> {
    try {
      if (jsonType === 'mssql_varchar') {
        const query = `
                    INSERT INTO MASTER (id, nvarcharcolumn)
                    VALUES (1, $1)
                `;
        const parameters = [JSON.stringify(movieData)];
        await this.dataSource.manager.query(query, parameters);
        return {message: 'Stored in MSSQL as NVARCHAR', data: movieData};

      } else if (jsonType === 'mssql_json') {
        const query = `
                    INSERT INTO MASTER (nvarcharcolumn)
                    VALUES (:movieData)
                `;
        const parameters = [JSON.stringify(movieData)];

        await this.dataSource.manager.query(query, parameters);
        return {message: 'Stored in MSSQL as nebitno', data: movieData};
      }

      return {message: 'Invalid JSON type', data: null};
    } catch (error) {
      console.log('Error inserting movie data:', error);
      throw error;
    }
  }
}
