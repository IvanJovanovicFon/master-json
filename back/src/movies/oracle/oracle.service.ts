import {Injectable} from '@nestjs/common';
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";
import {InjectDataSource} from "@nestjs/typeorm";
import {performance} from 'perf_hooks';


@Injectable()
export class OracleService {
    private cachedMovieData: { id: number; data: string } | null = null;

    constructor(
        @InjectDataSource('oracleConnection') private readonly dataSource: DataSource, // Correct connection name
    ) {
    }

    async handleMovieData(jsonType: string, movieData: Movie): Promise<any> {
        try {
            let query: string;
            let parameters: any[];
            let message: string;

            if (jsonType === 'oracle_json') {
                query = `
                    INSERT INTO MOVIES (MOVIEJSON, JSONTYPE)
                    VALUES (:movieData, :jsonType)
                `;
                parameters = [JSON.stringify(movieData), jsonType];
                message = 'Stored in Oracle as JSON';
            } else if (jsonType === 'oracle_blob') {
                query = `
                    INSERT INTO MOVIES (MOVIECLOB, JSONTYPE)
                    VALUES (:movieData, :jsonType)
                `;
                parameters = [JSON.stringify(movieData), jsonType];
                message = 'Stored in Oracle as BLOB';
            } else {
                return {message: 'Invalid JSON type', data: null};
            }

            // Capture performance metrics before the query
            const startTime = performance.now();
            const cpuStart = process.cpuUsage();               // CPU usage (in microseconds)
            const memStart = process.memoryUsage().heapUsed;     // Memory usage in bytes

            // Execute the insert query
            await this.dataSource.manager.query(query, parameters);

            // Capture performance metrics after the query
            const endTime = performance.now();
            const cpuUsageDiff = process.cpuUsage(cpuStart);     // Difference in CPU usage
            const memEnd = process.memoryUsage().heapUsed;

            // Calculate metrics
            const latency = endTime - startTime;                 // Latency in milliseconds
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // Total CPU usage (µs)
            const memUsageDiff = memEnd - memStart;              // Memory change in bytes

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
            if (jsonType === 'oracle_json') {
                const query = `
                    UPDATE MOVIES
                    SET MOVIEJSON = :movieData
                    WHERE ID = :id
                `;
                const parameters = [JSON.stringify(movieData), id];

                await this.dataSource.manager.query(query, parameters);
                return {message: 'Updated in ORACLE as JSON', data: movieData};

            } else if (jsonType === 'oracle_blob') {
                const query = `
                    UPDATE MOVIES
                    SET MOVIECLOB = :movieData
                    WHERE ID = :id
                `;
                const parameters = [JSON.stringify(movieData), id];

                await this.dataSource.manager.query(query, parameters);
                return {message: 'Updated in ORACLE as BLOB', data: movieData};
            }

            return {message: 'Invalid JSON type', data: null};
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }

    async readData(movieId: number): Promise<any> {
        try {
            // Start overall performance measurement
            const overallStart = performance.now();
            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;

            // --- Query Execution Measurement ---
            const queryStart = performance.now();
            const query = `
                SELECT MOVIEJSON, MOVIECLOB, JSONTYPE
                FROM MOVIES
                WHERE ID = :movieId
            `;
            const parameters = [movieId];
            const result = await this.dataSource.manager.query(query, parameters);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart;

            // --- Process the Result and Measure JSON Parsing ---
            let response: any = {jsonType: null, data: null};
            let jsonParsingTime = 0;

            if (result && result.length > 0) {
                const movieData = result[0];
                response.jsonType = movieData.JSONTYPE || null;

                if (movieData.MOVIEJSON) {
                    const parsingStart = performance.now();
                    try {
                        // If the JSON is stored directly in the column, no parsing may be needed.
                        this.cachedMovieData = {id: movieId, data: movieData.MOVIEJSON};
                        response.message = 'Movie data retrieved as JSON';
                        response.data = movieData.MOVIEJSON;
                    } catch (error) {
                        response.message = 'Invalid JSON in MOVIEJSON column';
                        response.data = null;
                    }
                    const parsingEnd = performance.now();
                    jsonParsingTime = parsingEnd - parsingStart;
                } else if (movieData.MOVIECLOB) {
                    const parsingStart = performance.now();
                    try {
                        const jsonString = movieData.MOVIECLOB.toString();
                        const parsedJson = JSON.parse(jsonString);
                        this.cachedMovieData = {id: movieId, data: movieData.MOVIECLOB};
                        response.message = 'Movie data retrieved from CLOB as JSON';
                        response.data = parsedJson;
                    } catch (error) {
                        response.message = 'Invalid JSON in MOVIECLOB column';
                        response.data = null;
                    }
                    const parsingEnd = performance.now();
                    jsonParsingTime = parsingEnd - parsingStart;
                } else {
                    response.message = 'No movie data found';
                }
            } else {
                response = {message: 'No movie data found', data: null, jsonType: null};
            }

            // --- Overall Metrics ---
            const overallEnd = performance.now();
            const overallLatency = overallEnd - overallStart;
            const cpuUsageDiff = process.cpuUsage(cpuStart); // { user, system } in microseconds
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system;
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart;

            // Log the metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`JSON parsing latency: ${jsonParsingTime.toFixed(5)} ms`);
            console.log(`Overall read latency: ${overallLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            // Include the metrics in the response
            response.metrics = {
                queryLatency,
                jsonParsingTime,
                overallLatency,
                cpuUsage: cpuUsageTotal,
                memoryUsage: memUsageDiff,
            };

            return response;
        } catch (error) {
            console.log('Error retrieving movie data:', error);
            throw error;
        }
    }

    async  findAllByType(jsonType: string) {
        try {
            // Overall start time and resource measurements
            const overallStart = performance.now();
            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;

            // Determine the appropriate query based on jsonType
            let query: string;
            if (jsonType === 'oracle_json') {
                query = `
        SELECT MOVIEJSON
        FROM MOVIES
        WHERE MOVIEJSON IS NOT NULL
      `;
            } else if (jsonType === 'oracle_blob') {
                query = `
        SELECT MOVIECLOB
        FROM MOVIES
        WHERE MOVIECLOB IS NOT NULL
      `;
            } else {
                return { message: 'Invalid JSON type', data: null };
            }

            // Measure query execution time
            const queryStart = performance.now();
            const result: any[] = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart;

            // Process results and measure JSON parsing time (if needed)
            let totalJsonParsingTime = 0;
            const processedData = result.map((row) => {
                if (jsonType === 'oracle_blob') {
                    const parseStart = performance.now();
                    let parsedData;
                    try {
                        parsedData = JSON.parse(row.MOVIECLOB);
                    } catch (e) {
                        parsedData = null;
                        // Optionally, log or capture the error for this row
                    }
                    const parseEnd = performance.now();
                    totalJsonParsingTime += (parseEnd - parseStart);
                    return { data: parsedData };
                }
                // For 'oracle_json', we assume the JSON is already in a usable form.
                return { data: row.MOVIEJSON };
            });

            // Capture overall resource measurements after processing
            const overallEnd = performance.now();
            const overallLatency = overallEnd - overallStart;
            const cpuUsageDiff = process.cpuUsage(cpuStart); // in microseconds
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system;
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart;

            // Log the performance metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`Total JSON parsing latency: ${totalJsonParsingTime.toFixed(5)} ms`);
            console.log(`Overall operation latency: ${overallLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            // Return the data along with the performance metrics
            return {
                message: `Retrieved data from ${jsonType}`,
                data: processedData,
                metrics: {
                    queryLatency,           // Time to execute the query
                    jsonParsingTime: totalJsonParsingTime,  // Total time to parse JSON data (for BLOBs)
                    overallLatency,         // Total time for the entire operation
                    cpuUsage: cpuUsageTotal,  // CPU time used in microseconds
                    memoryUsage: memUsageDiff // Change in heap memory in bytes
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
                     FROM MOVIES
                     WHERE ID = :id`;
            parameters = [id];

            await this.dataSource.manager.query(query, parameters);
            return {message: `Movie with ID ${id} deleted successfully from Oracle`};
        } catch (error) {
            console.error('Error deleting movie:', error);
            throw error;
        }
    }

    async updatePartOfMovie(
        id: number,
        newMovieData: any,
        jsonType: string
    ): Promise<any> {
        try {
            console.log(this.cachedMovieData)
            const cachedData = this.cachedMovieData?.id === id ? this.cachedMovieData.data : null;

            if (!cachedData) {
                return {message: 'No cached data available for comparison', data: null};
            }

            const patchDocument = this.generateJsonMergePatch(cachedData, newMovieData);

            if (!patchDocument || Object.keys(patchDocument).length === 0) {
                return {message: 'No changes detected', data: null};
            }

            let query: string;
            if (jsonType === 'oracle_json') {
                query = `
                    UPDATE MOVIES
                    SET MOVIEJSON = JSON_MERGEPATCH(MOVIEJSON, :patchDocument)
                    WHERE ID = :id
                `;
            } else if (jsonType === 'oracle_blob') {
                query = `
                    UPDATE MOVIES
                    SET MOVIECLOB = JSON_MERGEPATCH(MOVIECLOB, :patchDocument)
                    WHERE ID = :id
                `;
            } else {
                return {message: 'Invalid JSON type', data: null};
            }

            const parameters = [JSON.stringify(patchDocument), id];
            await this.dataSource.manager.query(query, parameters);

            return {
                message: 'Updated successfully using JSON Merge Patch',
                updatedFields: patchDocument,
            };
        } catch (error) {
            console.log('Error updating changed parts of movie:', error);
            throw error;
        }
    }

    private generateJsonMergePatch(cachedData: any, newData: any): any {
        const patch: any = {};

        for (const key in newData) {
            if (newData[key] === null && key in cachedData) {
                patch[key] = null;
            } else if (JSON.stringify(newData[key]) !== JSON.stringify(cachedData[key])) {
                patch[key] = newData[key];
                console.log(patch[key])
            }
        }

        return patch;
    }


}