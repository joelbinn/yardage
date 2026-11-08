# AGENTS.md

## Agent skills

### Kodbas

Frontend-koden bor i `frontend/`. Rotskripten i `package.json` delegerar dit via `--prefix frontend`. `npm run check` är hela guardrailen (lint, enhetstester, Playwright, build).

### Issue tracker

Issues spåras som lokal markdown under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Standardetiketter används (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` i repo-roten. See `docs/agents/domain.md`.
