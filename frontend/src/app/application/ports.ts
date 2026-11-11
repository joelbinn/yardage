import { InjectionToken } from '@angular/core';
import { Course, GreenPoint } from '../domain/course';
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

/** En greenpunkt som karteditorn visar som markör. */
export interface GreenPointMarker {
  readonly holeNumber: number;
  readonly green: GreenPoint;
  readonly active: boolean;
}

/** Användarens handlingar på kartan, rapporterade av kartadaptern. */
export interface CourseMapEvents {
  mapClicked(point: GreenPoint): void;
  markerMoved(holeNumber: number, point: GreenPoint): void;
}

/** En satellitkarta med greenpunkter (karteditorn, ticket 06). */
export interface ICourseMap {
  showMarkers(markers: readonly GreenPointMarker[]): void;
  /** Zoomar in kartan så att alla punkter syns; tom lista lämnar vyn orörd. */
  fitTo(points: readonly GreenPoint[]): void;
  destroy(): void;
}

/**
 * Abstract Factory: skapar en karta i ett värdelement, oberoende av kartbibliotek.
 * Asynkron så att adaptern kan ladda kartbiblioteket först när det behövs.
 */
export interface ICourseMapFactory {
  create(host: HTMLElement, events: CourseMapEvents): Promise<ICourseMap>;
}

export const COURSE_MAP_FACTORY = new InjectionToken<ICourseMapFactory>('COURSE_MAP_FACTORY');

/** Engångsläsning av spelarens position; `null` när platsåtkomst nekas eller saknas. */
export interface IPlayerPositionReader {
  currentPosition(): Promise<GeoPoint | null>;
}

export const PLAYER_POSITION_READER = new InjectionToken<IPlayerPositionReader>('PLAYER_POSITION_READER');
