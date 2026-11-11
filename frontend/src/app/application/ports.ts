import { InjectionToken } from '@angular/core';
import { Course } from '../domain/course';
import { GeoPoint } from '../domain/course-search';
import { DataRepo } from '../domain/data-repo';

/**
 * Portar (Hexagonal arkitektur) som applikationslagret beror på.
 * Adaptrarna i infrastructure/ implementerar dem.
 */

/** Persistens av inställningar (data-repo och token) — ADR-0003. */
export interface ISettingsStore {
  loadDataRepo(): DataRepo | null;
  saveDataRepo(repo: DataRepo): void;
  loadToken(): string | null;
  saveToken(token: string): void;
  clearToken(): void;
}

/** Utfall av att läsa ban-dokumentet ur data-repot. */
export type CourseReadResult =
  | { readonly kind: 'loaded'; readonly courses: readonly Course[] }
  | { readonly kind: 'missing' }
  | { readonly kind: 'unreachable' }
  | { readonly kind: 'invalid'; readonly error: string };

/** Läsning av banor ur ett data-repo. */
export interface ICourseReader {
  read(repo: DataRepo): Promise<CourseReadResult>;
}

export const SETTINGS_STORE = new InjectionToken<ISettingsStore>('SETTINGS_STORE');
export const COURSE_READER = new InjectionToken<ICourseReader>('COURSE_READER');

/** Engångsläsning av spelarens position; `null` när platsåtkomst nekas eller saknas. */
export interface IPlayerPositionReader {
  currentPosition(): Promise<GeoPoint | null>;
}

export const PLAYER_POSITION_READER = new InjectionToken<IPlayerPositionReader>('PLAYER_POSITION_READER');
