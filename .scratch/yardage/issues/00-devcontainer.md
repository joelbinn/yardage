# 00: Devcontainer — reproducerbar miljö och agentsandlåda

**What to build:** Utvecklaren öppnar repot i en devcontainer (JetBrains primärt, även VS Code/`devcontainer` CLI) och får en komplett, reproducerbar utvecklingsmiljö för Yardage: Node (den version Angular 22 kräver), `gh`, Claude Code och Playwrights systemberoenden för Chromium. Containern är samtidigt en sandlåda för AI-agenter: utgående trafik är default-deny med en allowlist (npm, GitHub, Anthropic/Claude Code, Playwright-CDN, JetBrains), användaren är `node` utan generell sudo, GitHub-åtkomst sker via en fine-grained PAT med `contents:write` på endast `yardage`, och Claude Code startar i bypass-läge enbart inuti containern. Hostens globala `CLAUDE.md` och skills monteras read-only. `node_modules`, Claude-state och `gh`/git-konfiguration ligger i named volumes som överlever rebuild. Port 4200 forwardas. All vidare utveckling (från ticket 01) sker i containern.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [ ] `.devcontainer/` med `Dockerfile`, `devcontainer.json`, `init-firewall.sh` och `post-create.sh`
- [ ] Containern bygger och startar via JetBrains och via `devcontainer up`
- [ ] Brandväggen är på som standard och släpper bara igenom allowlistan
- [ ] Volumes för `node_modules`, `~/.claude`-state och `~/.config` (gh + git) överlever rebuild
- [ ] Hostens `CLAUDE.md` och skills är read-only i containern
- [ ] `README.md` beskriver setup: öppna i container, `gh auth login` med fine-grained PAT, `claude` login
- [ ] Samtliga acceptanstestfall nedan är genomgångna och godkända

## Acceptanstestfall

Körs manuellt. Kommandon körs i en terminal **inuti** containern om inget annat anges.

| # | Testfall | Steg | Förväntat resultat |
|---|----------|------|--------------------|
| AT-01 | Start via JetBrains | Öppna repot i JetBrains → *Dev Containers* → *Create Dev Container and Mount Sources* (eller via Gateway) | Containern byggs, IDE-backenden installeras och projektet öppnas utan fel |
| AT-02 | Start via CLI | På hosten: `devcontainer up --workspace-folder .` följt av `devcontainer exec --workspace-folder . bash` | Containern startar; `post-create` och brandväggen körs utan fel; ett skal öppnas i `/workspaces/yardage` |
| AT-03 | Icke-root-användare | `whoami` och `id` | `node`, inte uid 0 |
| AT-04 | Ingen generell sudo | `sudo iptables -F` och `sudo -l` | Första nekas; `sudo -l` listar endast `init-firewall.sh` och `fix-volume-perms.sh` |
| AT-05 | Verktyg finns | `node -v`, `npm -v`, `gh --version`, `claude --version`, `npx -y playwright --version` | Alla svarar med en version; Node-versionen uppfyller Angular 22:s krav |
| AT-06 | Brandväggen blockerar | `curl -sS --max-time 5 https://example.com` | Misslyckas (timeout/connection refused) |
| AT-07 | Allowlistan släpper igenom | `curl -sS -o /dev/null -w '%{http_code}\n' https://registry.npmjs.org/`, `… https://api.github.com/zen`, `… https://api.anthropic.com/` | Får HTTP-svar (t.ex. 200/401/404) — inte timeout |
| AT-08 | Esri nås inte från containern | `curl -sS --max-time 5 https://server.arcgisonline.com/` | Misslyckas — bekräftar att E2E måste mocka kart-tiles (ADR-0004) |
| AT-09 | JetBrains trots brandvägg | Starta om containern (så att brandväggen är aktiv) och anslut med JetBrains igen | IDE-backend och plugins laddas utan nätverksfel |
| AT-10 | Persistens efter rebuild | Logga in i `claude` och `gh`, sätt `git config --global user.name`, skapa `node_modules/.keep`; kör *Rebuild Container* | Efter rebuild: `claude` är inloggad, `gh auth status` OK, git-identiteten finns kvar, `node_modules/.keep` finns kvar |
| AT-11 | Read-only CLAUDE.md och skills | `cat ~/.claude/CLAUDE.md`, `ls ~/.claude/skills/grilling/`, `touch ~/.claude/CLAUDE.md`, `touch ~/.claude/skills/x` | Läsning fungerar (även via skills-symlänkar); skrivning ger `Read-only file system` |
| AT-12 | Portforward 4200 | I containern: `npx -y http-server -p 4200 -a 0.0.0.0`; på hosten öppna `http://localhost:4200` | Sidan svarar på hosten |
| AT-13 | Claude i bypass-läge | `type claude`; starta `claude` och be den köra `ls` | Aliaset inkluderar `--dangerously-skip-permissions`; inga behörighetsfrågor visas. På hosten är projektets `.claude/settings.json` oförändrad |
| AT-14 | Minimal PAT-scope | `gh auth status`; `git push --dry-run` i `yardage`; försök `gh api -X PUT repos/<owner>/<annat-repo>/contents/x.txt -f message=t -f content=dA==` | Token visas; push mot `yardage` tillåts; skrivning till annat repo nekas (403/404) |
| AT-15 | Utveckling startar i containern | `git status` och `git log -1` i `/workspaces/yardage` | Fungerar utan *dubious ownership*-fel; ändringar syns direkt på hosten |
