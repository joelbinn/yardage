import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CourseCatalogService } from '../../application/course-catalog.service';
import { SettingsService } from '../../application/settings.service';

/**
 * Spelläget för en vald bana (`/play/:courseId`). Platshållare tills hålvyn
 * (ticket 04) finns: visar banans namn och vägen tillbaka till banvalet.
 */
@Component({
  selector: 'app-play-course',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      @if (course(); as c) {
        <h2>{{ c.name }}</h2>
        <p>{{ c.holes.length }} hål</p>
      } @else if (catalogResource.isLoading()) {
        <p>Hämtar bana…</p>
      } @else {
        <p role="alert">Banan hittades inte.</p>
      }
      <a routerLink="/play">Tillbaka till banvalet</a>
    </section>
  `,
})
export class PlayCourseComponent {
  private readonly settings = inject(SettingsService);
  private readonly catalog = inject(CourseCatalogService);
  private readonly courseId = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('courseId'))));

  protected readonly catalogResource = resource({
    params: () => this.settings.dataRepo(),
    loader: ({ params }) => this.catalog.load(params),
  });

  readonly course = computed(() => {
    const s = this.catalogResource.value();
    return s?.kind === 'loaded' ? s.courses.find((c) => c.id === this.courseId()) : undefined;
  });
}
