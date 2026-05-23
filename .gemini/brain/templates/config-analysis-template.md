# Config-Analyse Template – Bestehende Claude-Code-Konfiguration bewerten

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-24

## Wann verwenden?
Wenn du in ein Projekt kommst, das bereits Claude-Code-Dateien hat, oder wenn der User sagt:
- "Schau dir mein Claude-Setup an"
- "Was kann ich verbessern?"
- "Analysiere meine Config"
- "Optimiere meine CLAUDE.md"

## Analyse-Checkliste

### 1. CLAUDE.md prüfen
Lies die `CLAUDE.md` im Projekt-Root und bewerte:

| Kriterium | Gut | Verbesserungsbedarf |
|-----------|-----|---------------------|
| **Länge** | Unter 200 Zeilen | Über 200 Zeilen → @imports nutzen |
| **Struktur** | Architektur → Commands → Standards → Testing → Git | Unstrukturiert oder fehlende Abschnitte |
| **Platzhalter** | Alle ausgefüllt | `[PLACEHOLDER]` noch vorhanden |
| **Commands** | Projektspezifische Build/Test/Lint-Befehle | Generische oder fehlende Befehle |
| **@imports** | Verweist auf .claude/rules/ für Details | Alles inline, zu lang |
| **Aktualität** | Stimmt mit package.json/config überein | Veraltet oder widersprüchlich |

### 2. .claude/ Ordner durchsuchen
```
.claude/
├── settings.json          → Permissions und Hooks prüfen
├── settings.local.json    → Persönliche Overrides
├── commands/              → Vorhandene Slash Commands auflisten
├── skills/                → Vorhandene Skills auflisten
├── agents/                → Vorhandene Custom Agents auflisten
└── rules/                 → Vorhandene Rules und ihre Pfad-Patterns auflisten
```

### 3. Commands bewerten
Für jeden vorhandenen Command in `.claude/commands/`:
- Hat er eine `description`? (Erscheint bei `/help`)
- Sind `allowed-tools` definiert? (Sicherheit!)
- Nutzt er `context: fork` wo sinnvoll? (Read-only Commands)
- Stimmt die Tool-Liste mit dem Zweck überein?

**Standard-Commands die fehlen könnten:**
| Command | Vorhanden? | Empfehlung |
|---------|-----------|------------|
| review | ? | Immer empfohlen |
| test | ? | Immer empfohlen |
| refactor | ? | Empfohlen für größere Projekte |
| debug | ? | Immer empfohlen |
| commit | ? | Empfohlen wenn Git genutzt wird |

### 4. Skills bewerten
Für jeden vorhandenen Skill in `.claude/skills/`:
- Hat er `context: fork`? (EMPFOHLEN)
- Sind `allowed-tools` minimal gehalten?
- Ist die Struktur klar? (Goal → Instructions → Output)

**Standard-Skills die fehlen könnten:**
| Skill | Vorhanden? | Empfehlung |
|-------|-----------|------------|
| explore-codebase | ? | Immer empfohlen |
| plan-feature | ? | Empfohlen für Feature-Entwicklung |
| fix-bug | ? | Immer empfohlen |

### 5. Rules bewerten
Für jede vorhandene Rule in `.claude/rules/`:
- Sind die `paths:`-Patterns sinnvoll und spezifisch?
- Sind die Regeln kurz und präzise (unter 30 Zeilen)?
- Überlappen sie sich mit der CLAUDE.md? (Dann in Rule auslagern)

**Rules die fehlen könnten** (je nach Projekttyp):
| Rule | Für welches Projekt? |
|------|---------------------|
| testing.md | Jedes Projekt mit Tests |
| api-conventions.md | Projekte mit API-Endpoints |
| react-components.md | React/Next.js-Projekte |
| database.md | Projekte mit DB-Zugriff |
| security.md | Sicherheitskritische Projekte |
| python-rules.md | Python-Projekte |

### 6. Settings prüfen
Falls `.claude/settings.json` oder `.claude/settings.local.json` existiert:
- Sind Permissions sinnvoll? (deny > ask > allow)
- Sind gefährliche Befehle geblockt? (`rm -rf`, `sudo`, `.env` lesen)
- Sind Hooks konfiguriert? (z.B. Auto-Format nach Write/Edit)

### 7. MCP-Server prüfen
Falls `.mcp.json` existiert:
- Welche MCP-Server sind konfiguriert?
- Sind Env-Vars als `${VAR}` referenziert (nicht hardcoded)?
- Fehlen nützliche MCP-Server für das Projekt?

### 8. Wissensstand prüfen
- Vergleiche den Versioning-Header der Knowledge-Dateien mit dem aktuellen Datum
- Wenn älter als 3 Monate: Hinweis an User, dass ein Knowledge-Update empfohlen wird
- Wenn User aktuellere Doku hat: Anbieten, die Knowledge Base zu aktualisieren

---

## Ausgabe-Format für den User

```
## Claude Code Config-Analyse

### Status
- CLAUDE.md: ✅/⚠️/❌ [Kurzbewertung]
- Commands: [X] vorhanden, [Y] empfohlen
- Skills: [X] vorhanden, [Y] empfohlen
- Rules: [X] vorhanden, [Y] empfohlen
- Hooks: ✅ konfiguriert / ❌ nicht konfiguriert
- MCP-Server: [X] konfiguriert

### Was gut ist
- [Punkt 1]
- [Punkt 2]

### Verbesserungsvorschläge
1. [Vorschlag mit Begründung]
2. [Vorschlag mit Begründung]

### Soll ich das umsetzen?
Ich kann folgende Änderungen für dich machen:
- [ ] [Änderung 1]
- [ ] [Änderung 2]
Sag mir welche, oder "alle".
```

---

## Wichtige Regeln
- **NIEMALS** bestehende Dateien ohne Nachfrage überschreiben
- **IMMER** erst die komplette Analyse zeigen
- **IMMER** auf explizite Bestätigung warten
- Wenn die bestehende Config gut ist: Das auch sagen! Nicht um jeden Preis Änderungen vorschlagen
- Bestehende Custom-Commands/Skills respektieren – der User hat sie bewusst so gebaut
