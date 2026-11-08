# 02: Inställningar + läs banor från Data-repo

**What to build:** Användaren konfigurerar appen på inställningssidan: data-repo (owner + repo-namn, default `yardage-data`) och GitHub-token (fine-grained PAT), båda sparade i localStorage. UI:t visar tydligt vad tokenen kan och hur man återkallar den (ADR-0003). Med konfigurationen på plats läser appen banorna ur data-repots enda JSON-dokument via raw-URL — utan autentisering — och visar dem som en lista. Saknas dokumentet visas ett tydligt fallback-meddelande. Domäntyperna (Bana, Hål, Greenpunkt) enligt GLOSSARY.md och specens datamodell etableras här.

**Blocked by:** 01 (Gående skelett)

**Status:** resolved

- [x] Inställningssidan sparar och läser tillbaka data-repo-konfiguration och token i localStorage
- [x] Token-sidan förklarar PAT:ens minimiscope (`contents:write` på endast data-repot) och hur den återkallas
- [x] Banor listas efter att ett data-repo med ett ban-dokument konfigurerats
- [x] Tydligt meddelande när ban-dokumentet saknas eller repot inte nås
- [x] Enhetstester för tolkning/validering av ban-dokumentet
- [x] Playwright-test: konfigurera data-repo och token på `/settings`, banor läses från mockad raw-URL och listas; mockad 404 ger fallback-meddelandet (ADR-0004)

## Comments

Implementerad i `frontend/src/app/` enligt hexagonal arkitektur:

- `domain/`: `course.ts` (Bana/Hål/Greenpunkt), `courses-document.ts` (ren tolkning/validering av `courses.json` — version 1, 9 eller 18 hål i ordning, giltiga koordinater, valfritt par, unika id:n; resultatet fryses), `data-repo.ts` (owner + namn, default `yardage-data`, raw-URL), `github-token.ts`.
- `application/`: portar (`ISettingsStore`, `ICourseReader`), `SettingsService`, `CourseCatalogService`.
- `infrastructure/`: `LocalStorageSettingsStore` (`yardage.dataRepo`, `yardage.token`), `RawGitHubCourseReader` (oautentiserad GET mot raw-URL; 404 → saknas, nätverksfel → nås inte, felformat → ogiltigt).
- `features/settings` ersätter platshållaren; `features/play` listar banorna (bansökningen byggs ut i 03).

Banlistan visas i Spelläget (`/play`). Tester: Vitest för tolkning, data-repo, token och läsaren (HttpTestingController); Playwright i `e2e/02-settings-read-courses.spec.ts`.

Att notera inför 05–07: datamodellen kräver en greenpunkt per hål, så en nyskapad bana utan utsatta greenpunkter kan inte sparas/läsas förrän alla hål har en. Ta ställning till det i 05/07.
