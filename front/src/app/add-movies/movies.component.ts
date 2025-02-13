import {Component, isStandalone} from '@angular/core';
import {Movie} from '../model/movie';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MoviesService} from '../Services/movies.service';
import {Actor} from '../model/actor';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss'],
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
  ],
  providers: [],
  standalone: true
})
export class MoviesComponent {
  movie: Movie = new Movie();
  jsonTypes = [
    {label: 'Oracle JSON', value: 'oracle_json'},
    {label: 'Oracle CLOB', value: 'oracle_clob'},
    {label: 'MSSQL VARCHAR', value: 'mssql_varchar'},
    {label: 'Postgres JSON', value: 'postgres_json'},
    {label: 'Postgres JSONB', value: 'postgres_jsonb'},
  ];
  selectedJsonType: string = '';
  jsonType = ""
  selectedActors: Actor[] = [];
  protected readonly isStandalone = isStandalone;

  constructor(private movieService: MoviesService) {
  }

  createMovie(): void {
    console.log(this.jsonType)
    console.log(this.movie)
    this.movieService.createMovie(this.movie, this.jsonType);
  }

  // resetForm(): void {
  //   this.movie = new Movie();
  // }

  addActor(): void {
    this.movie.actor.push(new Actor()); // Add a new actor
  }

  removeActor(index: number): void {
    this.movie.actor.splice(index, 1); // Remove the actor at the given index
  }
}
