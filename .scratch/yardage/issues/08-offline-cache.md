# 08: Offline — cachad bandata i Spelläge

**What to build:** Spelaren på banan med dålig mobiltäckning öppnar Yardage offline och kan fortfarande slå upp avstånd: service workern cachar app-shell och senaste versionen av ban-dokumentet, och Spelläget (bansökning + hålvyn med live-Avstånd via GPS, som fungerar utan nätverk) läser ur cachen när nätverket saknas.

**Blocked by:** 04 (Hålvyn med live Avstånd)

**Status:** resolved

- [x] App-shell och senaste ban-dokument cachas av service workern
- [x] Bansökning och hålvyn fungerar helt offline med cachad data (GPS live)
- [x] Cachen uppdateras när ny bandata hämtas med nätverk
- [x] Playwright-test: efter första laddning (produktionsbuild med service worker) fungerar bansökning och hålvy med nätverket avstängt (ADR-0004)
