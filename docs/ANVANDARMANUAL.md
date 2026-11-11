# Användarmanual — Yardage

Yardage visar **avståndet i meter från din position till green** på det hål du spelar. Du registrerar dina banor i förväg på datorn (Redigeringsläge) och slår upp avståndet på mobilen under rundan (Spelläge).

Appen har ingen server. Banorna sparas i ett eget publikt GitHub-repo, ditt **data-repo**, och appen körs från GitHub Pages: `https://<ditt-github-namn>.github.io/yardage/`.

Begreppen (Bana, Hål, Greenpunkt, Avstånd, Data-repo) följer [GLOSSARY.md](../GLOSSARY.md).

---

## 1. Kom igång (en gång)

### 1.1 Skapa ett data-repo

1. Logga in på GitHub och skapa ett nytt repo med namnet **`yardage-data`**.
2. Välj **Public**. Appen läser banorna utan inloggning, så repot måste vara publikt.
3. Repot får vara tomt. Yardage skapar `courses.json` första gången du sparar.

> Banorna är publika. Spara inget hemligt i bannamnen.

### 1.2 Skapa en GitHub-token (krävs bara för att spara banor)

För att läsa banor behövs ingen token. För att **spara** från Redigeringsläget behövs en *fine-grained personal access token* med minsta möjliga behörighet:

1. Gå till GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens** och välj **Generate new token**.
2. **Repository access:** *Only select repositories* — välj **endast** `yardage-data`.
3. **Permissions:** *Contents: Read and write*. Inga andra behörigheter.
4. Kopiera tokenen. GitHub visar den bara en gång.

### 1.3 Ställ in appen

Öppna Yardage och välj **Inställningar**.

1. **Data-repo:** fyll i *Ägare* (ditt GitHub-användarnamn eller din organisation). *Reponamn* är förifyllt med `yardage-data`. Tryck **Spara data-repo**.
2. **GitHub-token** (på datorn där du redigerar): klistra in tokenen och tryck **Spara token**. Texten *"En token är sparad i den här webbläsaren."* bekräftar att den är sparad.

Inställningarna sparas bara i den här webbläsaren (localStorage). På mobilen räcker det att ställa in data-repot; där behövs ingen token.

---

## 2. Registrera en bana (Redigeringsläge, dator)

Välj **Redigeringsläge** på startsidan.

### 2.1 Skapa banan

1. Under **Skapa bana**, ange *Namn* (t.ex. "Ullna GK") och välj *Hålantal*: **9 hål** eller **18 hål**.
2. Tryck **Skapa bana**. Banan visas i listan **Banor** med hålen numrerade från 1.

### 2.2 Sätt greenpunkterna

1. Tryck **Redigera** vid banan. En satellitkarta och en lista över banans hål visas.
2. Det aktiva hålet är markerat i listan. Zooma in på greenen och **klicka mitt på den**. Greenpunkten sätts och appen går vidare till nästa hål.
3. Upprepa för alla hål. Hål som ännu saknar punkt är märkta *"— greenpunkt saknas"*.
4. **Korrigera** en punkt genom att dra markören, eller välj hålet i listan och klicka på rätt ställe.
5. **Par** kan anges per hål. Fältet är valfritt och visas inte i Spelläget.

En 18-hålsbana tar normalt under 15 minuter.

### 2.3 Spara

1. Tryck **Spara banor** under **Spara**.
2. Vid *"Banorna är sparade i data-repot."* är allt klart.

Bra att veta:

- **Hela ban-dokumentet skrivs varje gång** och ersätter det som finns i data-repot. Redigerar du på två datorer samtidigt vinner den som sparar sist.
- **Du kan spara en halvfärdig bana.** Hål utan greenpunkt visar *"Greenpunkt saknas"* i Spelläget tills du lagt till punkten.
- Tryck **Ta bort** för att ta bort en bana ur listan. Borttagningen gäller i data-repot först när du sparar.
- Ändringar som inte sparats försvinner om du laddar om sidan.

---

## 3. Spela (Spelläge, mobil)

Välj **Spelläge** på startsidan. Tillåt platsåtkomst när webbläsaren frågar.

### 3.1 Välj bana

- Banorna listas **närmast först** utifrån din position.
- Skriv i **Sök bana** för att filtrera på namn.
- Har du nekat platsåtkomst visas banorna i bokstavsordning.
- Tryck på banan för att öppna hålvyn.

### 3.2 Hålvyn

Hålvyn visar bara det du behöver:

| Del | Betydelse |
|-----|-----------|
| **Hål N** | Hålet du spelar |
| **Avstånd till green** | Meter (heltal) från din position till greenpunkten. Uppdateras medan du går. |
| **±N m** | GPS-noggrannheten just nu. Lägre är bättre. |
| **Föregående hål / Nästa hål** | Byt hål. Knapparna är gråa på första respektive sista hålet. |
| **Stäng** | Tillbaka till banvalet |

Avståndet mäts **fågelvägen till mitten av green**, alltså greenpunkten du registrerade.

### 3.3 Synka banor

Spelläget läser banorna en gång per besök. Har du ändrat banor på en annan enhet, tryck **Synka banor** i banvalet för att hämta den senaste versionen.

> Direkt efter en sparning kan GitHub svara med den gamla versionen i några minuter. Vänta en stund och synka igen om ändringen inte syns.

### 3.4 Offline

När du har öppnat Spelläget med nätverk en gång finns appen och banorna i telefonens cache. Bansökning och hålvy fungerar sedan **utan täckning**, eftersom GPS inte kräver nätverk. Med täckning hämtas senaste bandata automatiskt.

**Tips:** öppna Spelläget hemma eller i klubbhuset innan rundan. Lägg gärna appen på hemskärmen via webbläsarens meny ("Lägg till på hemskärmen").

---

## 4. Felsökning

| Meddelande / problem | Åtgärd |
|---|---|
| *Inget data-repo är inställt.* | Gå till **Inställningar** och spara ägare och reponamn. |
| *Hittade inget ban-dokument (courses.json)…* | Repot är tomt eller fel. Kontrollera ägare/reponamn, eller skapa och spara en första bana i Redigeringsläget. |
| *Data-repot kunde inte nås.* | Ingen täckning och inget cachat innehåll, eller fel repo. Kontrollera nätverk och inställningar. |
| *Ban-dokumentet kunde inte tolkas.* | `courses.json` har ändrats för hand och är ogiltig. Spara om från Redigeringsläget. |
| *GitHub avvisade tokenen…* | Tokenen är ogiltig, har gått ut eller saknar skrivbehörighet till data-repot. Skapa en ny (avsnitt 1.2) och spara den under Inställningar. |
| *Sparning kräver en GitHub-token.* | Lägg in token under Inställningar. |
| *Platsåtkomst saknas — Avståndet kan inte beräknas.* | Tillåt platsåtkomst för sidan i webbläsarens inställningar och ladda om. |
| *Greenpunkt saknas* | Hålet har ingen greenpunkt. Lägg till den i Redigeringsläget och spara. |
| Avståndet hoppar | GPS-noggrannheten (±N m) är dålig. Vänta några sekunder i öppen terräng. |

---

## 5. Säkerhet och integritet

- Tokenen sparas **endast i din webbläsare** och skickas bara till `api.github.com`. Den lämnar aldrig din enhet på något annat sätt.
- Tokenen kan bara skriva till ditt data-repo. Den kommer inte åt dina andra repon.
- **Radera token** på inställningssidan tar bort den från webbläsaren.
- **Återkalla** tokenen helt: GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens*, välj tokenen och tryck **Delete**.
- Din position används bara lokalt i telefonen för att räkna ut avståndet. Den sparas inte och skickas inte någonstans.
- Data-repot behåller **bara den senaste versionen** av banorna (ingen historik).
