import {Component} from '@angular/core';
import {MoviesService} from '../Services/movies.service';
import {FormsModule} from '@angular/forms';
import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-find-all-movies',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf
  ],
  templateUrl: './find-all-movies.component.html',
  styleUrl: './find-all-movies.component.css'
})
export class FindAllMoviesComponent {
  options = [
    { label: 'Oracle JSON', value: 'oracle_json' },
    { label: 'Oracle CLOB', value: 'oracle_clob' },
    { label: 'MSSQL VARCHAR', value: 'mssql_varchar' },
    { label: 'Postgres JSON', value: 'postgres_json' },
    { label: 'Postgres JSONB', value: 'postgres_jsonb' },
  ];
  selectedOption: string = 'postgres_json';
  movies: any[] = [];
  error: string | null = null;

  constructor(private movieService: MoviesService) {}

  ngOnInit(): void {}

  findMovies() {
    this.movieService.findAllMovies(this.selectedOption).subscribe({
      next: (response: any) => {
        this.movies = response.data || [];
        console.log(this.movies)
        this.error = null;
      },
      error: (error) => {
        console.error('Error fetching movies:', error);
        this.error = 'Failed to fetch movies.';
        this.movies = [];
      },
    });
  }
}
