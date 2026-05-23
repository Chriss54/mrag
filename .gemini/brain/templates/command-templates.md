# Slash Command Templates

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-24

## Wann verwenden?
Wenn der User im Konfigurator-Modus sagt:
- "Erstell mir einen Command für..."
- "Ich brauche einen Slash Command für..."
- "Richte mir die Standard-Commands ein"

## Zielordner
`.claude/commands/<name>.md` → wird zu `/project:<name>`

## Vorgehensweise
1. Erstelle den `.claude/commands/` Ordner falls nicht vorhanden
2. Schreibe die Command-Datei(en)
3. Bestätige: "Command `/project:<name>` ist jetzt verfügbar"

---

## Standard-Commands (bei "richte alles ein")

### review.md – Code Review
```markdown
---
description: Code review of current changes
allowed-tools: Bash(git diff:*), Read, Grep, Glob
---

<changes>
!`git diff`
</changes>

Review this code for:
1. **Bugs** – Logic errors, null/undefined, off-by-one
2. **Security** – Injection, auth issues, data exposure
3. **Performance** – N+1 queries, memory leaks, unnecessary work
4. **Best Practices** – Naming, DRY, structure

Be precise. Report only real problems with file, line, issue, why it matters, and suggested fix.
```

### test.md – Test-Generierung
```markdown
---
description: Generate tests for specified file or recent changes
allowed-tools: Read, Write, Bash(npm test:*), Bash(npx jest:*), Grep, Glob
argument-hint: <file path or description>
---

Generate comprehensive tests for $ARGUMENTS.

1. Read the source file and understand its public API
2. Check for existing tests nearby
3. Write tests: happy path, edge cases, error states
4. Run the tests to verify they pass
5. Report coverage summary

Follow the project's existing test patterns.
```

### refactor.md – Refactoring
```markdown
---
description: Refactor code with safety checks
allowed-tools: Read, Edit, MultiEdit, Write, Bash, Grep, Glob
argument-hint: <file or area to refactor>
context: fork
---

Think hard about refactoring $ARGUMENTS.

1. **Analyze**: Read and understand current structure
2. **Plan**: Identify improvements (extract functions, reduce duplication, naming)
3. **Check**: Find all callers with Grep
4. **Refactor**: Change incrementally
5. **Verify**: Run tests after each change
6. **Report**: Summarize what changed and why

Preserve existing behavior. No feature changes.
```

### debug.md – Debugging
```markdown
---
description: Systematic debugging workflow
allowed-tools: Read, Grep, Glob, Bash
argument-hint: <error message or description>
---

Think harder about debugging: $ARGUMENTS

1. **Reproduce**: Understand the error
2. **Locate**: Grep for relevant code
3. **Trace**: Read files, trace execution
4. **Hypothesize**: 2-3 theories ranked by likelihood
5. **Verify**: Test each hypothesis
6. **Fix**: Implement minimal targeted fix
7. **Validate**: Run tests
8. **Prevent**: Suggest prevention
```

### commit.md – Git Commit
```markdown
---
description: Git commit with conventional message
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git diff:*), Bash(git status:*)
argument-hint: [optional commit message]
---

<status>
!`git status`
</status>

<diff>
!`git diff --cached`
</diff>

If nothing staged, stage all modified files first.

Conventional Commits: feat: / fix: / refactor: / test: / docs: / chore:
If $ARGUMENTS provided, use as message. Otherwise generate from diff.
Body explains WHY, not just WHAT.
```

---

## Command-Baukasten (für individuelle Commands)

### Frontmatter-Referenz
```yaml
---
description: [Kurze Beschreibung – erscheint bei /help]
allowed-tools: [Tool-Liste – z.B. Read, Grep, Glob, Bash(git *)]
argument-hint: [Was als Argument erwartet wird]
model: [Optional: haiku, sonnet, opus]
context: [Optional: fork – für isolierte Ausführung]
---
```

### Verfügbare Variablen
- `$ARGUMENTS` – Alles nach dem Command-Namen
- `$1`, `$2` – Positionsparameter
- `` !`shell-befehl` `` – Shell-Output in den Prompt injizieren

### Beispiel: Custom Command mit Shell-Injection
```markdown
---
description: Analyze git history for a file
allowed-tools: Bash(git log:*), Read, Grep
argument-hint: <file path>
---

<history>
!`git log --oneline -20 -- $1`
</history>

<current>
!`cat $1`
</current>

Analyze the git history of this file. Identify:
1. Major changes and their purpose
2. Patterns in how it evolved
3. Potential issues or tech debt
```

### Tipps für gute Commands
- `context: fork` bei read-only oder explorativen Commands
- `allowed-tools` so restriktiv wie möglich
- `model: haiku` für einfache, schnelle Tasks
- Shell-Injection für dynamischen Kontext
