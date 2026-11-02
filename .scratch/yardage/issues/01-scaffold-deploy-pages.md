# 01: Gående skelett — scaffold + deploy till Pages

**What to build:** Spelaren öppnar Yardage i sin webbläsare och möts av appens svenska startsida med val mellan Redigeringsläge och Spelläge. Appen är en Angular 22-app (standalone-komponenter, signals) med routing till tre platshållarvyer (`/edit`, `/play`, `/settings`), PWA-manifest, och den byggs och deployas till GitHub Pages med ett enda kommando (`npm run deploy` via `angular-cli-ghpages`, base-href `/yardage/`).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `npm run deploy` bygger och publicerar appen på GitHub Pages (base-href `/yardage/`)
- [ ] Startsiden länkar till Redigeringsläge, Spelläge och Inställningar (platshållarvyer)
- [ ] UI:t är på svenska
- [ ] PWA-manifest med appnamnet "Yardage" finns och bygget går igenom
