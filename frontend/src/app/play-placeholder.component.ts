import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-play-placeholder',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Spelläge</h2>
      <p>Slå upp avstånd till green under pågående spel.</p>
      <a routerLink="/" class="back-link">Tillbaka till start</a>
    </section>
  `,
})
export class PlayPlaceholderComponent {}
