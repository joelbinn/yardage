import { inject, Injectable } from '@angular/core';
import { DataRepo } from '../domain/data-repo';
import { COURSE_READER, CourseReadResult } from './ports';

export type CourseCatalogState = CourseReadResult | { readonly kind: 'not-configured' };

/**
 * Application Service: hämtar banorna ur det konfigurerade data-repot.
 * Tunn — beslutet om utfall ligger i läsaren och domänens tolkning.
 */
@Injectable({ providedIn: 'root' })
export class CourseCatalogService {
  private readonly reader = inject(COURSE_READER);

  load(repo: DataRepo | null): Promise<CourseCatalogState> {
    return repo ? this.reader.read(repo) : Promise.resolve({ kind: 'not-configured' });
  }
}
