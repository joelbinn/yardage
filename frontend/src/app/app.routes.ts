import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { EditComponent } from './features/edit/edit.component';
import { PlayComponent } from './features/play/play.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'edit', component: EditComponent },
  { path: 'play', component: PlayComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' },
];
