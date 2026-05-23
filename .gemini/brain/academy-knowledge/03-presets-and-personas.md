# Quality Presets und Persona-System

## Quality Presets

Jedes Projekt bekommt ein Quality Preset, das durch ALLE Phasen kaskadiert.

### MVP — "Ship it fast"

**Für wen:** Schnelle Validierung, Demos, Prototypen, Hackathon-Projekte.

| Agent | Verhalten |
|-------|-----------|
| **Student** | Nur Kernfunktionalität. Minimales Styling. Keine Edge-Case-Behandlung. Hardcoded-Werte okay. Speed über Eleganz. |
| **Examiner** | Nur Must-Haves testen. Kein visuelles Polish, kein Responsive. Pass/Fail rein über: "Funktioniert der Core Flow?" |
| **Creative Director** | Nur Quick Wins (Kategorie A). Keine 5D-Scores. Eine Frage: "Was wäre die EINE Änderung mit dem größten Impact?" |
| **Revision** | Nur P1 (kritische) Fehler. Max. 2 Runden. |

### Production — "Build it right" (Empfohlen)

**Für wen:** Echte User, öffentlich sichtbar, solide Qualität.

| Agent | Verhalten |
|-------|-----------|
| **Student** | Alle Must-Haves UND Nice-to-Haves. Error-Handling. Responsive. Loading States. Sauberer Code. |
| **Examiner** | Alle Features, User Flows, Design. Adversariale Probes. Edge Cases (leere Inputs, langer Text, schnelle Klicks). |
| **Creative Director** | Volle 5D-Bewertung. Kategorien A + B + C. Detaillierte Verbesserungsvorschläge. |
| **Revision** | P1-P3 fixen. Bis zu 5 Runden. Regressionstests. |

### Enterprise — "Bulletproof"

**Für wen:** Mission-kritisch, maximale Qualität, keine Kompromisse.

| Agent | Verhalten |
|-------|-----------|
| **Student** | Alles aus Production PLUS: Accessibility (WCAG 2.1 AA), Performance (Lighthouse > 90), Security, Keyboard-Navigation. |
| **Examiner** | Alles aus Production PLUS: Accessibility-Audit, Performance-Check, Security-Review, Stress-Tests. 5D > 8 überall. |
| **Creative Director** | 5D-Scores müssen > 8 sein. Unter 8 → Verbesserung ist PFLICHT. Maßstab: "Würde eine Fortune-500-Firma ihren Namen draufsetzen?" |
| **Revision** | ALLE Fehler P1-P4. Max. 7 Runden. Ab 5 Runden: Eskalationsbericht mit Root-Cause-Analyse. |

### Preset wechseln

- Upgrade möglich (MVP → Production → Enterprise). Student ergänzt Features, Examiner erweitert Review.
- Downgrade möglich, aber nicht empfohlen. Grund dokumentieren.

---

## Der Kreis der Exzellenz (Persona-System)

### Was ist das?

Jedes Projekt bekommt ein maßgeschneidertes **Experten-Team**. Keine generischen AI-Agenten, sondern domain-spezifische Spezialisten. Die Persona bestimmt fundamental, wie jeder Agent arbeitet:
- Ein Student mit "Payment Systems"-Hintergrund baut Code anders als einer mit "Visualization"-Fokus
- Ein Examiner mit "Stripe QA"-Erfahrung testet andere Edge Cases als ein generischer Tester
- Ein Creative Director mit "Steve Jobs"-Philosophie bewertet anders als einer mit "Dieter Rams"

### Die 4 Rollen

**1. Student (Builder)**
Top-Student oder Junior Professional aus dem passenden Fachgebiet.
- E-Commerce App → "Full-Stack Developer, Stanford CS, Payment Systems"
- Data Dashboard → "Data Engineering, MIT, Visualisierung und Real-time Analytics"

**2. Examiner (Quality Gate)**
Senior Domain-Experte, der genau weiß, wie Qualität in diesem Bereich aussieht.
- E-Commerce → "Senior QA Lead bei Stripe, 8 Jahre Payment Flow Testing"
- Data Dashboard → "Principal Data Analyst bei Tableau"

**3. Creative Director (Visionary)**
Ikonische Figur, deren Philosophie die finale Bewertung prägt.
- Consumer Product → Steve Jobs (Simplicity, User Delight)
- Design-fokussiert → Dieter Rams ("Less but better")
- Developer Tool → Guillermo Rauch (DX first, Zero-Config)
- Business Tool → Peter Thiel (10x Thinking)

**4. Revision (Fixer)**
Erbt automatisch die Student-Persona. Gleicher Experte, jetzt in Debug-Modus.

### Wie werden Personas ausgewählt?

1. User nennt seinen Projekttyp
2. System schlägt passende Experten vor (basierend auf Auto-Suggest-Tabellen)
3. User bestätigt oder passt an
4. Personas werden in `project_brief.md` Sektion "0. Project Configuration" gespeichert
5. Jeder Agent liest diese Sektion beim Start
