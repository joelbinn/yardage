import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { EditPlaceholderComponent } from './edit-placeholder.component';
import { PlayComponent } from './features/play/play.component';
import { SettingsComponent } from './features/settings/settings.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'edit', component: EditPlaceholderComponent },
  { path: 'play', component: PlayComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: '' },
];
