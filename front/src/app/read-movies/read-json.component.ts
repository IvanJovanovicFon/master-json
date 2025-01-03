import {Component, OnInit} from '@angular/core';
import {CommonModule, NgForOf} from '@angular/common';
import {MoviesService} from '../Services/movies.service';
import {Movie} from '../model/movie';
import {FormsModule} from '@angular/forms';
import {Actor} from '../model/actor';

@Component({
  selector: 'app-read-json',
  standalone: true,
  imports: [
    NgForOf,
    FormsModule,
    CommonModule
  ],
  templateUrl: './read-json.component.html',
  styleUrl: './read-json.component.css'
})
export class ReadJsonComponent {
  databases = ['Oracle', 'SQLServer', 'PostgreSQL'];
  selectedDb: string = 'SQLServer';
  movieId: number = 0;
  movie: any = null;

  constructor(private movieService: MoviesService) {
  }

  addActor(): void {
    this.movie.actor.push(new Actor());
  }

  removeActor(index: number): void {
    this.movie.actor.splice(index, 1);
  }

  loadMovie() {
    console.log(this.selectedDb)
    this.movieService.getMovieById(this.selectedDb, this.movieId).subscribe({
      next: (data) => {
        this.movie = data;
      },
      error: (error) => {
        console.error('Error loading movie:', error);
      },
      complete: () => {
        console.log('Movie loading completed');
      },
    });
  }

  updateMovie() {
    this.movieService.updateMovie(this.selectedDb, this.movieId, this.movie).subscribe({
      next: () => {
        alert('Movie updated successfully!');
      },
      error: (error) => {
        console.error('Error updating movie:', error);
      },
      complete: () => {
        console.log('Movie update completed');
      },
    });
  }

}
