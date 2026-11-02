# Yardage

Yardage är en webbapp för golfare som visar avståndet från spelarens aktuella position till green. Begreppen nedan är appens domänspråk och används konsekvent i UI, kod och dokumentation.

## Language

**Bana**:
En i appen registrerad golfbana med ett namn och 9 eller 18 hål.
_Avoid_: golfbana, kurs, klubb

**Hål**:
Ett av en banas hål, identifierat av sitt hålnummer och knutet till exakt en greenpunkt.
_Avoid_: hole, nummer

**Greenpunkt**:
Den koordinat som markerar mitten av green för ett hål; referensen för all avståndsmätning.
_Avoid_: greenposition, pin, flagga, green-mitten

**Avstånd**:
Avståndet i hela meter från spelarens aktuella position till greenpunkten för det aktiva hålet.
_Avoid_: distans, längd, yardage (som måttenhet)

**Spelare**:
Personen som använder appen i spelläget och vars position avståndet mäts från.
_Avoid_: användare, kund

**Redigeringsläge**:
App-läget, avsett för desktop med stor skärmyta, där banor registreras och korrigeras.
_Avoid_: edit-läge, adminläge, backend-läge

**Spelläge**:
App-läget, avsett för mobil, där spelaren slår upp avstånd till green för en vald bana.
_Avoid_: play-läge, spelläge på bana, matchläge

**Data-repo**:
Det publika GitHub-repo som lagrar alla registrerade banor som ett enda JSON-dokument (`courses.json`).
_Avoid_: databas, backend, server
