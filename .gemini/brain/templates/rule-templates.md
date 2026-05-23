# Rule Templates

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-24

## Wann verwenden?
Wenn der User im Konfigurator-Modus sagt:
- "Erstell mir Rules für..."
- "Claude Code soll bei Tests/API/etc. bestimmte Regeln beachten"
- "Richte mir die Standard-Rules ein"

## Zielordner
`.claude/rules/<name>.md`

## Vorgehensweise
1. Erstelle `.claude/rules/` Ordner falls nicht vorhanden
2. Schreibe die Rule-Datei mit YAML-Frontmatter für `paths:`
3. Bestätige: "Rule `<name>` wird aktiv wenn Claude Code an passenden Dateien arbeitet"

## Wichtig
Rules werden NUR geladen, wenn Claude Code an Dateien arbeitet, die zu den `paths:`-Globs passen. Das spart Context-Window-Tokens.

---

## Standard-Rules (bei "richte alles ein")

### testing.md
```markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "**/*.spec.tsx"
  - "**/__tests__/**"
---

# Testing Conventions
- describe/it pattern with descriptive names
- Name: `it('should [behavior] when [condition]')`
- Test behavior, not implementation
- Independent and idempotent tests
- Mock external dependencies
- Cover: happy path, edge cases, error states
- Specific assertions over generic ones
```

### api-conventions.md
```markdown
---
paths:
  - "src/api/**/*"
  - "src/routes/**/*"
  - "api/**/*"
  - "server/**/*"
---

# API Conventions
- Response envelope: `{ data, error, meta }`
- Appropriate HTTP status codes
- Catch errors at route level with typed error classes
- Log with context (request ID, user, operation)
- Never expose internals in errors
- Validate all inputs at API boundary
- Schema validation (Zod/Joi)
- Authenticate before data access
- Rate limit sensitive endpoints
```

---

## Weitere Rule-Vorlagen

### react-components.md (für React-Projekte)
```markdown
---
paths:
  - "src/components/**/*"
  - "src/app/**/*.tsx"
  - "src/pages/**/*.tsx"
---

# React Component Conventions
- Functional components with hooks (no class components)
- Props interface defined above component
- Use named exports (not default)
- Co-locate styles, tests, and stories
- Extract reusable hooks into src/hooks/
- Memoize expensive computations with useMemo
- Use useCallback for event handlers passed as props
```

### database.md (für Projekte mit DB-Zugriff)
```markdown
---
paths:
  - "src/db/**/*"
  - "src/models/**/*"
  - "prisma/**/*"
  - "drizzle/**/*"
  - "migrations/**/*"
---

# Database Conventions
- All queries through ORM/query builder (no raw SQL in application code)
- Migrations must be reversible
- Index foreign keys and frequently queried columns
- Use transactions for multi-table operations
- Never expose database IDs directly in API responses
- Validate data before database operations
```

### security.md (für sicherheitskritische Projekte)
```markdown
---
paths:
  - "src/auth/**/*"
  - "src/middleware/**/*"
  - "src/security/**/*"
---

# Security Conventions
- Never log sensitive data (passwords, tokens, PII)
- Use parameterized queries (prevent SQL injection)
- Validate and sanitize all user input
- Use constant-time comparison for secrets
- Set secure headers (CORS, CSP, HSTS)
- Rate limit authentication endpoints
- Rotate secrets regularly
```

### python-rules.md (für Python-Projekte)
```markdown
---
paths:
  - "**/*.py"
---

# Python Conventions
- Type hints on all function signatures
- Docstrings for all public functions (Google style)
- Use dataclasses or Pydantic models for structured data
- async/await for I/O-bound operations
- Context managers for resource management
- f-strings for string formatting
- Use pathlib instead of os.path
```

---

## Rule-Baukasten

### Grundstruktur
```markdown
---
paths:
  - "glob/pattern/**/*"
  - "**/*.extension"
---

# [Regel-Titel]
[Regeln als Aufzählung – kurz und präzise]
```

### Path-Glob-Referenz
| Glob | Matches |
|------|---------|
| `**/*.ts` | Alle TypeScript-Dateien |
| `src/api/**/*` | Alles unter src/api/ |
| `**/__tests__/**` | Alle __tests__-Ordner |
| `*.config.*` | Config-Dateien im Root |
| `!**/*.generated.*` | NICHT generierte Dateien |

### Tipps
- Rules kurz halten (unter 30 Zeilen)
- Nur Regeln die sich von den CLAUDE.md-Standards UNTERSCHEIDEN
- Pfade so spezifisch wie möglich → spart Context-Tokens
- Pro Concern eine eigene Rule-Datei
