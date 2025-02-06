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
            } else if (jsonType === 'mssql_json') {
                query = `
                    INSERT INTO [JSONMASTER].[dbo].[MASTER] (nvarcharcolumn, JSONTYPE)
                    VALUES ('${JSON.stringify(movieData)}', '${jsonType}')
                `;
                parameters = {movieData: JSON.stringify(movieData), jsonType};
                message = 'Stored in MSSQL as JSON';
            } else {
                return {message: 'Invalid JSON type', data: null};
            }

            // Capture performance metrics before executing the query
            const startTime = performance.now();
            const cpuStart = process.cpuUsage();              // CPU usage (in microseconds)
            const memStart = process.memoryUsage().heapUsed;    // Heap memory usage in bytes

            // Execute the query
            await this.dataSource.manager.query(query, parameters);

            // Capture performance metrics after the query
            const endTime = performance.now();
            const cpuUsageDiff = process.cpuUsage(cpuStart);    // CPU usage diff (user + system)
            const memEnd = process.memoryUsage().heapUsed;

            // Calculate metrics
            const latency = endTime - startTime;                // Latency in milliseconds
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // Total CPU usage in µs
            const memUsageDiff = memEnd - memStart;             // Change in memory usage in bytes

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
            if (jsonType === 'mssql_varchar') {
                const query = `
                    UPDATE [JSONMASTER].[dbo].[MASTER]
                    SET nvarcharcolumn = '${JSON.stringify(movieData)}'
                    WHERE ID = '${id}'
                `;

                await this.dataSource.manager.query(query);
                return {message: 'Updated in MSSQL as NVARCHAR', data: movieData};

            }
            return {message: 'Invalid JSON type', data: null};
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }

    async updatePartOfMovie(id: number, newMovieData: any, jsonType: string): Promise<any> {
        try {

            if (jsonType !== 'mssql_varchar') {
                return {message: 'Invalid JSON type', data: null};
            }


            if (!this.cachedMovieData || !this.cachedMovieData.data) {
                return {message: 'No cached data available for comparison', data: null};
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
                        updateQueries.push({path: updatePath, value: newValue});
                    }
                }
            };

            // Start comparing from the root
            buildUpdateQueries('$.', currentData, newMovieData);

            if (updateQueries.length === 0) {
                return {message: 'No changes detected', data: null};
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

            return {message: 'Partially updated movie data', updatedFields: updateQueries};
        } catch (error) {
            console.error('Error updating part of movie data:', error);
            throw error;
        }
    }


    async readData(movieId: number): Promise<any> {
        try {
            // --- Overall Metrics Start ---
            const overallStart = performance.now();
            const cpuStart = process.cpuUsage();           // CPU snapshot in microseconds
            const memStart = process.memoryUsage().heapUsed; // Memory snapshot in bytes

            // --- Execute Query ---
            const query = `
                SELECT nvarcharColumn, JSONTYPE
                FROM [JSONMASTER].[dbo].[MASTER]
                WHERE ID = (${movieId})
            `;
            const queryStart = performance.now();
            const result = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart; // in milliseconds

            let mappingLatency = 0;

            // --- Process and Map the Result ---
            if (result && result.length > 0) {
                const movieData = result[0];

                if (movieData.nvarcharColumn) {
                    const mappingStart = performance.now();
                    let parsedJson;
                    try {
                        parsedJson = JSON.parse(movieData.nvarcharColumn);
                    } catch (error) {
                        return {message: 'Invalid JSON in nvarcharColumn', data: null};
                    }
                    const mappingEnd = performance.now();
                    mappingLatency = mappingEnd - mappingStart; // in milliseconds

                    this.cachedMovieData = {
                        jsonType: movieData.JSONTYPE,
                        data: parsedJson
                    };

                    // --- Overall End Metrics ---
                    const overallEnd = performance.now();
                    const overallLatency = overallEnd - overallStart; // in milliseconds

                    // Calculate CPU and Memory usage differences
                    const cpuUsageDiff = process.cpuUsage(cpuStart);
                    const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // in microseconds
                    const memEnd = process.memoryUsage().heapUsed;
                    const memUsageDiff = memEnd - memStart; // in bytes

                    // Log all metrics
                    console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
                    console.log(`Mapping latency: ${mappingLatency.toFixed(5)} ms`);
                    console.log(`Overall latency: ${overallLatency.toFixed(5)} ms`);
                    console.log(`CPU usage: ${cpuUsageTotal} µs`);
                    console.log(`Memory usage change: ${memUsageDiff} bytes`);

                    return {
                        message: 'Movie data retrieved from NVARCHAR as JSON',
                        jsonType: movieData.JSONTYPE,
                        data: parsedJson,
                        metrics: {
                            queryLatency,       // Time for query execution (ms)
                            mappingLatency,     // Time for JSON parsing (ms)
                            overallLatency,     // Total operation time (ms)
                            cpuUsage: cpuUsageTotal,   // CPU time used (µs)
                            memoryUsage: memUsageDiff  // Memory change (bytes)
                        }
                    };
                }
            }

            // If no data was found, complete the overall measurement and return
            const overallEnd = performance.now();
            const overallLatency = overallEnd - overallStart; // in milliseconds
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // in microseconds
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart; // in bytes

            console.log(`Overall latency: ${overallLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory usage change: ${memUsageDiff} bytes`);

            return {
                message: 'No movie data found',
                data: null,
                metrics: {
                    overallLatency,
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
            // Start overall performance measurement
            const overallStart = performance.now();
            const cpuStart = process.cpuUsage();           // CPU usage at start (in microseconds)
            const memStart = process.memoryUsage().heapUsed; // Heap memory (in bytes)

            let query: string;

            // Check if the requested type is valid for MSSQL
            if (jsonType === 'mssql_varchar') {
                query = `
                    SELECT nvarcharColumn
                    FROM [JSONMASTER].[dbo].[MASTER]
                    WHERE nvarcharColumn IS NOT NULL
                `;
            } else {
                return {message: 'Invalid JSON type for MSSQL', data: null};
            }

            // Measure query execution time
            const queryStart = performance.now();
            const result: any[] = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart; // in milliseconds

            // Measure mapping (data formatting) time
            const mappingStart = performance.now();
            const processedData = result.map((row) => {
                try {
                    // Parse the nvarcharColumn content as JSON
                    const parsedJson = JSON.parse(row.nvarcharColumn);
                    return {data: parsedJson};
                } catch (error) {
                    // Handle invalid JSON in nvarcharColumn
                    return {data: null, error: 'Invalid JSON in nvarcharColumn'};
                }
            });
            const mappingEnd = performance.now();
            const mappingLatency = mappingEnd - mappingStart; // in milliseconds

            // End overall performance measurement
            const overallEnd = performance.now();
            const overallLatency = overallEnd - overallStart; // in milliseconds

            // Capture CPU usage difference and memory usage difference
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // in microseconds
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart; // in bytes

            // Log the performance metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`Mapping latency: ${mappingLatency.toFixed(5)} ms`);
            console.log(`Overall operation latency: ${overallLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            // Return the retrieved data along with the performance metrics
            return {
                message: `Retrieved data from ${jsonType}`,
                data: processedData,
                metrics: {
                    queryLatency,       // Time taken by the database to execute the query
                    mappingLatency,     // Time taken to parse/format the result set
                    overallLatency,     // Total time for the entire operation
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
