# GitHub-repo som databas, ingen backend

Yardage är en statisk app på GitHub Pages och behöver någonstans att lagra registrerade banor. Vi beslöt att helt slopa backend och i stället använda ett publikt GitHub-repo (data-repot, `yardage-data`) som databas: spelläget läser `courses.json` via raw-URL utan autentisering, och redigeringsläget skriver via Git Data API med användarens fine-grained PAT (`contents:write` på endast data-repot).

## Considered Options

- Egen backend/API: förkastat — driftskostnad och onödig komplexitet för en enanvändarapp.
- Firebase/Supabase: förkastat — ytterligare leverantör, nycklar i frontend ändå.
- GitHub-repo: valt — gratis, redan tillgängligt, publikt läsbart utan token, och deploy (Pages) och lagring hamnar i samma ekosystem.

## Consequences

- Spelläget behöver aldrig någon token; bara redigeringsläget gör det.
- Ingen serverside-validering — appen måste själv garantera att `courses.json` är välformat.
- App-repot (`yardage`) och data-repot (`yardage-data`) hålls åtskilda, så att datasaves inte triggar Pages-rebuild (se även ADR-0002).
