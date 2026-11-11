# 06: Redigeringsläge — karteditor med Greenpunkter

**What to build:** Användaren redigerar en bana på en satellitkarta (Leaflet + Esri World Imagery, nyckellös, med attributering). En sidopanel listar banans hål och ett hål är aktivt åt gången. Klick på kartan sätter greenpunkten för det aktiva hålet; befintliga greenpunkter renderas som markörer som går att dra för korrigering. Par är ett valfritt fält per hål. Registrering av en 18-hålsbana ska kunna göras på under 15 minuter.

**Blocked by:** 05 (Bankurslista + skapa Bana)

**Status:** resolved

- [x] Satellitkarta (Leaflet + Esri World Imagery) med attributering visas
- [x] Sidopanel med hållista; ett hål är aktivt åt gången
- [x] Klick på kartan sätter greenpunkten för det aktiva hålet
- [x] Befintliga greenpunkter är dragbara markörer
- [x] Par kan anges valfritt per hål
- [x] Playwright-test: klick på kartan sätter greenpunkt för aktivt hål och markör kan dras (Esri-tiles mockade) (ADR-0004)
