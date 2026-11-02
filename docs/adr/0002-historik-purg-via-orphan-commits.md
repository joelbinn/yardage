# Historik-purg via orphan-commits

Kravet är att data-repot inte samlar någon historik: efter varje commit ska historiken vara borta. Vi beslöt att varje save via Git Data API skapar blob → tree → commit **utan parent** och därefter force-uppdaterar ref:en (`PATCH /repos/.../git/refs/heads/main` med `force: true`), så att data-repot alltid innehåller exakt en root-commit.

## Consequences

- Last-write-wins: ingen versionshantering, inget ångra, ingen konflikthantering. Acceptabelt eftersom appen har en användare per data-repo.
- Samtidiga saves från två fönster kan inte göras säkert — den sista skrivningen vinner och den första försvinner spårlöst.
- Avsiktlig avvikelse från normal git-användning: en framtida läsare som ser force-push i koden ska veta att det är själva poängen, inte en bugg.
