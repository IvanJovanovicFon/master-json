import {Director} from "./director";
import {Actor} from "./actor";

export class Movie {
    name: string;
    genre: string;
    year: number;
    director: Director;
    actor: Actor[];

    constructor(
        name: string = '',
        genre: string = '',
        year: number = new Date().getFullYear(),
        director: Director = new Director(),
        actor: Actor[] = [new Actor()],
    ) {
        this.name = name;
        this.genre = genre;
        this.year = year;
        this.director = director;
        this.actor = actor;
    }
}
