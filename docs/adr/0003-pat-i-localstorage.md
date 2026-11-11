# PAT i localStorage

Redigeringsläget behöver en GitHub-token för att skriva till data-repot, och appen har ingen backend att förvara den i. Vi beslöt att spara användarens fine-grained PAT i localStorage, med minimal scope (`contents:write` på endast data-repot), i utbyte mot bekvämlighet: tokenen överlever sessioner och behöver inte matas in vid varje redigering.

## Considered Options

- sessionStorage / manuell inmatning varje gång: säkrare mot bestående exfiltrering, men betydligt sämre UX vid upprepad redigering.
- localStorage: valt — XSS på GitHub Pages är en teoretisk risk, men konsekvensen begränsas av att tokenen endast kan skriva till ett repo med publik bandata som ändå saknar sekretess.

## Consequences

- UI:t måste tydligt visa vad tokenen kan och hur man återkallar den.
- Användaren ansvarar för att skapa PAT:en med rätt (minimal) scope — appen kan inte begära den via OAuth-flöde utan backend.
- En strikt Content Security Policy är en del av mitigeringen (ticket 07): produktionsbygget levererar den som `<meta http-equiv="Content-Security-Policy">` (`frontend/src/index.prod.html`), eftersom GitHub Pages inte kan sätta HTTP-headers. `script-src 'self'` utan `'unsafe-inline'`/`'unsafe-eval'` gör att injicerat skript inte kan köras, och `connect-src` begränsad till `api.github.com` och `raw.githubusercontent.com` gör att tokenen inte kan skickas till andra origins. `style-src` tillåter inline eftersom Angular injicerar komponentstilar som `<style>`; CSS kan inte läsa localStorage. `frame-ancestors` kan inte sättas via meta-tagg. Dev-servern (`ng serve`) körs utan policy — CSP verifieras i Playwright-projektet `offline` mot produktionsbygget (`e2e/07-csp-prod.spec.ts`).
