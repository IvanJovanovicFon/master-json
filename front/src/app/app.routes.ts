import {Routes} from '@angular/router';
import {MoviesComponent} from './add-movies/movies.component';
import {ReadJsonComponent} from './read-movies/read-json.component';

export const routes: Routes = [
  {path: '', component: MoviesComponent},
  {path: 'add-json', component: MoviesComponent},
  { path: 'read-json', component: ReadJsonComponent },
  { path: 'update-json', component: ReadJsonComponent },
];
