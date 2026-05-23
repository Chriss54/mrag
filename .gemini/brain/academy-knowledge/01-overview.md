# Claude Code Academy — Übersicht

## Was ist die Claude Code Academy?

Die Claude Code Academy ist ein **4-Phasen Multi-Agent System**, das App-Projekte von der Idee bis zum fertigen, getesteten und creative-reviewten Produkt begleitet. Es funktioniert wie ein professionelles Entwicklungsteam mit spezialisierten Rollen.

## Die Kernidee

Statt dass ein einzelner AI-Agent alles macht (und dabei Fehler übersieht), teilt die Academy das Projekt in 4 spezialisierte Phasen auf — jede mit einem eigenen Agenten, der frischen Kontext hat und unvoreingenommen arbeitet.

## Der Workflow

```
Phase 0+1: Student (Prompt Architect)
    → Onboarding-Interview mit dem User
    → project_brief.md generieren
    → App bauen

Phase 2: Examiner
    → App adversarial testen (versucht sie zu brechen)
    → examiner_report.md mit VERDICT: PASS/FAIL

Phase 3: Revision
    → Examiner-Feedback einarbeiten
    → Bugs fixen in Prioritätsreihenfolge
    → revision_log.md

↻ Loop: Examiner → Revision → Examiner (bis PASSED)

Phase 4: Creative Director
    → Ganzheitliche Bewertung als ikonische Persönlichkeit
    → 10x Verbesserungsvorschläge
    → creative_review.md

↻ Loop: User wählt Verbesserungen → Student baut → Examiner prüft → ...
```

## Die 3-Layer Architektur

Das System basiert auf einer klaren Schichtentrennung:

| Layer | Was | Wo |
|-------|-----|-----|
| **Directive** (Was tun) | SOPs in Markdown | `directives/` |
| **Orchestration** (Entscheidung) | Der AI-Agent selbst | Agent-Instruktionen |
| **Execution** (Ausführung) | Deterministische Python-Skripte | `execution/` |

**Warum?** LLMs sind probabilistisch (90% Genauigkeit pro Schritt = nur 59% nach 5 Schritten). Deterministische Skripte eliminieren dieses Problem.

## Projekttypen

Die Academy unterstützt drei Projekttypen:

- **Web-App** — Interaktive Browser-Anwendungen (Dashboards, SaaS, E-Commerce, Landing Pages)
- **Automation / Workflow** — Hintergrundprozesse, API-Integrationen, Event-Pipelines
- **Hybrid** — Web-App + automatisierte Hintergrund-Workflows

## Wie starte ich die Academy?

In Antigravity: Sage "Starte die Academy" oder "Academy-Modus" → Der Router wechselt automatisch.

In Claude Code: Nutze den Skill `/academy-onboard` für das Onboarding-Interview.
