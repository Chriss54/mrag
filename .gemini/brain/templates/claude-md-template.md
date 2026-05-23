# CLAUDE.md Template – Generierungsanleitung

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-24

## Wann verwenden?
Wenn der User im Konfigurator-Modus sagt:
- "Richte Claude Code für mein Projekt ein"
- "Erstell mir eine CLAUDE.md"
- "Konfiguriere Claude Code für [Framework/Sprache]"

## Vorgehensweise
1. **Frage den User** nach: Sprache/Framework, Entry Point, Test-Framework, Build-Tools, Besonderheiten
2. **Lies das Projekt** (package.json, tsconfig.json, pyproject.toml, Cargo.toml etc.) falls vorhanden
3. **Generiere eine projektspezifische CLAUDE.md** basierend auf dem Template unten
4. **Schreibe die Datei** ins Projekt-Root als `CLAUDE.md`
5. **Erstelle `.claude/rules/`** mit projektspezifischen Rules (siehe rule-templates.md)

## Template

```markdown
# Project Configuration for Claude Code

## Architecture
- This project uses [SPRACHE/FRAMEWORK aus Analyse]
- Entry point: [ENTRY POINT aus Analyse]
- Tests: [TEST-PFAD aus Analyse]
- [Weitere projektspezifische Architektur-Infos]

## Commands
- `[DEV-BEFEHL]` — Start development server
- `[TEST-BEFEHL]` — Run tests
- `[BUILD-BEFEHL]` — Production build
- `[LINT-BEFEHL]` — Run linter
[Weitere projektspezifische Commands]

## Coding Standards
[Aus dem Projekt ableiten oder den User fragen:]
- [Sprach-/Framework-spezifische Standards]
- Write descriptive variable names
- Add documentation comments for public functions
- Keep functions under 50 lines where possible
- [Weitere Standards aus bestehender Codebase]

## Testing Standards
- Tests location: [AUS PROJEKT ABLEITEN]
- Test framework: [AUS PROJEKT ABLEITEN]
- Use descriptive test names: `it('should [behavior] when [condition]')`
- Cover happy path, edge cases, and error states
- Mock external dependencies, never real APIs

## Git Conventions
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- Keep commits focused on a single concern
- Commit messages explain WHY, not just WHAT

## Error Handling
- [Framework-spezifische Error-Handling-Patterns]
- Use structured logging with context
- [API-Response-Format falls zutreffend]

## Context Management
- Your context window will be automatically compacted. Do not stop tasks early due to token budget concerns.
- For long tasks, persist progress in TODO comments or a scratchpad file.
- Avoid over-engineering. Keep solutions minimal and focused.

@.claude/rules/testing.md
@.claude/rules/api-conventions.md
[Weitere @imports nach Bedarf]
```

## Framework-spezifische Ergänzungen

### Next.js / React
```markdown
## Project Structure
- Pages/App Router: [src/app/ oder src/pages/]
- Components: [src/components/]
- API Routes: [src/app/api/ oder src/pages/api/]
- Use Server Components by default, Client Components only when needed
- Prefer Server Actions over API routes for mutations
```

### Python / FastAPI / Django
```markdown
## Project Structure
- Virtual environment: [.venv/ oder poetry]
- Use type hints everywhere
- Format with black/ruff, lint with ruff
- `pip install -e .` for development
```

### Go
```markdown
## Project Structure
- Follow standard Go project layout
- Use `go test ./...` for all tests
- Handle all errors explicitly (no _ for errors)
- Use interfaces for dependency injection
```

### Rust
```markdown
## Project Structure
- `cargo build` / `cargo test` / `cargo clippy`
- Use Result<T, E> for error handling
- Prefer owned types in public APIs
- Document all public items
```

## Regeln nach Generierung
1. Datei MUSS unter 200 Zeilen bleiben
2. `@imports` für alles was nicht Kern-Config ist
3. Zeige dem User die generierte CLAUDE.md und frage nach OK
4. Biete an, passende Rules und Commands gleich mit zu erstellen
