import { computed, inject, Injectable, signal } from '@angular/core';
import {
  CourseDraft,
  CourseDraftResult,
  createCourseDraft,
  draftFromCourse,
} from '../domain/course-draft';
import { DataRepo } from '../domain/data-repo';
import { CourseCatalogService, CourseCatalogState } from './course-catalog.service';

export type CourseEditorStatus = 'idle' | 'loading' | CourseCatalogState['kind'];

const isEditable = (status: CourseEditorStatus): boolean =>
  status === 'loaded' || status === 'missing';

/**
 * Application Service för Redigeringsläget: håller banorna under redigering i minnet
 * (en arbetskopia av data-repots ban-dokument) och vilken Bana som är vald.
 *
 * Ticket 06 (karteditor) utökar med ändringar av hål i vald bana, ticket 07 med att
 * spara `courses()` till data-repot. Affärsreglerna ligger i domain/course-draft.
 */
@Injectable({ providedIn: 'root' })
export class CourseEditorService {
  private readonly catalog = inject(CourseCatalogService);

  private readonly statusState = signal<CourseEditorStatus>('idle');
  private readonly coursesState = signal<readonly CourseDraft[]>([]);
  private readonly selectedIdState = signal<string | null>(null);
  private loadedRepoKey: string | null = null;
  private loadSequence = 0;

  readonly status = this.statusState.asReadonly();
  readonly courses = this.coursesState.asReadonly();
  /** Sant när arbetskopian finns: banor inlästa, eller data-repot saknar ännu ban-dokument. */
  readonly canEdit = computed(() => isEditable(this.statusState()));
  readonly selected = computed(
    () => this.coursesState().find((c) => c.id === this.selectedIdState()) ?? null,
  );

  /**
   * Läser banorna ur data-repot. Är samma repo redan inläst behålls arbetskopian,
   * så att ändringar i minnet överlever navigering mellan vyer.
   */
  async load(repo: DataRepo | null): Promise<void> {
    const key = repo ? `${repo.owner}/${repo.name}` : null;
    if (key !== null && key === this.loadedRepoKey) {
      return;
    }
    const sequence = ++this.loadSequence;
    this.statusState.set('loading');
    const state = await this.catalog.load(repo);
    if (sequence !== this.loadSequence) {
      return; // En senare inläsning har startat; den vinner.
    }
    // Saknat ban-dokument = nytt data-repo: arbetskopian börjar tom och är redigerbar.
    this.loadedRepoKey = isEditable(state.kind) ? key : null;
    this.coursesState.set(state.kind === 'loaded' ? state.courses.map(draftFromCourse) : []);
    this.selectedIdState.set(null);
    this.statusState.set(state.kind);
  }

  create(name: string, holeCount: number): CourseDraftResult {
    const existingIds = this.coursesState().map((c) => c.id);
    const result = createCourseDraft(name, holeCount, existingIds);
    if (result.ok) {
      this.coursesState.update((courses) => [...courses, result.value]);
    }
    return result;
  }

  remove(id: string): void {
    this.coursesState.update((courses) => courses.filter((c) => c.id !== id));
    if (this.selectedIdState() === id) {
      this.selectedIdState.set(null);
    }
  }

  select(id: string): void {
    this.selectedIdState.set(this.coursesState().some((c) => c.id === id) ? id : null);
  }
}
