import {Injectable} from '@nestjs/common';
import {InjectDataSource} from "@nestjs/typeorm";
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";
import {performance} from 'perf_hooks';

@Injectable()
export class SqlServerService {
    private cachedMovieData: any = null;

    constructor(
        @InjectDataSource('mssqlConnection') private readonly dataSource: DataSource) {
    }

    async handleMovieData(jsonType: string, movieData: Movie): Promise<any> {
        try {
            let query: string;
            let parameters: any;
            let message: string;

            if (jsonType === 'mssql_varchar') {
                query = `
                    INSERT INTO [JSONMASTER].[dbo].[MASTER] (nvarcharcolumn, JSONTYPE)
                    VALUES ('${JSON.stringify(movieData)}', '${jsonType}')
                `;
                parameters = {movieData: JSON.stringify(movieData), jsonType};
                message = 'Stored in MSSQL as NVARCHAR';
            } else {
                return {message: 'Invalid JSON type', data: null};
            }

            const startTime = performance.now();
            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;
            await this.dataSource.manager.query(query, parameters);
            const endTime = performance.now();
            const cpuUsageDiff = process.cpuUsage(cpuStart);    // CPU usage diff (user + system)
            const memEnd = process.memoryUsage().heapUsed;

            const latency = endTime - startTime;
            const cpuUsageTotal = cpuUsageDiff.system;
            const memUsageDiff = memEnd - memStart;

            console.log(`Insert latency for ${jsonType}: ${latency.toFixed(5)} ms`);
            console.log(`CPU usage for ${jsonType}: ${cpuUsageTotal} µs`);
            console.log(`Memory change for ${jsonType}: ${memUsageDiff} bytes`);

            return {
                message,
                data: movieData,
                latency,
                cpuUsage: cpuUsageTotal,
                memoryUsage: memUsageDiff
            };
        } catch (error) {
            console.log('Error inserting movie data:', error);
            throw error;
        }
    }
    async updateMovieData(id: number, movieData: any, jsonType: string): Promise<any> {
        try {
            if (jsonType !== 'mssql_varchar') {
                return { message: 'Invalid JSON type', data: null };
            }

            const cpuStart = process.cpuUsage();           // Capture CPU usage (in microseconds)
            const memStart = process.memoryUsage().heapUsed; // Capture heap memory (in bytes)
            const query = `
                  UPDATE [JSONMASTER].[dbo].[MASTER]
                  SET nvarcharcolumn = '${JSON.stringify(movieData)}'
                  WHERE ID = '${id}'
                `;
            const queryStart = performance.now();
            await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart;
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal =  cpuUsageDiff.system;
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart;

            console.log(`Update query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory usage change: ${memUsageDiff} bytes`);

            return {
                message: 'Updated in MSSQL as NVARCHAR',
                data: movieData,
                metrics: {
                    queryLatency,       // Time taken by the database update query (ms)
                    cpuUsage: cpuUsageTotal,   // CPU time consumed during the operation (µs)
                    memoryUsage: memUsageDiff  // Change in heap memory (bytes)
                }
            };
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
            const updateQueries: { path: string; value: string | null; isString: boolean }[] = [];

            const buildUpdateQueries = (path: string, current: any, updated: any) => {
                for (const key in updated) {
                    if (updated[key] && typeof updated[key] === 'object' && !Array.isArray(updated[key])) {
                        buildUpdateQueries(`${path}.${key}`, current[key] || {}, updated[key]);
                    } else if (updated[key] !== current[key]) {
                        const updatePath = `${path}.${key}`;
                        let newValue: string | null;
                        let isString = false;
                        if (updated[key] === null) {
                            newValue = null;
                        } else if (typeof updated[key] === 'string') {
                            newValue = updated[key];
                            isString = true;
                        } else {
                            newValue = JSON.stringify(updated[key]);
                        }
                        updateQueries.push({ path: updatePath, value: newValue, isString });
                    }
                }
            };
            buildUpdateQueries('$', currentData, newMovieData);

            if (updateQueries.length === 0) {
                return { message: 'No changes detected', data: null };
            }

            for (const update of updateQueries) {
                let formattedValue: string;
                if (update.value === null) {
                    formattedValue = 'NULL';
                } else if (update.isString) {
                    formattedValue = `${update.value}`;
                } else {
                    formattedValue = update.value;
                }

                const query = `
                UPDATE [JSONMASTER].[dbo].[MASTER]
                SET nvarcharcolumn = JSON_MODIFY(nvarcharcolumn, '${update.path}', '${formattedValue}')
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
            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;

            const query = `
                SELECT nvarcharColumn, JSONTYPE
                FROM [JSONMASTER].[dbo].[MASTER]
                WHERE ID = (${movieId})
            `;
            const queryStart = performance.now();
            const result = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart;
            let mappingLatency = 0;

            if (result && result.length > 0) {
                const movieData = result[0];

                if (movieData.nvarcharColumn) {
                    let parsedJson:Movie;
                    const mappingStart = performance.now();
                    try {
                        parsedJson = JSON.parse(movieData.nvarcharColumn);
                    } catch (error) {
                        return {message: 'Invalid JSON in nvarcharColumn', data: null};
                    }
                    const mappingEnd = performance.now();
                    mappingLatency = mappingEnd - mappingStart;

                    this.cachedMovieData = {
                        jsonType: movieData.JSONTYPE,
                        data: parsedJson
                    };

                    const cpuUsageDiff = process.cpuUsage(cpuStart);
                    const cpuUsageTotal = cpuUsageDiff.system; // in microseconds
                    const memEnd = process.memoryUsage().heapUsed;
                    const memUsageDiff = memEnd - memStart; // in bytes

                    console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
                    console.log(`Mapping latency: ${mappingLatency.toFixed(5)} ms`);
                    console.log(`CPU usage: ${cpuUsageTotal} µs`);
                    console.log(`Memory usage change: ${memUsageDiff} bytes`);

                    return {
                        message: 'Movie data retrieved from NVARCHAR as JSON',
                        jsonType: movieData.JSONTYPE,
                        data: parsedJson,
                        metrics: {
                            queryLatency,       // Time for query execution (ms)
                            mappingLatency,     // Time for JSON parsing (ms)
                            cpuUsage: cpuUsageTotal,   // CPU time used (µs)
                            memoryUsage: memUsageDiff  // Memory change (bytes)
                        }
                    };
                }
            }

            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal =  cpuUsageDiff.system;
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart;

            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory usage change: ${memUsageDiff} bytes`);

            return {
                message: 'No movie data found',
                data: null,
                metrics: {

                    cpuUsage: cpuUsageTotal,
                    memoryUsage: memUsageDiff
                }
            };
        } catch (error) {
            console.log('Error retrieving movie data:', error);
            throw error;
        }
    }
    async findAllByType(jsonType: string) {
        try {
            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;
            let query: string;

            if (jsonType === 'mssql_varchar') {
                query = `
                    SELECT nvarcharColumn
                    FROM [JSONMASTER].[dbo].[MASTER]
                    WHERE nvarcharColumn IS NOT NULL
                `;
            } else {
                return {message: 'Invalid JSON type for MSSQL', data: null};
            }

            const queryStart = performance.now();
            const result: any[] = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart; // in milliseconds

            const mappingStart = performance.now();
            const processedData = result.map((row) => {
                try {
                    const parsedJson = JSON.parse(row.nvarcharColumn);
                    return {data: parsedJson};
                } catch (error) {
                    return {data: null, error: 'Invalid JSON in nvarcharColumn'};
                }
            });
            const mappingEnd = performance.now();
            const mappingLatency = mappingEnd - mappingStart;
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal =  cpuUsageDiff.system;
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart;

            // Log the performance metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`Mapping latency: ${mappingLatency.toFixed(5)} ms`);

            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            // Return the retrieved data along with the performance metrics
            return {
                message: `Retrieved data from ${jsonType}`,
                data: processedData,
                metrics: {
                    queryLatency,       // Time taken by the database to execute the query
                    mappingLatency,     // Time taken to parse/format the result set
                    cpuUsage: cpuUsageTotal,   // Total CPU time consumed (user + system in µs)
                    memoryUsage: memUsageDiff  // Change in heap memory during the operation (bytes)
                }
            };
        } catch (error) {
            console.error('Error retrieving movie data:', error);
            throw new Error('Failed to retrieve movie data from the database.');
        }
    }
    async deleteMovie(id: number) {
        try {
            let query: string;

            query = `DELETE
                     FROM [JSONMASTER].[dbo].[MASTER]
                     WHERE ID = ${id}`;

            await this.dataSource.manager.query(query);
            return {message: `Movie with ID ${id} deleted successfully from Oracle`};
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }
}
