# Die 4 Agenten — Rollen und Aufgaben

## Agent 1: Student (Prompt Architect)

**Phase:** 0 + 1 (Onboarding + Build)
**Ordner:** `Student (Prompt Architect)/`
**Persona:** Domain-spezifischer Entwickler (wird im Onboarding festgelegt)

### Was macht der Student?

**Phase 0 — Onboarding-Interview:**
1. Begrüßt den User
2. Fragt nach Projekttyp (Web-App / Automation / Hybrid)
3. Lässt den User ein Quality Preset wählen (MVP / Production / Enterprise)
4. Schlägt ein Experten-Team vor (Kreis der Exzellenz)
5. Führt ein 5-Block Interview durch (Vision, Features, Design, Tech, Zeitplan)
6. Generiert `project_brief.md` — das zentrale Dokument für alle Agenten

**Phase 1 — Build:**
- Baut die App basierend auf dem `project_brief.md`
- Arbeitet als die zugewiesene Domain-Persona (z.B. "Full-Stack Developer, Stanford CS, Payment Systems")
- Liefert eine funktionierende App v1

### Wie starte ich den Student?
- Skill: `/academy-onboard` (Interview)
- Skill: `/academy-build` (Build-Phase)

---

## Agent 2: The Examiner

**Phase:** 2 (Review)
**Ordner:** `The Examiner/`
**Persona:** Domain-spezifischer QA-Experte

### Was macht der Examiner?

Der Examiner ist ein **adversarialer Tester** — seine Aufgabe ist es, die App zu brechen, nicht zu bestätigen dass sie funktioniert.

**Arbeitsweise:**
1. Liest `project_brief.md` (niemals den Student-Kontext!)
2. Nimmt seine zugewiesene QA-Persona an
3. Baut und startet die App
4. Verifiziert jedes Must-Have Feature
5. Führt adversariale Probes durch (Concurrency, Boundary, Idempotency, etc.)
6. Erstellt `examiner_report.md` mit VERDICT: PASS / FAIL / PARTIAL

**Kernprinzip:** READ-ONLY. Der Examiner ändert niemals Code. Er testet nur.

**Anti-Rationalization Guard:**
- ❌ "Code sieht korrekt aus" → ✅ Hast du es AUSGEFÜHRT?
- ❌ "Tests laufen" → ✅ Hast du UNABHÄNGIG verifiziert?
- ❌ "Wahrscheinlich okay" → ✅ Hast du es BEWIESEN?

### Wie starte ich den Examiner?
- Skill: `/academy-examine`

---

## Agent 3: The Revision

**Phase:** 3 (Fix)
**Ordner:** `The Revision/`
**Persona:** Erbt die Student-Persona (selber Entwickler, jetzt in Debug-Modus)

### Was macht die Revision?

1. Liest den `examiner_report.md`
2. Priorisiert Findings nach Schweregrad (P1 = Kritisch → P4 = Nice-to-have)
3. Fixt Root Causes (nicht Symptome!)
4. Testet jeden Fix einzeln
5. Prüft auf Regressionen
6. Dokumentiert alles in `revision_log.md`

**Context-Sharing:** Die Revision nutzt das **Fork-Pattern** — sie erbt den Student-Kontext, weil sie den gleichen Code versteht. Der Examiner bekommt dagegen immer frischen Kontext (unvoreingenommen).

### Wie starte ich die Revision?
- Skill: `/academy-revise`

---

## Agent 4: The Creative Director

**Phase:** 4 (Evaluation)
**Ordner:** `The Creative Director/`
**Persona:** Ikonische Visionärsfigur (z.B. Steve Jobs, Dieter Rams, etc.)

### Was macht der Creative Director?

Er evaluiert die fertige, bug-freie App ganzheitlich — nicht als Entwickler, sondern als visionärer Leader.

**Arbeitsweise:**
1. Nimmt seine zugewiesene Persona an (z.B. Dieter Rams)
2. Erlebt die App als First-Time-User (5-Sekunden-Test, Core Flow, Emotionen)
3. Vergibt 5D-Scores: Clarity, Efficiency, Aesthetics, Robustness, Excitement
4. Formuliert 10x-Verbesserungsvorschläge (nur was wirklich einen Unterschied macht)
5. Präsentiert dem User und fragt: "Welche Vorschläge möchtest du umsetzen?"
6. Generiert Prompts für den Student (`creative_prompts_round_X.md`)

**10x-Filter:** "Würde [ikonische Figur] darauf bestehen? Oder ist es kosmetisch?" → Kosmetisch = Streichen.

### Wie starte ich den Creative Director?
- Skill: `/academy-creative`
