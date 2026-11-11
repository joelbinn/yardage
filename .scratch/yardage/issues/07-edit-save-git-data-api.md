# 07: Redigeringsläge — spara via Git Data API

**What to build:** Användaren sparar en redigerad bana och hela ban-dokumentet skrivs till data-repot via Git Data API: blob → tree → commit **utan parent** → force-update av ref `main`, så att repots historik alltid är exakt en commit (ADR-0002, last-write-wins). Saknas token visas vägledning till inställningssidan. Efter save speglar Spellägets läsning den nya datan.

Eftersom tokenen ligger i localStorage (ADR-0003) och här för första gången används för att skriva, skärps appen med en **strikt Content Security Policy** så att injicerat skript inte kan läsa ut den eller skicka den vidare. GitHub Pages kan inte sätta HTTP-headers, så policyn levereras som `<meta http-equiv="Content-Security-Policy">` i produktionsbygget. Inga inline-skript, inga tredjepartsskript och `connect-src` begränsad till de origins appen faktiskt anropar.

**Blocked by:** 06 (Karteditor med Greenpunkter)

**Status:** resolved

- [x] Spara skriver ban-dokumentet till data-repot via Git Data API med orphan-commit + force-push
- [x] Data-repot har efter varje save exakt en commit i historiken
- [x] Saknad/ogiltig token ger tydlig vägledning till inställningssidan
- [x] Enhetstester för GitHubService med mockade API-anrop (inkl. force-update av ref)
- [x] Strikt CSP i produktionsbygget: `default-src 'self'`; `script-src 'self'` (ingen `'unsafe-inline'`/`'unsafe-eval'`, inga externa skript); `connect-src 'self' https://api.github.com https://raw.githubusercontent.com`; `img-src` tillåter endast `'self'`, `data:` och Esri World Imagery-tiles; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`. (`frame-ancestors` går inte att sätta via meta-tagg.)
- [x] Angulars inline-utdata är förenlig med policyn — t.ex. via `security.autoCsp` eller genom att stänga av `inlineCritical` — och Leaflets stilar laddas från eget origin, inte CDN
- [x] Service workern (`ngsw-worker.js`) och PWA-manifestet fungerar under policyn
- [x] Playwright-test mot produktionsbuild (som i ticket 08): spara-flödet och Spellägets läsning ger inga CSP-överträdelser (`securitypolicyviolation`/konsolfel), och ett försök att ladda skript eller anropa en ej listad origin blockeras (ADR-0004)
- [x] ADR-0003:s Consequences uppdateras med att CSP är en del av mitigeringen
- [x] Playwright-test: spara skickar blob → tree → commit (utan parent) → ref-update mot mockat GitHub API; saknad token visar vägledning (ADR-0004)
