import {Director} from './director';
import {Actor} from './actor';

export class Movie {
  constructor(
    public id: number = 0,
    public name: string = '',
    public genre: string = '',
    public year: number = new Date().getFullYear(),
    public director: Director = new Director(),
    public actor: Actor[] = [new Actor()]
  ) {
  }
}
