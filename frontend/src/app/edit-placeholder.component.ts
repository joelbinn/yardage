import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-edit-placeholder',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Redigeringsläge</h2>
      <p>Registrera och korrigera banor på satellitkarta.</p>
      <a routerLink="/" class="back-link">Tillbaka till start</a>
    </section>
  `,
})
export class EditPlaceholderComponent {}
