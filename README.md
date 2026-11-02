# Yardage

Webbapp för golfare som visar avståndet i meter från spelarens position till green. Se [spec](.scratch/yardage/spec.md) och [GLOSSARY.md](GLOSSARY.md).

## Utveckling i devcontainer

All utveckling sker i en devcontainer. Den ger en reproducerbar miljö (Node 24, `gh`, Claude Code, Playwrights systemberoenden) och fungerar samtidigt som sandlåda för AI-agenter: utgående trafik är default-deny, och `claude` körs utan behörighetsfrågor *inuti* containern.

### Förutsättningar på hosten

- Docker (Docker Desktop eller motsvarande)
- JetBrains (WebStorm/IntelliJ med Dev Containers-stöd), VS Code med Dev Containers, eller `@devcontainers/cli`
- Hostens `~/.claude/CLAUDE.md`, `~/.claude/skills`, `~/.agents/skills` och `~/CLAUDE.md` monteras read-only; de måste finnas (skapa tomma om du saknar dem)

### Starta

- **JetBrains:** öppna repot → *Dev Containers* → *Create Dev Container and Mount Sources*.
- **VS Code:** *Dev Containers: Reopen in Container*.
- **CLI:**
  ```bash
  devcontainer up --workspace-folder .
  devcontainer exec --workspace-folder . bash
  ```

### Engångsinställningar (sparas i volumes och överlever rebuild)

1. **Git-identitet:**
   ```bash
   git config --global user.name "Ditt Namn"
   git config --global user.email "du@example.com"
   ```
2. **GitHub:** skapa en *fine-grained PAT* med `contents:write` på **endast** `yardage` (och `metadata:read`), sedan:
   ```bash
   gh auth login --with-token <<< "<token>"
   gh auth setup-git
   ```
   Ingen SSH-agent forwardas; sandlådan når alltså bara det repo som PAT:en gäller.
3. **Claude Code:** kör `claude` och logga in. Aliaset `claude` startar med `--dangerously-skip-permissions`; det gäller bara i containern.

### Nätverk

Brandväggen (`.devcontainer/init-firewall.sh`) släpper bara igenom npm, GitHub, Anthropic/Claude Code, Playwrights CDN och JetBrains. Allt annat, inklusive Esri-tiles, blockeras. E2E-testerna mockar därför externa anrop (se [ADR-0004](docs/adr/0004-playwright-e2e-per-issue.md)). Behöver du nå fler domäner: lägg till dem i `ALLOWED_DOMAINS` och starta om containern.

### Volumes

| Volume | Innehåll |
|--------|----------|
| `yardage-node_modules` | `node_modules` (snabbt på macOS) |
| `yardage-claude-state` | `~/.claude` (inloggning, historik) |
| `yardage-config` | `~/.config` (`gh`-auth, git-konfiguration) |

Nollställ med `docker volume rm <namn>` på hosten.

### Portar

`4200` forwardas. Kör `ng serve --host 0.0.0.0` i containern och öppna `http://localhost:4200` på hosten.

### Acceptanstest

Testfall för devcontainern finns i [ärende 00](.scratch/yardage/issues/00-devcontainer.md).
