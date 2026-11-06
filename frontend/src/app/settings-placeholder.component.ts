import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-settings-placeholder',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Inställningar</h2>
      <p>Konfigurera data-repo och GitHub-token.</p>
      <a routerLink="/" class="back-link">Tillbaka till start</a>
    </section>
  `,
})
export class SettingsPlaceholderComponent {}
