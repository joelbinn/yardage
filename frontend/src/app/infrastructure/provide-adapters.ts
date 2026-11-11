import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  COURSE_MAP_FACTORY,
  COURSE_READER,
  PLAYER_POSITION_READER,
  SETTINGS_STORE,
} from '../application/ports';
import { BrowserGeolocationPositionReader } from './browser-geolocation-position-reader';
import { LeafletCourseMapFactory } from './leaflet-course-map';
import { LocalStorageSettingsStore } from './local-storage-settings.store';
import { RawGitHubCourseReader } from './raw-github-course-reader';

/** Kopplar applikationslagrets portar till konkreta adaptrar. */
export function provideAdapters(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    { provide: SETTINGS_STORE, useExisting: LocalStorageSettingsStore },
    { provide: COURSE_READER, useExisting: RawGitHubCourseReader },
    { provide: PLAYER_POSITION_READER, useExisting: BrowserGeolocationPositionReader },
    { provide: COURSE_MAP_FACTORY, useExisting: LeafletCourseMapFactory },
  ]);
}
