import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseEditorService, CourseSaveResult } from '../../application/course-editor.service';
import { SettingsService } from '../../application/settings.service';
import { ALLOWED_HOLE_COUNTS, GreenPoint } from '../../domain/course';
import { CourseMapComponent, MovedGreenPoint } from './course-map.component';

/** Återkoppling efter ett sparförsök; `toSettings` visar vägledning till inställningssidan. */
export interface SaveFeedback {
  readonly text: string;
  readonly error: boolean;
  readonly toSettings: boolean;
}

const TOKEN_GUIDANCE: Record<'no-token' | 'unauthorized', string> = {
  'no-token': 'Ingen GitHub-token är inställd. Lägg in en token under Inställningar för att kunna spara.',
  unauthorized:
    'GitHub avvisade tokenen: den är ogiltig, återkallad eller saknar skrivbehörighet till data-repot. Byt token under Inställningar.',
};

function saveFeedback(result: CourseSaveResult): SaveFeedback {
  switch (result.kind) {
    case 'saved':
      return { text: 'Banorna är sparade i data-repot.', error: false, toSettings: false };
    case 'no-token':
    case 'unauthorized':
      return { text: TOKEN_GUIDANCE[result.kind], error: true, toSettings: true };
    case 'failed':
      return { text: result.error, error: true, toSettings: false };
    case 'not-editable':
      return { text: 'Banorna är inte inlästa ännu.', error: true, toSettings: false };
  }
}

/** Redigeringsläget: banlista (skapa, ta bort, välj) och karteditor för vald Bana. */
@Component({
  selector: 'app-edit',
  imports: [ReactiveFormsModule, RouterLink, CourseMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css',
})
export class EditComponent {
  private readonly settings = inject(SettingsService);
  private readonly editor = inject(CourseEditorService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly holeCounts = ALLOWED_HOLE_COUNTS;
  readonly status = this.editor.status;
  readonly canEdit = this.editor.canEdit;
  readonly courses = this.editor.courses;
  readonly selected = this.editor.selected;
  readonly activeHole = this.editor.activeHole;
  readonly panelCollapsed = signal(false);
  readonly createError = signal<string | null>(null);
  readonly parError = signal<string | null>(null);
  readonly saving = this.editor.saving;
  readonly hasToken = this.settings.hasToken;
  readonly saveFeedback = signal<SaveFeedback | null>(null);

  readonly createForm = this.fb.group({ name: '', holeCount: 18 });

  constructor() {
    effect(() => {
      void this.editor.load(this.settings.dataRepo());
    });
  }

  togglePanel(): void {
    this.panelCollapsed.update((collapsed) => !collapsed);
  }

  create(): void {
    const { name, holeCount } = this.createForm.getRawValue();
    const result = this.editor.create(name, Number(holeCount));
    this.createError.set(result.ok ? null : result.error);
    if (result.ok) {
      this.createForm.reset();
    }
  }

  async save(): Promise<void> {
    this.saveFeedback.set(null);
    this.saveFeedback.set(saveFeedback(await this.editor.save()));
  }

  remove(id: string): void {
    this.editor.remove(id);
  }

  select(id: string): void {
    this.editor.select(id);
    this.parError.set(null);
  }

  activateHole(holeNumber: number): void {
    this.editor.activateHole(holeNumber);
    this.parError.set(null);
  }

  placeGreenPoint(green: GreenPoint): void {
    this.editor.placeGreenPointForActiveHole(green);
    this.parError.set(null);
  }

  moveGreenPoint({ holeNumber, green }: MovedGreenPoint): void {
    this.editor.moveGreenPoint(holeNumber, green);
  }

  /** Tomt fält tar bort par; annars tolkas värdet som tal och valideras i domänen. */
  setPar(holeNumber: number, value: string): void {
    const par = value.trim() === '' ? null : Number(value);
    const result = this.editor.setPar(holeNumber, par);
    this.parError.set(result.ok ? null : result.error);
  }
}
