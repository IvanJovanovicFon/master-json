import {Injectable} from '@nestjs/common';
import {DataSource} from "typeorm";
import {Movie} from "../../Model/movie";
import {InjectDataSource} from "@nestjs/typeorm";
import {performance} from 'perf_hooks';


@Injectable()
export class OracleService {

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
            } else if (jsonType === 'oracle_clob') {
                query = `
                    INSERT INTO MOVIES (MOVIECLOB, JSONTYPE)
                    VALUES (:movieData, :jsonType)
                `;
                parameters = [JSON.stringify(movieData), jsonType];
                message = 'Stored in Oracle as CLOB';
            } else {
                return {message: 'Invalid JSON type', data: null};
            }

            // Capture performance metrics before the query
            const startTime = performance.now();
            const cpuStart = process.cpuUsage();         // CPU usage (in microseconds)
            const memStart = process.memoryUsage().heapUsed;     // Memory usage in bytes

            await this.dataSource.manager.query(query, parameters);

            const endTime = performance.now();
            const cpuUsageDiff = process.cpuUsage(cpuStart);     // Difference in CPU usage
            const memEnd = process.memoryUsage().heapUsed;

            const latency = endTime - startTime;                 // Latency in milliseconds
            const cpuUsageTotal =  cpuUsageDiff.system;         // Total CPU usage (µs)
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

    async readData(movieId: number): Promise<any> {
        try {

            const query = `
                SELECT MOVIEJSON, MOVIECLOB, JSONTYPE
                FROM MOVIES
                WHERE ID = :movieId
            `;
            const parameters = [movieId];
            const cpuStart = process.cpuUsage();
            const memStart = process.memoryUsage().heapUsed;
            const queryStart = performance.now();
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


            const cpuUsageDiff = process.cpuUsage(cpuStart); // { user, system } in microseconds
            const cpuUsageTotal =cpuUsageDiff.system;
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart;

            // Log the metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`JSON parsing latency: ${jsonParsingTime.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            // Include the metrics in the response
            response.metrics = {
                queryLatency,
                jsonParsingTime,
                cpuUsage: cpuUsageTotal,
                memoryUsage: memUsageDiff,
            };

            return response;
        } catch (error) {
            console.log('Error retrieving movie data:', error);
            throw error;
        }
    }
    async updateMovieData(id: number, movieData: any, jsonType: string): Promise<any> {
        try {


            // Prepare the query, parameters, and message based on the jsonType
            let query: string;
            let parameters: any[];
            let message: string;

            if (jsonType === 'oracle_json') {
                query = `
                    UPDATE MOVIES
                    SET MOVIEJSON = JSON :movieData
                    WHERE ID = :id
                `;
                parameters = [JSON.stringify(movieData), id];
                message = 'Updated in ORACLE as JSON';
            } else if (jsonType === 'oracle_clob') {
                query = `
                    UPDATE MOVIES
                    SET MOVIECLOB = :movieData
                    WHERE ID = :id
                `;
                parameters = [JSON.stringify(movieData), id];
                message = 'Updated in ORACLE as CLOB';
            } else {
                return {message: 'Invalid JSON type', data: null};
            }

            // --- Measure Query Execution Latency ---
            const cpuStart = process.cpuUsage();           // Snapshot of CPU time in microseconds
            const memStart = process.memoryUsage().heapUsed; // Snapshot of heap memory (in bytes)
            const queryStart = performance.now();
            await this.dataSource.manager.query(query, parameters);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart; // Query execution time in milliseconds

                      // --- Calculate CPU and Memory Usage ---
            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal = cpuUsageDiff.system; // Total CPU time (µs)
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart; // Change in memory usage (bytes)

            // Log the metrics (for debugging or analysis)
            console.log(`Update query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory usage change: ${memUsageDiff} bytes`);

            return {
                message,
                data: movieData,
                metrics: {
                    queryLatency,       // Time taken by the update query itself (ms)
                    cpuUsage: cpuUsageTotal,   // CPU time consumed during the operation (µs)
                    memoryUsage: memUsageDiff  // Change in heap memory (bytes)
                }
            };
        } catch (error) {
            console.log('Error updating movie data:', error);
            throw error;
        }
    }
    async findAllByType(jsonType: string) {
        try {
            let query: string;
            if (jsonType === 'oracle_json') {
                query = `
                    SELECT MOVIEJSON
                    FROM MOVIES
                    WHERE MOVIEJSON IS NOT NULL
                `;
            } else if (jsonType === 'oracle_clob') {
                query = `
                    SELECT MOVIECLOB
                    FROM MOVIES
                    WHERE MOVIECLOB IS NOT NULL
                `;
            } else {
                return {message: 'Invalid JSON type', data: null};
            }

            // Measure query execution time
            const memStart = process.memoryUsage().heapUsed;
            const cpuStart = process.cpuUsage();
            const queryStart = performance.now();
            const result: any[] = await this.dataSource.manager.query(query);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart;


            const cpuUsageDiff = process.cpuUsage(cpuStart); // in microseconds
            const cpuUsageTotal =  cpuUsageDiff.system;
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart;

            let totalJsonParsingTime = 0;
            const processedData = result.map((row) => {
                if (jsonType === 'oracle_clob') {
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
                    return {data: parsedData};
                }
                return {data: row.MOVIEJSON};
            });



            // Log the performance metrics
            console.log(`Query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`Total JSON parsing latency: ${totalJsonParsingTime.toFixed(5)} ms`);

            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory change: ${memUsageDiff} bytes`);

            // Return the data along with the performance metrics
            return {
                message: `Retrieved data from ${jsonType}`,
                data: processedData,
                metrics: {
                    queryLatency,           // Time to execute the query
                    jsonParsingTime: totalJsonParsingTime,  // Total time to parse JSON data (for BLOBs)

                    cpuUsage: cpuUsageTotal,  // CPU time used in microseconds
                    memoryUsage: memUsageDiff // Change in heap memory in bytes
                }
            };
        } catch (error) {
            console.error('Error retrieving movie data:', error);
            throw new Error('Failed to retrieve movie data from the database.');
        }
    }

    async updatePartOfMovie(
        id: number,
        newMovieData: any,
        jsonType: string
    ): Promise<any> {
        try {

            let query: string;
            if (jsonType === 'oracle_json') {
                query = `
                    UPDATE MOVIES
                    SET MOVIEJSON = JSON_MERGEPATCH(MOVIEJSON, :newMovieData)
                    WHERE ID = :id
                `;
            } else if (jsonType === 'oracle_clob') {
                query = `
                    UPDATE MOVIES
                    SET MOVIECLOB = JSON_MERGEPATCH(MOVIEBLOB, :newMovieData)
                    WHERE ID = :id
                `;
            } else {
                return { message: 'Invalid JSON type', data: null };
            }

            const parameters = [JSON.stringify(newMovieData), id];

            const cpuStart = process.cpuUsage();           // CPU snapshot in microseconds
            const memStart = process.memoryUsage().heapUsed; // Heap memory snapshot in bytes
            const queryStart = performance.now();
            await this.dataSource.manager.query(query, parameters);
            const queryEnd = performance.now();
            const queryLatency = queryEnd - queryStart; // in milliseconds

            const cpuUsageDiff = process.cpuUsage(cpuStart);
            const cpuUsageTotal = cpuUsageDiff.user + cpuUsageDiff.system; // in microseconds
            const memEnd = process.memoryUsage().heapUsed;
            const memUsageDiff = memEnd - memStart; // in bytes

            console.log(`Update partial query latency: ${queryLatency.toFixed(5)} ms`);
            console.log(`CPU usage: ${cpuUsageTotal} µs`);
            console.log(`Memory usage change: ${memUsageDiff} bytes`);

            return {
                message: 'Updated successfully using JSON Merge Patch',
                updatedFields: newMovieData,
                metrics: {
                    queryLatency,       // Time taken by the database to execute the update query (ms)
                    cpuUsage: cpuUsageTotal,   // Total CPU time consumed during the operation (µs)
                    memoryUsage: memUsageDiff  // Change in heap memory during the operation (bytes)
                }
            };
        } catch (error) {
            console.log('Error updating changed parts of movie:', error);
            throw error;
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
}