import { Injectable } from '@nestjs/common';

@Injectable()
export class OracleService {
    async handleMovieData(jsonType: string, movieData: any): Promise<any> {
        // Add logic to handle Oracle-specific operations here
        if (jsonType === 'oracle_json') {
            return { message: 'Stored in Oracle as JSON', data: movieData };
        } else if (jsonType === 'oracle_blob') {
            return { message: 'Stored in Oracle as BLOB', data: movieData };
        }
    }
}