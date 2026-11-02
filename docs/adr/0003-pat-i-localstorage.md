# PAT i localStorage

Redigeringsläget behöver en GitHub-token för att skriva till data-repot, och appen har ingen backend att förvara den i. Vi beslöt att spara användarens fine-grained PAT i localStorage, med minimal scope (`contents:write` på endast data-repot), i utbyte mot bekvämlighet: tokenen överlever sessioner och behöver inte matas in vid varje redigering.

## Considered Options

- sessionStorage / manuell inmatning varje gång: säkrare mot bestående exfiltrering, men betydligt sämre UX vid upprepad redigering.
- localStorage: valt — XSS på GitHub Pages är en teoretisk risk, men konsekvensen begränsas av att tokenen endast kan skriva till ett repo med publik bandata som ändå saknar sekretess.

## Consequences

- UI:t måste tydligt visa vad tokenen kan och hur man återkallar den.
- Användaren ansvarar för att skapa PAT:en med rätt (minimal) scope — appen kan inte begära den via OAuth-flöde utan backend.
