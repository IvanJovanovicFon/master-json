import {Component, isStandalone} from '@angular/core';
import {Movie} from '../model/movie';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MoviesService} from './movies.service';
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
    {label: 'Oracle BLOB', value: 'oracle_blob'},
    {label: 'MSSQL JSON', value: 'mssql_json'},
    {label: 'MSSQL VARCHAR', value: 'mssql_varchar'},
    {label: 'Postgres JSON', value: 'postgres_json'},
    {label: 'Postgres JSONB', value: 'postgres_jsonb'},
  ];
  jsonType = ""
  actors: Actor[]=[];
  protected readonly isStandalone = isStandalone;
  constructor(private movieService: MoviesService) {
  }

  createMovie(): void {
    this.movieService.createMovie(this.movie, this.jsonType);
  }

  resetForm(): void {
    this.movie = new Movie();
  }


  addActor(actor:Actor) {
    this.actors.push(actor);
  }

  removeActor() {
    //izbaciti prosledjenog glumca
  }
}
