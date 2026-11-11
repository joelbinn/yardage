import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { injectCourseCatalog } from '../../application/course-catalog.service';
import { PLAYER_POSITION_WATCHER } from '../../application/ports';
import { distanceToGreen, holeNavigation } from '../../domain/hole-play';

/**
 * Spelläget för en vald bana (`/play/:courseId`): hålvyn. Visar endast
 * hålnummer, Avstånd till green (live via positionsbevakningen), navigering
 * mellan hålen och stäng tillbaka till banvalet.
 */
@Component({
  selector: 'app-play-course',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './play-course.component.html',
  styleUrl: './play-course.component.css',
})
export class PlayCourseComponent {
  private readonly courseId = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('courseId'))));

  // Delar inläsningen med bansökningen: hålvyn öppnas utan ny nätverksläsning.
  protected readonly catalogResource = injectCourseCatalog();

  // undefined = väntar på första avläsningen, null = platsåtkomst saknas.
  protected readonly fix = toSignal(inject(PLAYER_POSITION_WATCHER).watch(), { initialValue: undefined });

  private readonly holeIndex = signal(0);

  readonly course = computed(() => {
    const s = this.catalogResource.value();
    return s?.kind === 'loaded' ? s.courses.find((c) => c.id === this.courseId()) : undefined;
  });

  readonly navigation = computed(() => {
    const c = this.course();
    return c ? holeNavigation(c, this.holeIndex()) : undefined;
  });

  readonly distance = computed(() => {
    const fix = this.fix();
    const nav = this.navigation();
    return fix && nav ? distanceToGreen(fix.position, nav.hole) : undefined;
  });

  readonly accuracy = computed(() => {
    const fix = this.fix();
    return fix ? Math.round(fix.accuracyMeters) : undefined;
  });

  previous(): void {
    this.holeIndex.update((i) => Math.max(i - 1, 0));
  }

  next(): void {
    const last = (this.course()?.holes.length ?? 1) - 1;
    this.holeIndex.update((i) => Math.min(i + 1, last));
  }
}
