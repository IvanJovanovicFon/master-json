import { Controller, Get, Post, Body } from '@nestjs/common';
import { MoviesServiceOracle } from './Services/movies.service.oracle';

@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesServiceOracle) {}

    @Get()
    async getMovies() {
        return this.moviesService.findAll();
    }

    @Post()
    async createMovie(@Body() movie: any) {
        return this.moviesService.create(movie);
    }
}
