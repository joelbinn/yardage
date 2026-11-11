# Offline-bandata via ngsw dataGroup (freshness)

Spelaren ska kunna slå upp Avstånd utan mobiltäckning (ticket 08). Vi beslöt att cacha ban-dokumentet (`courses.json` från `raw.githubusercontent.com`) med en `dataGroup` i `frontend/ngsw-config.json` med strategin `freshness`: nätverket först (timeout 1 s), annars senast cachade svar. Timeouten är kort för specens mål "Avstånd till green på < 2 sekunder … även vid dålig mobiltäckning": med långsamt nät visas cachad bandata efter 1 s i stället för att vänta ut nätet (en längre timeout, t.ex. 5 s, skulle ensam spräcka målet). Hålvyn och bansökningen delar dessutom en inläsning per session (`CourseCatalogService`), så att öppna en bana inte kostar en ny hämtning. App-shell cachas redan av assetGroup `app` (prefetch).

## Considered Options

- ngsw dataGroup `freshness`: valt — deklarativt, ingen kod i domän/application, och varje lyckad hämtning med nätverk skriver över cachen (kravet "cachen uppdateras").
- Cache-backad Decorator kring `ICourseReader` (t.ex. localStorage): förkastat — dubblerar det service workern redan gör, och appen kan ändå inte starta offline utan service worker för app-shell.
- ngsw `performance` (cache först): förkastat — spelaren skulle se gammal bandata efter en redigering tills cachen löper ut.

## Consequences

- Bara `https://raw.githubusercontent.com/*/*/main/courses.json` matchas. GitHub API-anrop (skrivningar i Redigeringsläge) och kartiles cachas inte.
- Utan nätverk och utan tidigare hämtning svarar läsaren `unreachable` som förut.
- I `ng serve` finns ingen service worker. Offline-e2e (`e2e/*-offline.spec.ts`, och CSP-e2e `e2e/*-prod.spec.ts`) körs i Playwright-projektet `offline` mot `dist/` (serverat av `e2e/support/static-server.mjs` på `PW_OFFLINE_PORT`, standard 4280) och kräver därför `npm run build` först; `npm run check` bygger före e2e.
