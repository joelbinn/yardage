import { inject, Injectable } from '@angular/core';
import { Course } from '../domain/course';
import { DataRepo, dataRepoKey } from '../domain/data-repo';
import { COURSE_READER, COURSE_WRITER, CourseReadResult, CourseWriteResult } from './ports';

export type CourseCatalogState = CourseReadResult | { readonly kind: 'not-configured' };

/**
 * Application Service: läser och skriver data-repots ban-dokument.
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
  private readonly saved = new Map<string, readonly Course[]>();

  load(repo: DataRepo | null): Promise<CourseCatalogState> {
    if (!repo) {
      return Promise.resolve({ kind: 'not-configured' });
    }
    const saved = this.saved.get(dataRepoKey(repo));
    return saved ? Promise.resolve({ kind: 'loaded', courses: saved }) : this.reader.read(repo);
  }

  async save(repo: DataRepo, token: string, courses: readonly Course[]): Promise<CourseWriteResult> {
    const result = await this.writer.write(repo, token, courses);
    if (result.kind === 'saved') {
      this.saved.set(dataRepoKey(repo), courses);
    }
    return result;
  }
}
