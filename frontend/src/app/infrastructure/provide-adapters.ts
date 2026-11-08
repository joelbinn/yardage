import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { COURSE_READER, SETTINGS_STORE } from '../application/ports';
import { LocalStorageSettingsStore } from './local-storage-settings.store';
import { RawGitHubCourseReader } from './raw-github-course-reader';

/** Kopplar applikationslagrets portar till konkreta adaptrar. */
export function provideAdapters(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withFetch()),
    { provide: SETTINGS_STORE, useExisting: LocalStorageSettingsStore },
    { provide: COURSE_READER, useExisting: RawGitHubCourseReader },
  ]);
}
