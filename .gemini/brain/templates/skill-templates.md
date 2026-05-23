# Skill Templates

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-24

## Wann verwenden?
Wenn der User im Konfigurator-Modus sagt:
- "Erstell mir einen Skill für..."
- "Ich brauche einen Skill der..."
- "Richte mir die Standard-Skills ein"

## Zielordner
`.claude/skills/<skill-name>/SKILL.md`

## Vorgehensweise
1. Erstelle `.claude/skills/<name>/` Ordner
2. Schreibe die `SKILL.md` Datei
3. Bestätige: "Skill `<name>` ist jetzt verfügbar"

---

## Standard-Skills (bei "richte alles ein")

### explore-codebase/SKILL.md
```markdown
---
context: fork
allowed-tools: Read, Grep, Glob, LS, Bash
argument-hint: <what to explore or understand>
---

# Codebase Explorer

## Goal
Build comprehensive understanding of the codebase or a specific area.

## Instructions
1. LS and Glob to map project structure
2. Read config files (package.json, tsconfig, etc.)
3. Grep for entry points, exports, key patterns
4. Read to follow import chains and data flows

## Output
- **Project Type**: What kind of project
- **Tech Stack**: Languages, frameworks, dependencies
- **Architecture**: Code organization
- **Entry Points**: Where execution starts
- **Key Patterns**: Design patterns used
- **Data Flow**: How data moves
```

### plan-feature/SKILL.md
```markdown
---
context: fork
allowed-tools: Read, Grep, Glob, LS
argument-hint: <feature description>
---

# Feature Planner

## Goal
Create detailed implementation plan before writing code.

## Instructions
1. Understand requirements
2. Explore relevant codebase areas
3. Identify files to create/modify
4. Consider edge cases, errors, tests
5. Identify risks and breaking changes

## Output
- **Summary**: One-paragraph description
- **Files to Modify**: With expected changes
- **New Files**: With purpose
- **Dependencies**: New packages needed
- **Testing Plan**: What tests to write
- **Risks**: Issues and mitigations
- **Complexity**: Low/Medium/High with reasoning
```

### fix-bug/SKILL.md
```markdown
---
context: fork
allowed-tools: Read, Grep, Glob, Bash
argument-hint: <error message or bug description>
---

# Bug Investigator

## Goal
Investigate and diagnose a bug WITHOUT modifying code.

## Instructions
1. Parse error for clues
2. Grep to locate relevant code
3. Read files, trace execution path
4. Check common causes: null handling, async, types, boundaries
5. Form hypotheses ranked by likelihood

## Output
- **Root Cause**: What and why
- **Evidence**: Code locations and lines
- **Fix Recommendation**: Minimal change needed
- **Test Strategy**: How to verify
- **Prevention**: How to avoid similar bugs
```

---

## Skill-Baukasten (für individuelle Skills)

### Grundstruktur
```markdown
---
context: fork
allowed-tools: [Minimale Tool-Liste]
argument-hint: <Beschreibung des erwarteten Inputs>
---

# [Skill-Name]

## Goal
[1-2 Sätze: Was soll erreicht werden?]

## Instructions
1. [Schritt 1]
2. [Schritt 2]
...

## Output
[Strukturvorgabe für die Ausgabe]
```

### Wichtige Regeln
- `context: fork` ist EMPFOHLEN – verhindert Context-Pollution im Hauptfenster
- `allowed-tools` so minimal wie möglich halten
- Skills sind read-only explorativ? → Kein Write/Edit/Bash in allowed-tools
- Skills die Code ändern? → `context: fork` PFLICHT, damit Hauptkontext sauber bleibt

### Beispiel: Custom Skill für Datenbankmigrationen
```markdown
---
context: fork
allowed-tools: Read, Grep, Glob, LS
argument-hint: <migration description, e.g. "add email column to users table">
---

# Database Migration Planner

## Goal
Plan a safe database migration with rollback strategy.

## Instructions
1. Read existing migration files to understand patterns
2. Read the current schema/models
3. Identify affected tables and relationships
4. Check for data that could be affected

## Output
- **Migration Name**: Following project conventions
- **Up Migration**: SQL/code for the change
- **Down Migration**: Rollback SQL/code
- **Data Impact**: Rows/tables affected
- **Risks**: Data loss, downtime, locks
- **Testing**: How to verify pre- and post-migration
```

### Beispiel: Custom Skill für API-Dokumentation
```markdown
---
context: fork
allowed-tools: Read, Grep, Glob
argument-hint: <API endpoint or module to document>
---

# API Documenter

## Goal
Generate comprehensive API documentation from source code.

## Instructions
1. Find all route definitions with Grep
2. Read each route handler
3. Identify request/response schemas
4. Find middleware and auth requirements
5. Check for existing documentation

## Output
For each endpoint:
- **Method + Path**: e.g. `POST /api/users`
- **Auth**: Required role/scope
- **Request**: Body schema, query params, path params
- **Response**: Success and error schemas
- **Examples**: Request/response pairs
```
