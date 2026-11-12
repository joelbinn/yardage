import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly title = signal('Yardage');

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Rutter med `data: { fullWidth: true }` (Redigeringsläget) lämnar den smala kolumnen. */
  readonly fullWidth = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let leaf = this.route.snapshot;
        while (leaf.firstChild) {
          leaf = leaf.firstChild;
        }
        return leaf.data['fullWidth'] === true;
      }),
    ),
    { initialValue: false },
  );
}
