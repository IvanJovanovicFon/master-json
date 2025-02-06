import { Injectable } from '@nestjs/common';
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";
import {InjectDataSource} from "@nestjs/typeorm";
import { performance } from 'perf_hooks';

@Injectable()
export class PostgresService {
    private cachedMovieData: { id: number; data: any } | null = null;


    constructor(
        @InjectDataSource('postgresConnection') private readonly dataSource: DataSource, // Correct connection name
    ) {}// Inject the PostgreSQL DataSource


    async handleMovieData(jsonType: string, movieData: Movie): Promise<any> {
        try {
            let query: string;
            let parameters: any[];
            let message: string;

            if (jsonType === 'postgres_json') {
                query = `
        INSERT INTO master (json, jsontype)
        VALUES ($1, $2)
      `;
                parameters = [JSON.stringify(movieData), jsonType];
                message = 'Stored in Postgres as JSON';
            } else if (jsonType === 'postgres_jsonb') {
                query = `
        INSERT INTO master (jsonb, jsontype)
        VALUES ($1, $2)
      `;
                parameters = [JSON.stringify(movieData), jsonType];
                message = 'Stored in Postgres as JSONB';
            } else {
                return { message: 'Invalid JSON type', data: null };
            }

            // Capture performance metrics before executing the query
            const startTime = performance.now();
            const cpuStart = process.cpuUsage();               // CPU usage in microseconds
            const memStart = process.memoryUsage().heapUsed;     // Heap memory usage in bytes

            // Execute the query
            await this.dataSource.manager.query(query, parameters);

            // Capture performance metrics after the query
            const endTime = performance.now();
            const cpuUsageDiff = process.cpuUsage(cpuStart);     // Difference in CPU usage
            const memEnd = process.memoryUsage().heapUsed;

            // Calculate the metrics
            const latency = endTime - startTime;                 // Latency in milliseconds
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // Total CPU usage (µs)
            const memUsageDiff = memEnd - memStart;              // Change in memory usage (bytes)

            // Log the results
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
            if (jsonType === 'postgres_json') {
                const query = `
                UPDATE master
                SET json = $1
                WHERE id = $2
            `;
                const parameters = [JSON.stringify(movieData), id];
                console.log(parameters);
                await this.dataSource.manager.query(query, parameters);
                return { message: 'Updated in Postgres as JSON', data: movieData };

            } else if (jsonType === 'postgres_jsonb') {
                const query = `
                UPDATE master
                SET jsonb = $1
                WHERE id = $2
            `;
                const parameters = [JSON.stringify(movieData), id];
                await this.dataSource.manager.query(query, parameters);
                return { message: 'Updated in Postgres as JSONB', data: movieData };
            }

            return { message: 'Invalid JSON type', data: null };
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }

    async readData(movieId: number): Promise<any> {
        try {
            // Start overall measurement
            const overallStart = performance.now();
            const cpuStart = process.cpuUsage();           // CPU usage snapshot (in microseconds)
            const memStart = process.memoryUsage().heapUsed; // Memory usage snapshot (in bytes)

            // Prepare and execute the query
            const query = `
      SELECT json, jsonb, jsontype
      FROM master
      WHERE ID = $1
    `;
            const parameters = [movieId];

            // Measure query execution time
            const queryStart = performance.now();
            const result = await this.dataSource.manager.query(query, parameters);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart; // in milliseconds

            // Process the results and measure the mapping/processing latency
            let mappingLatency = 0;
            let response: any = { message: '', data: null, jsonType: null };
            if (result && result.length > 0) {
                const movieData = result[0];

                // Start mapping measurement
                const mappingStart = performance.now();
                if (movieData.json) {
                    this.cachedMovieData = { id: movieId, data: movieData.json };
                    response = {
                        message: 'Movie data retrieved as JSON',
                        data: movieData.json,
                        jsonType: movieData.jsontype,
                    };
                } else if (movieData.jsonb) {
                    this.cachedMovieData = { id: movieId, data: movieData.jsonb };
                    response = {
                        message: 'Movie data retrieved as JSONB',
                        data: movieData.jsonb,
                        jsonType: movieData.jsontype,
                    };
                } else {
                    response = { message: 'No movie data found', data: null, jsonType: null };
                }
                const mappingEnd = performance.now();
                mappingLatency = mappingEnd - mappingStart; // in milliseconds
            } else {
                response = { message: 'No movie data found', data: null, jsonType: null };
            }

            // End overall measurement
            const overallEnd = performance.now();
            const overallLatency = overallEnd - overallStart; // in milliseconds

            // Calculate CPU usage and memory change
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // Total CPU time in microseconds
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart; // Change in memory usage (bytes)

            // Log performance metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`Mapping latency: ${mappingLatency.toFixed(5)} ms`);
            console.log(`Overall operation latency: ${overallLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory usage change: ${memUsageDiff} bytes`);

            // Attach metrics to the response
            response.metrics = {
                queryLatency,       // Database query execution time in ms
                mappingLatency,     // Time spent processing the result set in ms
                overallLatency,     // Total time for the entire operation in ms
                cpuUsage: cpuUsageTotal, // Total CPU time used (µs)
                memoryUsage: memUsageDiff, // Change in heap memory (bytes)
            };

            return response;
        } catch (error) {
            console.error('Error retrieving movie data:', error);
            throw error;
        }
    }

    async updatePartOfMovie(id: number, newMovieData: any, jsonType: string): Promise<any> {
        try {
            if (jsonType !== 'postgres_json' && jsonType !== 'postgres_jsonb') {
                return { message: 'Invalid JSON type', data: null };
            }

            // Ensure cached data exists and corresponds to the provided ID
            if (!this.cachedMovieData || this.cachedMovieData.id !== id) {
                return { message: 'No cached data available for comparison', data: null };
            }

            const currentData = this.cachedMovieData.data;
            const updateQueries: { path: string; value: string | null }[] = [];

            // Recursively compare objects and collect changes
            const buildUpdateQueries = (path: string, current: any, updated: any) => {
                for (const key in updated) {
                    // Ensure the current and updated values are not undefined or null
                    if (updated[key] !== undefined && updated[key] !== null) {
                        // Check if the updated value is an object and recurse
                        if (updated[key] && typeof updated[key] === 'object' && !Array.isArray(updated[key])) {
                            buildUpdateQueries(`${path}.${key}`, current[key] || {}, updated[key]);
                        }
                        // Otherwise compare the primitive values
                        else if (updated[key] !== current[key]) {
                            const updatePath = `${path}.${key}`.replace(/\.(\d+)/g, '[$1]');
                            const newValue = updated[key] === null ? 'null' : JSON.stringify(updated[key]);
                            updateQueries.push({ path: updatePath, value: newValue });
                        }
                    } else {
                        // Handle cases where updated[key] is undefined or null
                        console.warn(`Skipping undefined or null value for key: ${key}`);
                    }
                }
            };

            buildUpdateQueries('$', currentData, newMovieData);

            if (updateQueries.length === 0) {
                return { message: 'No changes detected', data: null };
            }

            // Execute updates
            for (const update of updateQueries) {
                const updateQuery = `
                UPDATE master
                SET ${jsonType} = jsonb_set(${jsonType}, $1, $2::jsonb)
                WHERE id = $3
            `;
                const parameters = [update.path, update.value, id];
                await this.dataSource.manager.query(updateQuery, parameters);
            }

            return { message: 'Partially updated movie data', updatedFields: updateQueries };
        } catch (error) {
            console.error('Error updating part of movie data:', error);
            throw error;
        }
    }

    async  findAllByType(jsonType: string) {
        try {
            // Start overall measurement of the operation
            const overallStart = performance.now();
            const cpuStart = process.cpuUsage();           // CPU time before the operation
            const memStart = process.memoryUsage().heapUsed; // Memory usage before the operation

            let query: string;

            // Determine the query based on the JSON type
            if (jsonType === 'postgres_json') {
                query = `
        SELECT json
        FROM master
        WHERE json IS NOT NULL
      `;
            } else if (jsonType === 'postgres_jsonb') {
                query = `
        SELECT jsonb
        FROM master
        WHERE jsonb IS NOT NULL
      `;
            } else {
                return { message: 'Invalid JSON type', data: null };
            }

            // Measure the time taken for the query execution
            const queryStart = performance.now();
            const result: any[] = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart; // Query execution time in ms

            // Measure the time required to map/format the result rows
            const mappingStart = performance.now();
            const processedData = result.map((row) => {
                // For both JSON and JSONB, the content is directly usable
                return { data: row.json || row.jsonb };
            });
            const mappingEnd = performance.now();
            const mappingLatency = mappingEnd - mappingStart; // Mapping time in ms

            // End overall measurement
            const overallEnd = performance.now();
            const overallLatency = overallEnd - overallStart; // Total operation time in ms

            // Capture CPU usage and memory usage differences
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

            // Return both the data and the performance metrics
            return {
                message: `Retrieved data from ${jsonType}`,
                data: processedData,
                metrics: {
                    queryLatency,       // Time spent executing the query
                    mappingLatency,     // Time spent mapping the results
                    overallLatency,     // Total time for the entire operation
                    cpuUsage: cpuUsageTotal,   // CPU time used (in µs)
                    memoryUsage: memUsageDiff, // Memory change (in bytes)
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
            let parameters: any[]

            query = `DELETE FROM master WHERE ID = $1`;
            parameters = [id];

            await this.dataSource.manager.query(query, parameters);
            return { message: `Movie with ID ${id} deleted successfully from PostreSQL` };
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }

}
