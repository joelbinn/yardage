# Playwright-test per issue med användarsynligt beteende

Yardage har inget CI och ingen backend, så det enda sättet att veta att ett användarflöde faktiskt fungerar i en webbläsare är att köra det. Vi beslöt att varje issue som ger användarsynligt beteende levereras med minst ett Playwright-test för sitt huvudflöde, utöver Vitest-enhetstesterna (jsdom) för ren logik.

## Considered Options

- Enbart enhetstester (Vitest + jsdom): förkastat — jsdom saknar Geolocation, Leaflet-rendering och service worker, så de flöden som är appens kärna (GPS-avstånd, karteditor, offline) skulle vara otestade.
- Manuell verifiering på mobil/desktop: förkastat som enda strategi — långsam och ger ingen regressionsskydd.
- Playwright per issue: valt.

## Consequences

- Externa beroenden mockas med `page.route()`: GitHub API, `raw.githubusercontent.com` och Esri-tiles. Testerna är därmed deterministiska och fungerar bakom devcontainerns utgående brandvägg.
- GPS emuleras med Playwrights `geolocation`-kontext (och `setGeolocation` för live-uppdatering i hålvyn).
- Testerna körs mot `ng serve` via `webServer` i `playwright.config.ts`, bara lokalt/i devcontainern — ingen Actions-workflow (se specens Deploy-avsnitt).
- Endast Chromium installeras. Firefox/WebKit är utanför omfånget.
- Uppsättningen (config, första testet) ingår i ticket 01. Varje issue 01–08 har ett acceptanskriterium om Playwright-täckning, och regeln står i `docs/agents/issue-tracker.md` så att nya issues får den.
- Offline-testet (ticket 08) kräver en produktionsbuild med service worker, eftersom `ng serve` inte registrerar en.
