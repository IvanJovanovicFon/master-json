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

  async updateMovieData(id: number, movieData: any, jsonType: string): Promise<any> {
        try {
            // Check if the jsonType is 'mssql_varchar' for NVARCHAR column
            if (jsonType === 'mssql_varchar') {
                const query = `
                UPDATE [JSONMASTER].[dbo].[MASTER]
                SET nvarcharcolumn = '${JSON.stringify(movieData)}'
                WHERE ID = '${id}'
            `;

                await this.dataSource.manager.query(query);
                return { message: 'Updated in MSSQL as NVARCHAR', data: movieData };

            }
            // Handle invalid jsonType
            return { message: 'Invalid JSON type', data: null };
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }

    async readData(movieId: number): Promise<any> {
        try {
            const query =
                `SELECT nvarcharColumn, JSONTYPE 
                FROM [JSONMASTER].[dbo].[MASTER] 
                WHERE ID = ( ${movieId})`;
            const result = await this.dataSource.manager.query(query);

            if (result && result.length > 0) {
                const movieData = result[0];
                console.log(movieData)

                if (movieData.nvarcharColumn) {
                    try {
                        const parsedJson = JSON.parse(movieData.nvarcharColumn);
                        return { message: 'Movie data retrieved from NVARCHAR as JSON',
                            jsonType: movieData.JSONTYPE,
                            data: parsedJson
                        };
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

    async deleteMovie(id: number) {
        try {
            let query: string;

            query = `DELETE FROM  [JSONMASTER].[dbo].[MASTER] WHERE ID = ${id}`;

            await this.dataSource.manager.query(query);
            return { message: `Movie with ID ${id} deleted successfully from Oracle` };
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }
}
