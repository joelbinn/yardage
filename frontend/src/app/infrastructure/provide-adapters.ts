import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  COURSE_MAP_FACTORY,
  COURSE_READER,
  COURSE_WRITER,
  PLAYER_POSITION_READER,
  PLAYER_POSITION_WATCHER,
  SETTINGS_STORE,
} from '../application/ports';
import { GitHubCourseWriter } from './github-course-writer';
import { BrowserGeolocationPositionReader } from './browser-geolocation-position-reader';
import { BrowserGeolocationPositionWatcher } from './browser-geolocation-position-watcher';
import { LeafletCourseMapFactory } from './leaflet-course-map';
import { LocalStorageSettingsStore } from './local-storage-settings.store';
import { RawGitHubCourseReader } from './raw-github-course-reader';

/** Kopplar applikationslagrets portar till konkreta adaptrar. */
export function provideAdapters(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    { provide: SETTINGS_STORE, useExisting: LocalStorageSettingsStore },
    { provide: COURSE_READER, useExisting: RawGitHubCourseReader },
    { provide: COURSE_WRITER, useExisting: GitHubCourseWriter },
    { provide: PLAYER_POSITION_READER, useExisting: BrowserGeolocationPositionReader },
    { provide: PLAYER_POSITION_WATCHER, useExisting: BrowserGeolocationPositionWatcher },
    { provide: COURSE_MAP_FACTORY, useExisting: LeafletCourseMapFactory },
  ]);
}
