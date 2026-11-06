# Coding Standards

Detta dokument beskriver repo-specifika standarder och riktlinjer för kod och arkitektur i Yardage. Läs detta vid kodgranskning (`code-review`).

## Domänspråk & Begrepp

- Följ alltid [`GLOSSARY.md`](../GLOSSARY.md).
- Använd uteslutande de etablerade termerna (*Bana*, *Hål*, *Greenpunkt*, *Avstånd*, *Spelare*, *Redigeringsläge*, *Spelläge*, *Data-repo*).
- Använd inte synonymer som `golfbana`, `pin`, `flagga`, `play-läge`, `edit-läge` eller `databas`.

## Angular & Styling

- **Komponentarkitektur:** Angular 22 med standalone-komponenter och signals (`signal()`, `computed()`) för reaktivt tillstånd.
- **Stilhantering och inkapsling:** Komponenter kör som standard med emulerad inkapsling (`ViewEncapsulation.Emulated`).
  - Stilar i en komponents `.css`-fil ska endast styla element som ägs direkt av komponenten, inte barnkomponenter under `<router-outlet>`.
  - Delade klasser (såsom layout, knappar `.btn`, `.btn-primary` etc.) placeras i `frontend/src/styles.css` eller extraheras till egna återanvändbara UI-komponenter.

## Tester

- Följ [ADR-0004](adr/0004-playwright-e2e-per-issue.md): Varje issue med användarsynligt beteende ska ha minst ett Playwright-test i `frontend/e2e/`.
- Ren logik testas i enhetstester med Vitest + jsdom i `frontend/src/app/*.spec.ts`.
