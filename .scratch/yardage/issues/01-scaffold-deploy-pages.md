# 01: Gående skelett — scaffold + deploy till Pages

**What to build:** Spelaren öppnar Yardage i sin webbläsare och möts av appens svenska startsida med val mellan Redigeringsläge och Spelläge. Appen är en Angular 22-app (standalone-komponenter, signals) med routing till tre platshållarvyer (`/edit`, `/play`, `/settings`), PWA-manifest, och den byggs och deployas till GitHub Pages med ett enda kommando (`npm run deploy` via `angular-cli-ghpages`, base-href `/yardage/`).

**Blocked by:** 00 (Devcontainer)

**Status:** ready-for-agent

- [ ] `npm run deploy` bygger och publicerar appen på GitHub Pages (base-href `/yardage/`)
- [ ] Startsiden länkar till Redigeringsläge, Spelläge och Inställningar (platshållarvyer)
- [ ] UI:t är på svenska
- [ ] PWA-manifest med appnamnet "Yardage" finns och bygget går igenom
- [ ] Playwright-test: startsidan visas på svenska och länkarna till `/edit`, `/play` och `/settings` navigerar (inkl. Playwright-uppsättning: `playwright.config.ts` med `webServer`, Chromium, `npm run e2e`; Vitest + jsdom för enhetstester) (ADR-0004)
