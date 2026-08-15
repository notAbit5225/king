import { Routes } from '@angular/router';
import { SetupComponent } from './components/setup/setup.component';
import { BoardComponent } from './components/board/board.component';

export const routes: Routes = [
  { path: '', redirectTo: 'setup', pathMatch: 'full' },
  { path: 'setup', component: SetupComponent },
  { path: 'board', component: BoardComponent }
];