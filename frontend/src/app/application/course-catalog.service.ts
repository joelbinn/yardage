import { inject, Injectable, resource, ResourceRef } from '@angular/core';
import { Course } from '../domain/course';
import { DataRepo, dataRepoKey } from '../domain/data-repo';
import { COURSE_READER, COURSE_WRITER, CourseReadResult, CourseWriteResult } from './ports';
import { SettingsService } from './settings.service';

export type CourseCatalogState = CourseReadResult | { readonly kind: 'not-configured' };

/** Utfall som inte sparas för sessionen: data-repot kan nås vid nästa försök. */
const isTransient = (state: CourseCatalogState): boolean => state.kind === 'unreachable';

/**
 * Application Service: läser och skriver data-repots ban-dokument.
 *
 * Varje data-repo läses en gång per session och delas av alla vyer (bansökningen och
 * hålvyn), så att hålvyn öppnas direkt utan en ny nätverksläsning — även vid dålig
 * mobiltäckning. Misslyckad nåbarhet sparas inte, så nästa vy försöker igen.
 *
 * Efter en lyckad sparning svarar läsningen med de sparade banorna för det repot
 * under resten av sessionen. raw.githubusercontent.com cachar svaren (CDN, några
 * minuter) och service workern kan svara ur sin cache, så en ny nätverksläsning
 * direkt efter sparning kan ge gammal data — Spelläget ska spegla det som sparades.
 */
@Injectable({ providedIn: 'root' })
export class CourseCatalogService {
  private readonly reader = inject(COURSE_READER);
  private readonly writer = inject(COURSE_WRITER);
  private readonly loads = new Map<string, Promise<CourseCatalogState>>();

  load(repo: DataRepo | null): Promise<CourseCatalogState> {
    if (!repo) {
      return Promise.resolve({ kind: 'not-configured' });
    }
    const key = dataRepoKey(repo);
    const cached = this.loads.get(key);
    if (cached) {
      return cached;
    }
    const pending = this.reader.read(repo);
    this.loads.set(key, pending);
    pending.then((state) => {
      if (isTransient(state) && this.loads.get(key) === pending) {
        this.loads.delete(key);
      }
    });
    return pending;
  }

  async save(repo: DataRepo, token: string, courses: readonly Course[]): Promise<CourseWriteResult> {
    const result = await this.writer.write(repo, token, courses);
    if (result.kind === 'saved') {
      this.loads.set(dataRepoKey(repo), Promise.resolve({ kind: 'loaded', courses }));
    }
    return result;
  }
}

/**
 * Banorna i det inställda data-repot som en resource, för Spellägets vyer.
 * Anropas i en injection context (fältinitiering i en komponent).
 */
export function injectCourseCatalog(): ResourceRef<CourseCatalogState | undefined> {
  const settings = inject(SettingsService);
  const catalog = inject(CourseCatalogService);
  return resource({
    params: () => settings.dataRepo(),
    loader: ({ params }) => catalog.load(params),
  });
}
