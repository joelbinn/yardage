# 04: Spelläge — hålvyn med live Avstånd

**What to build:** Spelaren ser hålvyn för den valda banan: endast hålnummer, uppgiften "Avstånd till green" i hela meter, navigering till föregående/nästa hål och en stäng-knapp. Avståndet beräknas med haversine från spelarens aktuella position till det aktiva hålets greenpunkt och uppdateras live medan spelaren går (`watchPosition`). En diskret noggrannhetsindikator (t.ex. "±8 m") visas. "Föregående" är disabled på hål 1, "Nästa" är disabled på sista hålet (ingen wrap); stäng återgår till banvalet. Hålvyn är läsbar i solljus: stor typografi, hög kontrast.

**Blocked by:** 03 (Bansökning närmast-först)

**Status:** ready-for-agent

- [ ] Hålvyn visar endast hålnummer, "Avstånd till green" (hela meter), föregående/nästa och stäng
- [ ] Avståndet uppdateras live via `watchPosition` och beräknas med haversine till greenpunkten
- [ ] Noggrannhetsindikator för GPS visas diskret
- [ ] Navigeringen är disabled i ändarna; stäng återgår till banvalet
- [ ] Enhetstester för haversine-beräkningen
- [ ] Playwright-test: hålvyn visar avstånd från emulerad position, uppdateras när positionen ändras, föregående/nästa är disabled i ändarna och stäng återgår till banvalet (ADR-0004)
