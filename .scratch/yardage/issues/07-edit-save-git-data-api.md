# 07: Redigeringsläge — spara via Git Data API

**What to build:** Användaren sparar en redigerad bana och hela ban-dokumentet skrivs till data-repot via Git Data API: blob → tree → commit **utan parent** → force-update av ref `main`, så att repots historik alltid är exakt en commit (ADR-0002, last-write-wins). Saknas token visas vägledning till inställningssidan. Efter save speglar Spellägets läsning den nya datan.

**Blocked by:** 06 (Karteditor med Greenpunkter)

**Status:** ready-for-agent

- [ ] Spara skriver ban-dokumentet till data-repot via Git Data API med orphan-commit + force-push
- [ ] Data-repot har efter varje save exakt en commit i historiken
- [ ] Saknad/ogiltig token ger tydlig vägledning till inställningssidan
- [ ] Enhetstester för GitHubService med mockade API-anrop (inkl. force-update av ref)
- [ ] Playwright-test: spara skickar blob → tree → commit (utan parent) → ref-update mot mockat GitHub API; saknad token visar vägledning (ADR-0004)
