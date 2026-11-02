# 02: Inställningar + läs banor från Data-repo

**What to build:** Användaren konfigurerar appen på inställningssidan: data-repo (owner + repo-namn, default `yardage-data`) och GitHub-token (fine-grained PAT), båda sparade i localStorage. UI:t visar tydligt vad tokenen kan och hur man återkallar den (ADR-0003). Med konfigurationen på plats läser appen banorna ur data-repots enda JSON-dokument via raw-URL — utan autentisering — och visar dem som en lista. Saknas dokumentet visas ett tydligt fallback-meddelande. Domäntyperna (Bana, Hål, Greenpunkt) enligt GLOSSARY.md och specens datamodell etableras här.

**Blocked by:** 01 (Gående skelett)

**Status:** ready-for-agent

- [ ] Inställningssidan sparar och läser tillbaka data-repo-konfiguration och token i localStorage
- [ ] Token-sidan förklarar PAT:ens minimiscope (`contents:write` på endast data-repot) och hur den återkallas
- [ ] Banor listas efter att ett data-repo med ett ban-dokument konfigurerats
- [ ] Tydligt meddelande när ban-dokumentet saknas eller repot inte nås
- [ ] Enhetstester för tolkning/validering av ban-dokumentet
