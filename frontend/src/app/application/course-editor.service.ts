import { computed, inject, Injectable, signal } from '@angular/core';
import { GreenPoint } from '../domain/course';
import {
  CourseDraft,
  CourseDraftResult,
  coursesFromDrafts,
  createCourseDraft,
  draftFromCourse,
  DraftHole,
  nextHoleNumber,
  placeGreenPoint,
  setHolePar,
} from '../domain/course-draft';
import { DataRepo } from '../domain/data-repo';
import { CourseCatalogService, CourseCatalogState } from './course-catalog.service';
import { CourseWriteResult } from './ports';
import { SettingsService } from './settings.service';

export type CourseEditorStatus = 'idle' | 'loading' | CourseCatalogState['kind'];

/** Utfall av att spara arbetskopian till data-repot. */
export type CourseSaveResult =
  | CourseWriteResult
  | { readonly kind: 'no-token' }
  | { readonly kind: 'incomplete'; readonly error: string }
  | { readonly kind: 'not-editable' };

const isEditable = (status: CourseEditorStatus): boolean =>
  status === 'loaded' || status === 'missing';

/**
 * Application Service för Redigeringsläget: håller banorna under redigering i minnet
 * (en arbetskopia av data-repots ban-dokument) och vilken Bana som är vald.
 *
 * Karteditorn (ticket 06) ändrar hålen i vald Bana via ett aktivt hål; ticket 07 sparar
 * `courses()` till data-repot. Affärsreglerna ligger i domain/course-draft.
 */
@Injectable({ providedIn: 'root' })
export class CourseEditorService {
  private readonly catalog = inject(CourseCatalogService);
  private readonly settings = inject(SettingsService);

  private readonly statusState = signal<CourseEditorStatus>('idle');
  private readonly coursesState = signal<readonly CourseDraft[]>([]);
  private readonly selectedIdState = signal<string | null>(null);
  private readonly activeHoleNumberState = signal(1);
  private readonly savingState = signal(false);
  private loadedRepo: DataRepo | null = null;
  private loadedRepoKey: string | null = null;
  private loadSequence = 0;

  readonly status = this.statusState.asReadonly();
  readonly courses = this.coursesState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  /** Sant när arbetskopian finns: banor inlästa, eller data-repot saknar ännu ban-dokument. */
  readonly canEdit = computed(() => isEditable(this.statusState()));
  readonly selected = computed(
    () => this.coursesState().find((c) => c.id === this.selectedIdState()) ?? null,
  );
  /** Hålet i vald Bana som klick på kartan sätter greenpunkt för. */
  readonly activeHole = computed<DraftHole | null>(
    () => this.selected()?.holes.find((h) => h.number === this.activeHoleNumberState()) ?? null,
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
    this.loadedRepo = isEditable(state.kind) ? repo : null;
    this.coursesState.set(state.kind === 'loaded' ? state.courses.map(draftFromCourse) : []);
    this.selectedIdState.set(null);
    this.statusState.set(state.kind);
  }

  /**
   * Sparar hela arbetskopian till data-repot (last-write-wins, ADR-0002). Kräver token
   * och att varje Hål har en greenpunkt.
   */
  async save(): Promise<CourseSaveResult> {
    const repo = this.loadedRepo;
    if (!repo) {
      return { kind: 'not-editable' };
    }
    const token = this.settings.token();
    if (!token) {
      return { kind: 'no-token' };
    }
    const courses = coursesFromDrafts(this.coursesState());
    if (!courses.ok) {
      return { kind: 'incomplete', error: courses.error };
    }
    this.savingState.set(true);
    try {
      const result = await this.catalog.save(repo, token, courses.value);
      if (result.kind === 'saved') {
        this.statusState.set('loaded'); // Ban-dokumentet finns nu i data-repot.
      }
      return result;
    } finally {
      this.savingState.set(false);
    }
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
    this.activeHoleNumberState.set(1);
  }

  activateHole(holeNumber: number): void {
    this.activeHoleNumberState.set(holeNumber);
  }

  /** Klick på kartan: sätter aktivt håls greenpunkt och går vidare till nästa hål. */
  placeGreenPointForActiveHole(green: GreenPoint): void {
    const holeNumber = this.activeHoleNumberState();
    this.updateSelected((draft) => placeGreenPoint(draft, holeNumber, green));
    const draft = this.selected();
    if (draft) {
      this.activeHoleNumberState.set(nextHoleNumber(draft, holeNumber));
    }
  }

  /** Dragen markör: korrigerar ett befintligt håls greenpunkt. */
  moveGreenPoint(holeNumber: number, green: GreenPoint): void {
    this.updateSelected((draft) => placeGreenPoint(draft, holeNumber, green));
  }

  setPar(holeNumber: number, par: number | null): CourseDraftResult {
    const draft = this.selected();
    if (!draft) {
      return { ok: false, error: 'Ingen bana är vald.' };
    }
    const result = setHolePar(draft, holeNumber, par);
    if (result.ok) {
      this.updateSelected(() => result.value);
    }
    return result;
  }

  private updateSelected(change: (draft: CourseDraft) => CourseDraft): void {
    const id = this.selectedIdState();
    if (id === null) {
      return;
    }
    this.coursesState.update((courses) => courses.map((c) => (c.id === id ? change(c) : c)));
  }
}
