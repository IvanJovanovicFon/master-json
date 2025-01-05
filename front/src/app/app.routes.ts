import {Routes} from '@angular/router';
import {MoviesComponent} from './add-movies/movies.component';
import {ReadJsonComponent} from './update-movie/read-json.component';
import {FindAllMoviesComponent} from './find-all-movies/find-all-movies.component';

export const routes: Routes = [
  {path: '', component: MoviesComponent},
  {path: 'add-json', component: MoviesComponent},
  { path: 'read-json', component: FindAllMoviesComponent },
  { path: 'update-json', component: ReadJsonComponent },
];
