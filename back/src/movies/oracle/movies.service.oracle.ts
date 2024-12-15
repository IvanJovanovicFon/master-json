import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class MoviesServiceOracle {
    constructor(private configService: ConfigService, private dataSource: DataSource) {}

    // Fetch all movies
    async findAll(): Promise<any> {
        try {
            const result = await this.dataSource.query('SELECT * FROM MOVIES'); // Directly using dataSource
            return result;
        } catch (err) {
            console.error('Error fetching movies:', err);
            throw err;
        }
    }

    // Create a new movie
    async create(movie: any): Promise<any> {
        const { f_name, l_name, genre, year, director, actors } = movie;
        try {
            const result = await this.dataSource.query(
                `INSERT INTO MOVIES (f_name, l_name, genre, year, director_f_name, director_l_name) 
                 VALUES (:f_name, :l_name, :genre, :year, :director_f_name, :director_l_name)`,
                [f_name, l_name, genre, year, director.f_name, director.l_name]
            );

            // Insert actors if provided
            if (actors && actors.length) {
                for (let actor of actors) {
                    await this.dataSource.query(
                        `INSERT INTO ACTORS (movie_id, f_name, l_name, b_year) 
                         VALUES (:movie_id, :f_name, :l_name, :b_year)`,
                        [result.lastRowid, actor.f_name, actor.l_name, actor.b_year]
                    );
                }
            }

            return result;
        } catch (err) {
            console.error('Error creating movie:', err);
            throw err;
        }
    }
}
