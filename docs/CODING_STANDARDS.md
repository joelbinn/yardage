# Coding Standards

Detta dokument beskriver repo-specifika standarder och riktlinjer för kod och arkitektur i Yardage. Läs detta vid kodgranskning (`code-review`).

## Domänspråk & Begrepp

- Följ alltid [`GLOSSARY.md`](../GLOSSARY.md).
- Använd uteslutande de etablerade termerna (*Bana*, *Hål*, *Greenpunkt*, *Avstånd*, *Spelare*, *Redigeringsläge*, *Spelläge*, *Data-repo*).
- Använd inte synonymer som `golfbana`, `pin`, `flagga`, `play-läge`, `edit-läge` eller `databas`.

## Arkitektur

`frontend/src/app/` är uppdelad i lager enligt hexagonal arkitektur; beroenden pekar inåt:

- `domain/` — ramverksfri TypeScript: domäntyper (Value Objects, immutabla) och ren logik.
- `application/` — portar (`I`-prefixade interfaces + `InjectionToken`) och tunna Application Services.
- `infrastructure/` — adaptrar som implementerar portarna (HTTP, localStorage); `provide-adapters.ts` kopplar dem.
- `features/<läge>/` — komponenter per vy; når adaptrar endast via portar.

Beroenderiktning, komplexitetsgränser (cyklomatisk och kognitiv ≤ 10) och HTTP-placering kontrolleras av `npm run lint`. Granska det som linten inte ser: att affärslogik ligger i `domain/` och inte i komponenter eller services, och att nya portar är smala.

## Angular & Styling

- **Komponentarkitektur:** Angular 22 med standalone-komponenter och signals (`signal()`, `computed()`) för reaktivt tillstånd.
- **Stilhantering och inkapsling:** Komponenter kör som standard med emulerad inkapsling (`ViewEncapsulation.Emulated`).
  - Stilar i en komponents `.css`-fil ska endast styla element som ägs direkt av komponenten, inte barnkomponenter under `<router-outlet>`.
  - Delade klasser (såsom layout, knappar `.btn`, `.btn-primary` etc.) placeras i `frontend/src/styles.css` eller extraheras till egna återanvändbara UI-komponenter.

## Tester

- Följ [ADR-0004](adr/0004-playwright-e2e-per-issue.md): Varje issue med användarsynligt beteende ska ha minst ett Playwright-test i `frontend/e2e/`.
- Ren logik testas i enhetstester med Vitest + jsdom; spec-filen ligger bredvid filen den testar (`foo.ts` → `foo.spec.ts`).
