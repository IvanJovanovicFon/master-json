import { Injectable } from '@nestjs/common';
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";

@Injectable()
export class SqlServerService {
  constructor(
      @InjectDataSource('mssqlConnection') private readonly dataSource: DataSource  ) {
  }

  async handleMovieData(jsonType: string, movieData: Movie): Promise<any> {
    try {
      if (jsonType === 'mssql_varchar') {
       const parameters =  [JSON.stringify(movieData), jsonType];
               const query = `
                    INSERT INTO [JSONMASTER].[dbo].[MASTER] (nvarcharcolumn, JSONTYPE)
                    VALUES ('${JSON.stringify(movieData)}', '${jsonType}')
                `;
        await this.dataSource.manager.query(query, parameters);
        return {message: 'Stored in MSSQL as NVARCHAR', data: movieData};

      } else if (jsonType === 'mssql_json') {
        const query = `
                    INSERT INTO MASTER (nvarcharcolumn, JSONTYPE)
                    VALUES (${movieData})
                `;
        //const parameters = [JSON.stringify(movieData)];

        await this.dataSource.manager.query(query);
        return {message: 'Stored in MSSQL as nebitno', data: movieData};
      }

      return {message: 'Invalid JSON type', data: null};
    } catch (error) {
      console.log('Error inserting movie data:', error);
      throw error;
    }
  }

    async udateMovieData(id: number, movieData: any) {
        return Promise.resolve(undefined);
    }

    async readData(movieId: number): Promise<any> {
        try {
            const query = `SELECT nvarcharColumn FROM [JSONMASTER].[dbo].[MASTER] WHERE ID = ( ${movieId})`;
            const result = await this.dataSource.manager.query(query);

            if (result && result.length > 0) {
                const movieData = result[0];

                if (movieData.nvarcharColumn) {
                    try {
                        // Check if MOVIEJSON is a valid JSON string
                        const parsedJson = JSON.parse(movieData.nvarcharColumn); // Parse the NVARCHAR column as JSON
                        return { message: 'Movie data retrieved from NVARCHAR as JSON', data: parsedJson };
                    } catch (error) {
                        return { message: 'Invalid JSON in MOVIEJSON column', data: null };
                    }
                }
            }

            return { message: 'No movie data found', data: null };
        } catch (error) {
            console.log('Error retrieving movie data:', error);
            throw error;
        }
    }

    async findAllByType(jsonType: string) {
        try {
            let query: string;
            let result: any[];

            // Check if the requested type is valid for MSSQL
            if (jsonType === 'mssql_varchar') {
                query = `
                SELECT nvarcharColumn
                FROM [JSONMASTER].[dbo].[MASTER]
                WHERE nvarcharColumn IS NOT NULL
            `;
            } else {
                return { message: 'Invalid JSON type for MSSQL', data: null };
            }

            // Execute the query
            result = await this.dataSource.manager.query(query);

            // Format and return the result
            return {
                message: `Retrieved data from ${jsonType}`,
                data: result.map((row) => {
                    try {
                        // Parse the nvarcharColumn content as JSON
                        const parsedJson = JSON.parse(row.nvarcharColumn);
                        return { data: parsedJson };
                    } catch (error) {
                        // Handle invalid JSON in nvarcharColumn
                        return { data: null, error: 'Invalid JSON in nvarcharColumn' };
                    }
                }),
            };
        } catch (error) {
            console.error('Error retrieving movie data:', error);
            throw new Error('Failed to retrieve movie data from the database.');
        }
    }

}
