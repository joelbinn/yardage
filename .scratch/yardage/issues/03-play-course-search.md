# 03: Spelläge — bansökning närmast-först

**What to build:** Spelaren öppnar Spelläget på mobilen och ser sina registrerade banor sorterade närmast-först: avståndet från spelarens aktuella GPS-position till varje banas centroid (medel av banans greenpunkter) avgör ordningen. Ett textfilter på banans namn finns. Om spelaren nekar platsåtkomst faller listan tillbaka på alfabetisk sortering. Spelaren väljer en bana och tas vidare mot hålvyn.

**Blocked by:** 02 (Inställningar + läs banor)

**Status:** ready-for-agent

- [ ] Banlistan sorteras närmast-först med GPS-position och centroid-beräkning
- [ ] Textfilter på banans namn fungerar
- [ ] Alfabetisk fallback när platsåtkomst nekas eller saknas
- [ ] Val av bana navigerar vidare i Spelläget
- [ ] Enhetstester för centroid- och sorteringslogik
- [ ] Playwright-test: med emulerad geolocation sorteras banorna närmast-först; filtret fungerar; nekad platsåtkomst ger alfabetisk lista (ADR-0004)
