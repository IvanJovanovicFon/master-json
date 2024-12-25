import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Movie} from '../model/movie';
import {Actor} from '../model/actor';

@Injectable({
  providedIn: 'root',
})
export class MoviesService {
  private apiUrl = 'http://localhost:3000/api/movies';

  constructor(private http: HttpClient) {
  }


  createMovie(movie: Movie, jsonType: string) {
    console.log(123)
    this.http.post(this.apiUrl, {movie, jsonType}).subscribe({
      next: (response) => {
        console.log('Movie created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating movie:', error);
      },
      complete: () => {
        console.log('Create movie request complete.');
      },
    });
  }

}
