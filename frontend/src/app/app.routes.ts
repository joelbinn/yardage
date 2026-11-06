import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { EditPlaceholderComponent } from './edit-placeholder.component';
import { PlayPlaceholderComponent } from './play-placeholder.component';
import { SettingsPlaceholderComponent } from './settings-placeholder.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'edit', component: EditPlaceholderComponent },
  { path: 'play', component: PlayPlaceholderComponent },
  { path: 'settings', component: SettingsPlaceholderComponent },
  { path: '**', redirectTo: '' },
];
