import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CourseCatalogService } from '../../application/course-catalog.service';
import { SettingsService } from '../../application/settings.service';

/** Spelläget: listar banorna ur det konfigurerade data-repot. */
@Component({
  selector: 'app-play',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h2>Spelläge</h2>
      @switch (state()?.kind) {
        @case ('loaded') {
          <ul aria-label="Banor">
            @for (course of courses(); track course.id) {
              <li>{{ course.name }} — {{ course.holes.length }} hål</li>
            }
          </ul>
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

  private readonly catalogResource = resource({
    params: () => this.settings.dataRepo(),
    loader: ({ params }) => this.catalog.load(params),
  });

  readonly state = computed(() => this.catalogResource.value());
  readonly courses = computed(() => {
    const s = this.state();
    return s?.kind === 'loaded' ? s.courses : [];
  });
  readonly repoLabel = computed(() => {
    const repo = this.settings.dataRepo();
    return repo ? `${repo.owner}/${repo.name}` : '';
  });
}
