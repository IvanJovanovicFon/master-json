import { Injectable } from '@nestjs/common';
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";

@Injectable()
export class SqlServerService {
    private cachedMovieData: any = null;

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
            if (jsonType === 'mssql_varchar') {
                const query = `
                UPDATE [JSONMASTER].[dbo].[MASTER]
                SET nvarcharcolumn = '${JSON.stringify(movieData)}'
                WHERE ID = '${id}'
            `;

                await this.dataSource.manager.query(query);
                return { message: 'Updated in MSSQL as NVARCHAR', data: movieData };

            }
            return { message: 'Invalid JSON type', data: null };
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }

    async updatePartOfMovie(id: number, newMovieData: any, jsonType: string): Promise<any> {
        try {

            if (jsonType !== 'mssql_varchar') {
                return { message: 'Invalid JSON type', data: null };
            }


            if (!this.cachedMovieData || !this.cachedMovieData.data) {
                return { message: 'No cached data available for comparison', data: null };
            }

            const currentData = this.cachedMovieData.data;
            const updateQueries: { path: string; value: string | null }[] = [];

            // Recursively compare objects and collect changes
            const buildUpdateQueries = (path: string, current: any, updated: any) => {
                for (const key in updated) {
                    if (updated[key] && typeof updated[key] === 'object' && !Array.isArray(updated[key])) {
                        // Recursively compare nested objects
                        buildUpdateQueries(`${path}.${key}`, current[key] || {}, updated[key]);
                    } else if (updated[key] !== current[key]) {
                        // Collect updates
                        const updatePath = `${path}.${key}`;
                        const newValue = updated[key] === null ? null : JSON.stringify(updated[key]).replace(/'/g, "''");
                        updateQueries.push({ path: updatePath, value: newValue });
                    }
                }
            };

            // Start comparing from the root
            buildUpdateQueries('$.', currentData, newMovieData);

            if (updateQueries.length === 0) {
                return { message: 'No changes detected', data: null };
            }

            // Execute each update individually
            for (const update of updateQueries) {
                const query = `
                UPDATE [JSONMASTER].[dbo].[MASTER]
                SET nvarcharcolumn = JSON_MODIFY(nvarcharcolumn, '${update.path}', ${
                    update.value === null ? 'NULL' : `'${update.value}'`
                })
                WHERE ID = '${id}'
            `;
                await this.dataSource.manager.query(query);
            }

            return { message: 'Partially updated movie data', updatedFields: updateQueries };
        } catch (error) {
            console.error('Error updating part of movie data:', error);
            throw error;
        }
    }


  async readData(movieId: number): Promise<any> {
        try {
            const query = `
                SELECT nvarcharColumn, JSONTYPE 
                FROM [JSONMASTER].[dbo].[MASTER] 
                WHERE ID = (${movieId})
            `;
            const result = await this.dataSource.manager.query(query);

            if (result && result.length > 0) {
                const movieData = result[0];

                if (movieData.nvarcharColumn) {
                    try {
                        const parsedJson = JSON.parse(movieData.nvarcharColumn);

                        this.cachedMovieData = {
                            jsonType: movieData.JSONTYPE,
                            data: parsedJson
                        };

                        return {
                            message: 'Movie data retrieved from NVARCHAR as JSON',
                            jsonType: movieData.JSONTYPE,
                            data: parsedJson
                        };
                    } catch (error) {
                        return { message: 'Invalid JSON in nvarcharColumn', data: null };
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
