import {Component} from '@angular/core';
import {Movie} from '../model/movie';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {MoviesService} from './movies.service'; // Import the Movie model

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss'],
  imports: [
    FormsModule,
    CommonModule
  ],
  providers: [],
  standalone: true
})
export class MoviesComponent {
  movie: Movie = new Movie(); // Initialize with an empty movie

  constructor(private movieService: MoviesService) {
  }

  // Method to call the createMovie function from the service
  createMovie(): void {
    this.movieService.createMovie(this.movie).subscribe({
      next: (response) => {
        console.log('Movie created successfully:', response);
        alert('Movie created successfully!');
       // this.resetForm(); // Reset the form after successful creation
      },
      error: (error) => {
        console.error('Error creating movie:', error);
        alert('Failed to create movie. Please try again.');
      },
      complete: () => {
        console.log('Movie creation process completed');
      },
    });
  }

  resetForm(): void {
    this.movie = new Movie(); // Reset to the default values
  }
}
