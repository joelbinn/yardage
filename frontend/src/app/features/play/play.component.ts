import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseCatalogService, injectCourseCatalog } from '../../application/course-catalog.service';
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
  styleUrl: './play.component.css',
  template: `
    <section>
      <h2>Spelläge</h2>
      @switch (state()?.kind) {
        @case ('loaded') {
          <div class="search">
            <label for="course-query" class="sr-only">Sök bana</label>
            <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="course-query"
              type="search"
              autocomplete="off"
              placeholder="Sök bana"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </div>
          @if (positionUnavailable()) {
            <p class="hint">Platsåtkomst saknas — banorna visas i bokstavsordning.</p>
          }
          <ul aria-label="Banor" class="course-cards">
            @for (course of courses(); track course.id) {
              <li>
                <a class="course-card" [routerLink]="['/play', course.id]">
                  <span class="course-card-name">{{ course.name }}</span>
                  <span class="course-card-meta">{{ course.holes.length }} hål</span>
                  <svg class="course-card-chevron" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </a>
              </li>
            }
          </ul>
          @if (courses().length === 0) {
            <p class="empty">Inga banor matchar sökningen.</p>
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
      @if (repoLabel()) {
        <button type="button" class="btn btn-subtle sync" (click)="sync()" [disabled]="catalogResource.isLoading()">
          Synka banor
        </button>
      }
      <a routerLink="/" class="back-link">Tillbaka till start</a>
    </section>
  `,
})
export class PlayComponent {
  private readonly settings = inject(SettingsService);
  private readonly positionReader = inject(PLAYER_POSITION_READER);

  private readonly catalog = inject(CourseCatalogService);
  protected readonly catalogResource = injectCourseCatalog();

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

  /** Läser om ban-dokumentet från data-repot (sessionen läser annars bara en gång). */
  async sync(): Promise<void> {
    await this.catalog.refresh(this.settings.dataRepo());
    this.catalogResource.reload();
  }
}
