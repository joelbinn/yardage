import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseCatalogService } from '../../application/course-catalog.service';
import { PLAYER_POSITION_READER } from '../../application/ports';
import { SettingsService } from '../../application/settings.service';
import { searchCourses } from '../../domain/course-search';
import { dataRepoKey } from '../../domain/data-repo';

/**
 * Spelläget: bansökning. Banorna ur data-repot filtreras på namn och sorteras
 * närmast-först efter spelarens position, eller alfabetiskt utan platsåtkomst.
 */
@Component({
  selector: 'app-play',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2>Spelläge</h2>
      @switch (state()?.kind) {
        @case ('loaded') {
          <label for="course-query">Sök bana</label>
          <input
            id="course-query"
            type="search"
            autocomplete="off"
            [value]="query()"
            (input)="query.set($any($event.target).value)"
          />
          @if (positionUnavailable()) {
            <p class="hint">Platsåtkomst saknas — banorna visas i bokstavsordning.</p>
          }
          <ul aria-label="Banor">
            @for (course of courses(); track course.id) {
              <li>
                <a [routerLink]="['/play', course.id]">{{ course.name }} — {{ course.holes.length }} hål</a>
              </li>
            }
          </ul>
          @if (courses().length === 0) {
            <p>Inga banor matchar sökningen.</p>
          }
        }
        @case ('not-configured') {
          <p role="alert">Inget data-repo är inställt.</p>
          <a routerLink="/settings">Gå till Inställningar</a>
        }
        @case ('missing') {
          <p role="alert">Hittade inget ban-dokument (courses.json) i {{ repoLabel() }}.</p>
        }
        @case ('unreachable') {
          <p role="alert">Data-repot kunde inte nås. Kontrollera nätverket och inställningarna.</p>
        }
        @case ('invalid') {
          <p role="alert">Ban-dokumentet kunde inte tolkas.</p>
        }
        @default {
          <p>Hämtar banor…</p>
        }
      }
      <a routerLink="/" class="back-link">Tillbaka till start</a>
    </section>
  `,
})
export class PlayComponent {
  private readonly settings = inject(SettingsService);
  private readonly catalog = inject(CourseCatalogService);
  private readonly positionReader = inject(PLAYER_POSITION_READER);

  private readonly catalogResource = resource({
    params: () => this.settings.dataRepo(),
    loader: ({ params }) => this.catalog.load(params),
  });

  // Positionen läses en gång; fram till dess visas banorna alfabetiskt.
  private readonly positionResource = resource({
    loader: () => this.positionReader.currentPosition(),
  });

  readonly query = signal('');
  readonly state = computed(() => this.catalogResource.value());
  readonly positionUnavailable = computed(
    () => this.positionResource.status() === 'resolved' && this.positionResource.value() === null,
  );
  readonly courses = computed(() => {
    const s = this.state();
    const all = s?.kind === 'loaded' ? s.courses : [];
    return searchCourses(all, this.query(), this.positionResource.value() ?? null);
  });
  readonly repoLabel = computed(() => {
    const repo = this.settings.dataRepo();
    return repo ? dataRepoKey(repo) : '';
  });
}
