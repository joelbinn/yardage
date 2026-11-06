import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="home">
      <p class="tagline">Avstånd till green i meter</p>
      <nav class="modes">
        <a routerLink="/play" class="btn btn-primary">Spelläge</a>
        <a routerLink="/edit" class="btn">Redigeringsläge</a>
        <a routerLink="/settings" class="btn btn-subtle">Inställningar</a>
      </nav>
    </section>
  `,
})
export class HomeComponent {}
