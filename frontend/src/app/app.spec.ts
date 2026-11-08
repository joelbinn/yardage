import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { routes } from './app.routes';
import { App } from './app';
import { provideAdapters } from './infrastructure/provide-adapters';

describe('Routing och navigation (Seam 2: Vitest + jsdom)', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideAdapters()],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renderar startsidan med apptitel och länktexter på svenska', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    const rootEl = fixture.nativeElement as HTMLElement;
    expect(rootEl.querySelector('h1')?.textContent?.trim()).toBe('Yardage');

    const links = Array.from(rootEl.querySelectorAll('a')).map((a) =>
      a.textContent?.trim()
    );
    expect(links).toContain('Redigeringsläge');
    expect(links).toContain('Spelläge');
    expect(links).toContain('Inställningar');
  });

  it('navigerar till Redigeringsläge (/edit)', async () => {
    await router.navigateByUrl('/edit');
    fixture.detectChanges();

    const rootEl = fixture.nativeElement as HTMLElement;
    expect(rootEl.querySelector('h2')?.textContent?.trim()).toBe('Redigeringsläge');
  });

  it('navigerar till Spelläge (/play)', async () => {
    await router.navigateByUrl('/play');
    fixture.detectChanges();

    const rootEl = fixture.nativeElement as HTMLElement;
    expect(rootEl.querySelector('h2')?.textContent?.trim()).toBe('Spelläge');
  });

  it('navigerar till Inställningar (/settings)', async () => {
    await router.navigateByUrl('/settings');
    fixture.detectChanges();

    const rootEl = fixture.nativeElement as HTMLElement;
    expect(rootEl.querySelector('h2')?.textContent?.trim()).toBe('Inställningar');
  });
});
