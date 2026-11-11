import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseEditorService } from '../../application/course-editor.service';
import { SettingsService } from '../../application/settings.service';
import { ALLOWED_HOLE_COUNTS } from '../../domain/course';

/** Redigeringsläget: lista banor, skapa, ta bort och välj Bana för redigering. */
@Component({
  selector: 'app-edit',
  imports: [ReactiveFormsModule, RouterLink],
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
  readonly createError = signal<string | null>(null);

  readonly createForm = this.fb.group({ name: '', holeCount: 18 });

  constructor() {
    effect(() => {
      void this.editor.load(this.settings.dataRepo());
    });
  }

  create(): void {
    const { name, holeCount } = this.createForm.getRawValue();
    const result = this.editor.create(name, Number(holeCount));
    this.createError.set(result.ok ? null : result.error);
    if (result.ok) {
      this.createForm.reset();
    }
  }

  remove(id: string): void {
    this.editor.remove(id);
  }

  select(id: string): void {
    this.editor.select(id);
  }
}
