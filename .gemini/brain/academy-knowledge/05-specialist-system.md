# Specialist Injection Pattern — On-Demand Expert Consultation

## The Problem

The Student has ONE primary persona (e.g., "Full-Stack Developer, Stanford CS, Payment Systems"). But real-world projects have sub-tasks outside that expertise — a payment expert still needs to set up database schemas, write CSS, or configure CI/CD pipelines.

## The Solution: Specialist Pool

Instead of being stuck with one skill set, the Student has access to a **pool of 8 domain specialists** that can be consulted on-demand. This is NOT handing off work — it's a structured internal consultation where the Student temporarily thinks like the specialist, then returns to their own persona.

## The 8 Specialists

| # | Domain | Specialist | Example Triggers |
|---|--------|-----------|-----------------|
| 1 | 🔐 Auth & Security | Security Engineer — OWASP Top-10 Expertise | jwt, oauth, login, csrf, xss, encryption |
| 2 | 🗄️ Database | Database Architect — Schema Design, Query Optimization | sql, prisma, migration, schema, index, n+1 |
| 3 | 🎨 Styling & Design | UI/UX Engineer — Design Systems, Accessibility | css, tailwind, responsive, animation, a11y |
| 4 | 🔌 API Integration | API Architect — RESTful Design, Error Handling | api, rest, graphql, webhook, fetch, retry |
| 5 | 🧪 Testing | QA Engineer — Test Pyramid, E2E Automation | test, jest, cypress, mock, coverage, e2e |
| 6 | 🐳 DevOps | DevOps Engineer — CI/CD, Containerization | docker, deploy, kubernetes, github actions |
| 7 | ⚡ Performance | Performance Engineer — Core Web Vitals, Bundle Optimization | lighthouse, lazy load, code splitting, memoize |
| 8 | 🔄 State Management | State Architecture Engineer — Reactive Patterns | redux, zustand, context, store, optimistic update |

## How It Works

### Automatic Detection

The Student runs a check before implementing each task:

```bash
python3 execution/specialist_registry.py --check-task "implement JWT auth login"
```

**Output:**
```
🔄 KONSULTATION: [🔐 Auth & Security]
   Specialist: Security Engineer — OWASP Top-10 Expertise
   Matched Triggers: jwt, auth, login
   Confidence: 3 trigger(s) matched
```

### File-Based Detection

When editing domain-specific files:

```bash
python3 execution/specialist_registry.py --check-file "src/auth/middleware.ts"
```

**Output:**
```
📁 Dateianalyse: `src/auth/middleware.ts`
🔄 KONSULTATION: [🔐 Auth & Security]
   Specialist: Security Engineer — OWASP Top-10 Expertise
   Matched Pattern: **/auth/**
```

### Pool Generation

At the start of each project, the pool is auto-generated based on the tech stack:

```bash
python3 execution/specialist_registry.py --generate
```

This reads `project_brief.md` Section 6 (Tech Stack), detects relevant technologies, and activates the matching specialists (🟢 Active vs ⚪ Standby).

## The Consultation Protocol

When a specialist is needed, the Student follows this flow:

1. **Flag:** Outputs `🔄 KONSULTATION: [Domain-Specialist]` — visible to user and Examiner
2. **Adopt:** Temporarily thinks from the specialist's perspective
3. **Self-consult:** What best practices, patterns, and pitfalls does this specialist know?
4. **Return:** Goes back to Student persona
5. **Integrate:** Builds the specialist's advice into the codebase holistically

**Key principle:** The Student doesn't hand off work. They *temporarily become* the specialist, then return to their builder role with enriched knowledge.

## How This Differs from the Examiner

The Examiner also has domain-specific QA expertise, but:
- **Student Specialists** = proactive consultation during BUILD (prevent mistakes)
- **Examiner** = adversarial verification AFTER build (find mistakes)

They complement each other — the Student consults specialists to build it right, the Examiner still tries to break it.

## Technical Details

The entire system is powered by one Python script: `execution/specialist_registry.py`

- **Trigger matching:** Each domain has keyword triggers. The script counts matches and recommends the best-fitting specialist.
- **File pattern matching:** Each domain has glob patterns for file paths. Editing `src/auth/middleware.ts` automatically triggers the Security specialist.
- **Tech stack detection:** Reads `project_brief.md` Section 6 and maps technologies (e.g. "prisma" → Database, "tailwind" → Styling & Design).
- **Deterministic:** No AI involved in matching — it's pure keyword/pattern matching for reliability.
