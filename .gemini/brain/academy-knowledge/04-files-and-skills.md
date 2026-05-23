# Dateien, Verzeichnisse und Skills

## Verzeichnisstruktur

```
claude-code-academy-operating-room/
├── AGENTS.md / CLAUDE.md / GEMINI.md    ← Haupt-Instruktionen (je AI-Tool)
├── GEMINI-teacher.md                     ← Claude Code Teacher-Modus
├── GEMINI-academy.md                     ← Academy-Agent-Modus
│
├── Student (Prompt Architect)/           ← Agent 1: Builder
│   └── AGENTS.md / CLAUDE.md / GEMINI.md
├── The Examiner/                         ← Agent 2: Tester
│   └── AGENTS.md / CLAUDE.md / GEMINI.md
├── The Revision/                         ← Agent 3: Fixer
│   └── AGENTS.md / CLAUDE.md / GEMINI.md
├── The Creative Director/                ← Agent 4: Visionary
│   └── AGENTS.md / CLAUDE.md / GEMINI.md
│
├── directives/                           ← SOPs (Standard Operating Procedures)
│   ├── onboarding_interview.md           ← Interview-Ablauf
│   ├── quality_presets.md                ← MVP/Production/Enterprise Definition
│   ├── persona_selection.md              ← Experten-Team Auswahl
│   ├── examiner_review.md                ← Examiner Review-Prozess
│   ├── revision_cycle.md                 ← Revision-Prozess
│   ├── creative_review.md                ← Creative Director Prozess
│   ├── academy_memory.md                 ← Memory-System SOP
│   ├── academy_dream.md                  ← Dream Agent (Memory-Konsolidierung)
│   ├── coordinator_mode.md               ← Coordinator-Modus
│   ├── common_issues.md                  ← Bekannte Probleme (Self-Annealing)
│   └── creative_patterns.md              ← User-Präferenzen
│
├── execution/                            ← Deterministische Python-Skripte
│   ├── load_context.py                   ← Kontext laden für Agenten
│   ├── academy_orchestrator.py           ← Orchestrierungs-Engine
│   ├── academy_status.py                 ← Status-Abfrage
│   ├── specialist_registry.py            ← Specialist Injection Pattern
│   ├── precondition_check.py             ← Vorbedingungen prüfen
│   ├── memory_validate.py                ← Memory validieren
│   ├── metrics_collector.py              ← Metriken sammeln
│   ├── dream_consolidate.py              ← Dream Agent Logik
│   ├── sync_mirrors.py                   ← Mirror-Sync (AGENTS↔CLAUDE↔GEMINI)
│   └── test_academy_integrity.py         ← Integritätstest
│
├── academy_memory/                       ← Persistentes Memory (überlebt Sessions)
│   ├── MEMORY.md                         ← Index aller Erinnerungen
│   ├── user/                             ← User-Profile und Präferenzen
│   ├── feedback/                         ← Was funktioniert, was nicht
│   ├── project/                          ← Projekt-übergreifendes Wissen
│   └── reference/                        ← Tool-Referenzen, API-Quirks
│
├── .claude/skills/                       ← Claude Code Skills (Slash Commands)
│   ├── academy-onboard/                  ← /academy-onboard
│   ├── academy-build/                    ← /academy-build
│   ├── academy-examine/                  ← /academy-examine
│   ├── academy-revise/                   ← /academy-revise
│   ├── academy-creative/                 ← /academy-creative
│   ├── academy-orchestrate/              ← /academy-orchestrate
│   ├── academy-status/                   ← /academy-status
│   ├── academy-dream/                    ← /academy-dream
│   └── academy-selftest/                 ← /academy-selftest
│
├── .gemini/brain/                        ← Antigravity Wissensdatenbank
│   ├── claude-code-knowledge/            ← Wissen über Claude Code
│   ├── academy-knowledge/                ← Wissen über die Academy
│   └── templates/                        ← Konfigurator-Templates
│
├── academy_manual.html/.md               ← Benutzerhandbuch
├── specialist_manual.html/.md            ← Specialist-System Handbuch
├── architecture.html                     ← Interaktive Architektur-Übersicht
└── .academy_scratch/                     ← Scratch-Bereich für temporäre Dateien
```

## Shared Files (werden pro Projekt erstellt und wieder gelöscht)

| Datei | Erstellt von | Gelesen von | Inhalt |
|-------|-------------|-------------|--------|
| `project_brief.md` | Student | Alle Agenten | Zentrale Projektdokumentation |
| `examiner_report.md` | Examiner | Revision, Creative Director | Testergebnisse mit VERDICT |
| `revision_log.md` | Revision | Examiner (Re-Review) | Fix-Protokoll |
| `creative_review.md` | Creative Director | User, Student | 5D-Bewertung + Vorschläge |
| `creative_prompts_round_X.md` | Creative Director | Student | Umsetzungs-Prompts |

## Verfügbare Skills (Claude Code)

| Skill | Beschreibung | Phase |
|-------|-------------|-------|
| `/academy-onboard` | Startet das Onboarding-Interview | 0 |
| `/academy-build` | Startet die Build-Phase | 1 |
| `/academy-examine` | Startet den Examiner Review | 2 |
| `/academy-revise` | Startet die Revision | 3 |
| `/academy-creative` | Startet den Creative Director Review | 4 |
| `/academy-orchestrate` | Automatischer Phasen-Ablauf | Alle |
| `/academy-status` | Zeigt aktuellen Projektstatus | Info |
| `/academy-dream` | Konsolidiert Memory nach Projekt | Meta |
| `/academy-selftest` | Integritätstest des Systems | Meta |

## Memory-System

Die Academy hat ein persistentes Memory-System, das Session-übergreifend lernt:

- **User-Memories:** Wer ist der User? Erfahrungslevel, Präferenzen
- **Feedback-Memories:** Was funktioniert, was nicht? Fehlerquellen
- **Projekt-Memories:** Kontext, der nicht aus dem Code ableitbar ist
- **Reference-Memories:** Tool-Referenzen, API-Quirks

Der **Dream Agent** (`/academy-dream`) konsolidiert nach jedem Projektzyklus alle Learnings.

## Self-Annealing

Jeder Fehler ist eine Lernmöglichkeit:
1. Fehler beheben
2. Tool/Skript updaten
3. Testen
4. Directive aktualisieren
5. System ist stärker

`directives/common_issues.md` wird automatisch mit neuen Erkenntnissen erweitert.
