import {Injectable} from '@nestjs/common';
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";
import {InjectDataSource} from "@nestjs/typeorm";
import {performance} from 'perf_hooks';

@Injectable()
export class PostgresService {
    private cachedMovieData: { id: number; data: any } | null = null;


    constructor(
        @InjectDataSource('postgresConnection') private readonly dataSource: DataSource, // Correct connection name
    ) {
    }



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
                return {message: 'Invalid JSON type', data: null};
            }


            const startTime = performance.now();
            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;


            await this.dataSource.manager.query(query, parameters);


            const endTime = performance.now();
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const memEnd = process.memoryUsage().heapUsed;


            const latency = endTime - startTime;                 // Latency in milliseconds
            const cpuUsageTotal = cpuUsageDiff.system; // Total CPU usage (µs)
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


            let query: string;
            let parameters: any[];
            let message: string;

            if (jsonType === 'postgres_json') {
                query = `
                    UPDATE master
                    SET json = $1
                    WHERE id = $2
                `;
                parameters = [JSON.stringify(movieData), id];
                message = 'Updated in Postgres as JSON';
            } else if (jsonType === 'postgres_jsonb') {
                query = `
                    UPDATE master
                    SET jsonb = $1
                    WHERE id = $2
                `;
                parameters = [JSON.stringify(movieData), id];
                message = 'Updated in Postgres as JSONB';
            } else {
                return {message: 'Invalid JSON type', data: null};
            }


            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;
            const queryStart = performance.now();
            await this.dataSource.manager.query(query, parameters);
            const queryEnd = performance.now();
            const memEnd = process.memoryUsage().heapUsed;
            const queryLatency = queryEnd - queryStart;
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal =  cpuUsageDiff.system;
            const memUsageDiff = memEnd - memStart;

            console.log(`Update query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            return {
                message,
                data: movieData,
                metrics: {
                    queryLatency,
                    cpuUsage: cpuUsageTotal,
                    memoryUsage: memUsageDiff
                }
            };
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

            let mappingLatency = 0;
            let response: any = {message: '', data: null, jsonType: null};
            if (result && result.length > 0) {
                const movieData = result[0];

                const mappingStart = performance.now();
                if (movieData.json) {
                    this.cachedMovieData = {id: movieId, data: movieData.json};
                    response = {
                        message: 'Movie data retrieved as JSON',
                        data: movieData.json,
                        jsonType: movieData.jsontype,
                    };
                } else if (movieData.jsonb) {
                    this.cachedMovieData = {id: movieId, data: movieData.jsonb};
                    response = {
                        message: 'Movie data retrieved as JSONB',
                        data: movieData.jsonb,
                        jsonType: movieData.jsontype,
                    };
                } else {
                    response = {message: 'No movie data found', data: null, jsonType: null};
                }
                const mappingEnd = performance.now();
                mappingLatency = mappingEnd - mappingStart; // in milliseconds
            } else {
                response = {message: 'No movie data found', data: null, jsonType: null};
            }

            // End overall measurement
            const overallEnd = performance.now();
            const overallLatency = overallEnd - overallStart; // in milliseconds

            // Calculate CPU usage and memory change
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal = cpuUsageDiff.system; // Total CPU time in microseconds
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart; // Change in memory usage (bytes)

            // Log performance metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`Mapping latency: ${mappingLatency.toFixed(5)} ms`);

            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory usage change: ${memUsageDiff} bytes`);

            // Attach metrics to the response
            response.metrics = {
                queryLatency,       // Database query execution time in ms
                mappingLatency,     // Time spent processing the result set in ms
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

            if (!this.cachedMovieData || this.cachedMovieData.id !== id) {
                return { message: 'No cached data available for comparison', data: null };
            }

            const currentData = this.cachedMovieData.data;
            const updateQueries: { path: string; value: string | null }[] = [];

            const buildUpdateQueries = (pathArr: string[], current: any, updated: any) => {
                for (const key in updated) {
                    if (updated[key] !== undefined && updated[key] !== null) {
                        if (typeof updated[key] === 'object' && !Array.isArray(updated[key])) {
                            buildUpdateQueries([...pathArr, key], current ? current[key] || {} : {}, updated[key]);
                        } else if (updated[key] !== current[key]) {
                            const updatePath = `{${[...pathArr, key].join(',')}}`;
                            const newValue = JSON.stringify(updated[key]);
                            updateQueries.push({ path: updatePath, value: newValue });
                        }
                    } else {
                        console.warn(`Skipping undefined or null value for key: ${key}`);
                    }
                }
            };

            buildUpdateQueries([], currentData, newMovieData);

            if (updateQueries.length === 0) {
                return { message: 'No changes detected', data: null };
            }

            const queryMetrics: { path: string; latencyMs: number; cpuUsage: number, memoryUsage: number }[] = [];

            for (const update of updateQueries) {
                let updateQuery = '';
                const parameters = [update.path, update.value, id];

                if (jsonType === 'postgres_jsonb') {
                    updateQuery = `
                    UPDATE master
                    SET jsonb = jsonb_set(jsonb, $1, $2::jsonb)
                    WHERE id = $3
                `;
                } else if (jsonType === 'postgres_json') {
                    updateQuery = `
                    UPDATE master
                    SET json = (jsonb_set(json::jsonb, $1, $2::jsonb))::json
                    WHERE id = $3
                `;
                }
                const cpuStart = process.cpuUsage();           // CPU snapshot in microseconds
                const memStart = process.memoryUsage().heapUsed; // Heap memory snapshot in bytes
                const queryStart = performance.now();
                await this.dataSource.manager.query(updateQuery, parameters);

                const queryEnd = performance.now();
                const queryLatency = queryEnd - queryStart; // in milliseconds
                const cpuUsageDiff = process.cpuUsage(cpuStart);
                const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // in microseconds
                const memEnd = process.memoryUsage().heapUsed;
                const memUsageDiff = memEnd - memStart; // in bytes

                console.log(`Update partial query latency: ${queryLatency.toFixed(5)} ms`);
                console.log(`CPU usage: ${cpuUsageTotal} µs`);
                console.log(`Memory usage change: ${memUsageDiff} bytes`);

                queryMetrics.push({
                    path: update.path,
                    latencyMs: queryLatency,       // Time taken by the database to execute the update query (ms)
                    cpuUsage: cpuUsageTotal,   // Total CPU time consumed during the operation (µs)
                    memoryUsage: memUsageDiff
                });
            }

            return {
                message: 'Partially updated movie data',
                updatedFields: updateQueries,

            };
        } catch (error) {
            console.error('Error updating part of movie data:', error);
            throw error;
        }
    }
    async findAllByType(jsonType: string) {
        try {
            let query: string;

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
                return {message: 'Invalid JSON type', data: null};
            }

            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;
            const queryStart = performance.now();
            const result: any[] = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart;

            const mappingStart = performance.now();
            const processedData = result.map((row) => {
                return {data: row.json || row.jsonb};
            });
            const mappingEnd = performance.now();
            const mappingLatency = mappingEnd - mappingStart; // Mapping time in ms

            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal = cpuUsageDiff.system; // in microseconds
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart; // in bytes

            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`Mapping latency: ${mappingLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            // Return both the data and the performance metrics
            return {
                message: `Retrieved data from ${jsonType}`,
                data: processedData,
                metrics: {
                    queryLatency,       // Time spent executing the query
                    mappingLatency,     // Time spent mapping the results
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

            query = `DELETE
                     FROM master
                     WHERE ID = $1`;
            parameters = [id];

            await this.dataSource.manager.query(query, parameters);
            return {message: `Movie with ID ${id} deleted successfully from PostreSQL`};
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }
}
