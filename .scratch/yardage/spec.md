# Yardage — PRD / spec

Status: ready-for-agent

## Bakgrund och syfte

Yardage är en webbapp för golfare som svarar på en enda fråga: **hur långt är det
till green?** Spelaren står någonstans i banan, öppnar appen på mobilen och får
avståndet i meter från sin aktuella position till greenpunkten för det aktiva
hålet. Inget mer — inga scorekort, inga klubbrekommendationer, inga
banstatistikvyer.

Banorna registreras i förväg i ett redigeringsläge på desktop, där man på en
satellitkarta klickar ut varje håls greenposition. Det finns ingen backend:
bandata lagras i ett publikt GitHub-repo och appen servas via GitHub Pages.

## Mål

- Spelaren får avstånd till green på < 2 sekunder från att hålvyn öppnas, även
  vid dålig mobiltäckning (offline efter att banan laddats).
- Registrering av en 18-hålsbana tar < 15 minuter i redigeringsläget.
- Noll driftskostnad: ingen server, ingen databas, inga API-nycklar.

## Icke-mål (out of scope)

- Scorekort, statistik, klubbval, vindkompensation.
- Tee- eller fairway-positioner; endast greenpunkten per hål.
- Flera greenpunkter per hål (fram/mitt/bak) — datamodellen tillåter utökning
  senare, men UI:t visar bara en punkt.
- Delning av banor mellan användare via något centralt register; varje användare
  har sitt eget data-repo.
- Konflikthantering vid samtidig redigering (last-write-wins, se ADR-0002).
- Andra enheter än meter.

## Användare och lägen

Appen har två lägen, nådda via routing:

| Läge | Enhet | Syfte |
|------|-------|-------|
| **Redigeringsläge** (`/edit`) | Desktop | Registrera och korrigera banor på satellitkarta |
| **Spelläge** (`/play`) | Mobil | Slå upp avstånd till green under pågående spel |

Dessutom en inställningssida (`/settings`) för data-repo (owner + namn) och
GitHub-token.

## Arkitektur

- **Frontend**: Angular 22, standalone-komponenter, signals. Enda kodbasen för
  båda lägena.
- **Karta**: Leaflet + Esri World Imagery (satellitbild, nyckellös, med
  attributering).
- **Lagring**: publikt GitHub-repo `yardage-data` (data-repot) med ett enda
  dokument `courses.json`. Se [ADR-0001](../../docs/adr/0001-github-repo-som-databas.md).
- **Skrivning**: Git Data API — blob → tree → commit utan parent → force-update
  av ref `main`. Historiken är alltid exakt 1 commit. Se
  [ADR-0002](../../docs/adr/0002-historik-purg-via-orphan-commits.md).
- **Läsning**: raw-URL (`raw.githubusercontent.com`), ingen autentisering.
- **Autentisering (endast redigeringsläge)**: fine-grained PAT med
  `contents:write` på endast data-repot, sparad i localStorage. Se
  [ADR-0003](../../docs/adr/0003-pat-i-localstorage.md).
- **Hosting**: GitHub Pages på app-repot (`yardage`), base-href `/yardage/`.
- **Offline**: PWA (`@angular/pwa`) — service worker cachar app-shell och
  senaste `courses.json`.

## Datamodell

`courses.json` i data-repot:

```ts
interface CoursesFile {
  version: 1;
  courses: Course[];
}

interface Course {
  id: string;          // stabil slug/uuid
  name: string;        // sökbar
  holes: Hole[];       // 9 eller 18, i ordning
}

interface Hole {
  number: number;      // 1..N
  green: { lat: number; lng: number };  // greenpunkten
  par?: number;        // valfritt, visas ej i spelläget
}
```

Begrepp enligt [GLOSSARY.md](../../GLOSSARY.md): Bana, Hål, Greenpunkt,
Avstånd, Spelare, Redigeringsläge, Spelläge, Data-repo.

## Funktionella krav

### Redigeringsläge

1. Visa lista över registrerade banor, med möjlighet att skapa ny, redigera och
   ta bort.
2. Skapa bana: ange namn och hålantal (9 eller 18).
3. Karteditor: satellitkarta (Leaflet + Esri) med sidopanel som listar banans
   hål; ett hål är aktivt åt gången.
4. Klick på kartan sätter greenpunkten för det aktiva hålet; befintliga
   greenpunkter renderas som markörer som går att dra för korrigering.
5. Par är ett valfritt fält per hål.
6. Spara: hela `courses.json` skrivs till data-repot via Git Data API med
   orphan-commit + force-push (ADR-0002). Last-write-wins, ingen
   konflikthantering.
7. Kräver inställd token; saknas token visas en vägledning till `/settings`.

### Spelläge

1. Bansökning: textfilter på namn, listan sorterad närmast-först enligt
   avstånd från spelarens GPS-position till banans centroid (medel av
   greenpunkterna). Om platsåtkomst nekas: alfabetisk sortering.
2. Hålvyn visar **endast**: hålnummer, "Avstånd till green" i hela meter,
   navigering föregående/nästa, och stäng-knapp.
3. Avståndet beräknas med haversine från spelarens position till greenpunkten
   och uppdateras live via `watchPosition`.
4. Diskret noggrannhetsindikator för GPS visas (t.ex. "±8 m").
5. "Föregående" är disabled på hål 1; "Nästa" är disabled på sista hålet (ingen
   wrap). Stäng återgår till banvalet.
6. Fungerar offline: valda banans data läses ur cachen när nätverket saknas.

### Inställningar

1. Konfigurera data-repo: owner + repo-namn (default `yardage-data`), sparas i
   localStorage.
2. Mata in och radera GitHub-token (PAT), sparas i localStorage (ADR-0003).
3. UI:t visar tydligt vad tokenen kan (skriva till data-repot) och hur man
   återkallar den.

## Icke-funktionella krav

- **Språk**: UI på svenska.
- **Enheter**: meter, heltal.
- **Prestanda**: hålvyns första avstånd visas inom 2 s från öppnad vy (givet
  cachad bandata och GPS-fix).
- **Säkerhet**: tokenen lämnar aldrig klienten; minimal PAT-scope; inga
  sekretesser i bandatan (publikt repo).
- **Tillgänglighet**: hålvyn ska vara läsbar i solljus — stor typografi, hög
  kontrast.

## Deploy

Ett kommando, lokalt:

```json
"build":  "ng build --base-href /yardage/",
"deploy": "ng deploy --base-href=/yardage/"
```

`npm run deploy` (via `angular-cli-ghpages`) bygger och pushar till
`gh-pages`-grenen på app-repot. Ingen Actions-workflow för deploy. Auth via
lokal git-push-behörighet eller `GH_TOKEN`.

## Förutsättningar (manuella steg)

1. App-repot namnändras till `yardage` (ger Pages-URL `…/yardage/`).
2. Ett tomt **publikt** repo `yardage-data` skapas under samma owner.
3. En fine-grained PAT med `contents:write` på endast `yardage-data` skapas och
   matas in i appens inställningar.

## Verifiering

- Enhetstester: haversine-avstånd, centroid-beräkning, GitHubService (mock av
  Git Data API-anrop), sortering av bansökning.
- `ng build` går igenom; deploy-skript verifieras mot Pages.
