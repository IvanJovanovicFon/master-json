import { Inject, Injectable } from '@nestjs/common';
import oracledb, { Connection } from 'oracledb';

@Injectable()
export class MovieRepository {
    constructor(@Inject('DATABASE_CONNECTION') private readonly connection: Connection) {}





    // async create(movie: any): Promise<any> {
    //     const result = await this.connection.execute(
    //         `INSERT INTO movies (title, description, release_date, genre, rating)
    //    VALUES (:title, :description, :release_date, :genre, :rating)`,
    //         {
    //             title: movie.title,
    //             description: movie.description,
    //             release_date: movie.releaseDate,
    //             genre: movie.genre,
    //             rating: movie.rating,
    //         },
    //         { autoCommit: true },
    //     );
    //     return result;
    // }

}
