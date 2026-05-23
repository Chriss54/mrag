# Advanced Patterns

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-31

> *Hier wird Claude Code vom Werkzeug zum Partner. Extended Thinking lässt es nachdenken statt sofort zu antworten — wie der Unterschied zwischen „schnell was hinschreiben" und „erstmal in Ruhe nachdenken". Hooks automatisieren Reflexe: formatieren nach dem Schreiben, testen vor dem Speichern. Und mit Plan Mode analysiert Claude Code erst die Lage, bevor es eine einzige Zeile Code ändert. Die Regel: Je komplexer die Aufgabe, desto mehr denkst du VOR dem Coden.*

## Extended Thinking (ONLY in Claude Code CLI)
| Keyword | ~Tokens | Use Case |
|---------|---------|----------|
| "think" | ~4K | Routine debugging |
| "think hard" / "megathink" | ~10K | API design, planning |
| "think harder" / "ultrathink" | ~32K | System architecture |

Persistent: `/effort low` / `medium` / `high` / `max` / `auto`

> **Note:** Thinking summaries are now disabled by default in interactive sessions to reduce noise. To restore them, set `showThinkingSummaries: true` in your settings.

> `max` uses maximum available thinking tokens. Use sparingly — it's the most expensive option but best for extremely complex problems.

## Plan Mode
Read-only analysis before code changes. Use for: multi-file changes, architectural decisions, multiple valid approaches. Don't use for: single-file fixes, simple renames.

Workflow: `/plan` → describe → review → switch to normal → implement

## Hooks
Hooks automate actions at specific points in Claude Code's workflow. They run shell commands, scripts, or trigger agents.

### Hook Events (Complete List)
| Event | When | Blockable? |
|-------|------|-----------|
| **PreToolUse** | Before tool execution | Yes (exit 2) |
| **PostToolUse** | After tool execution | No |
| **PostToolUseFailure** | After tool fails | No |
| **SessionStart** | Session begins | No |
| **SessionEnd** | Session ends | No |
| **Stop** | Response complete | Yes (exit 2) |
| **StopFailure** | Stop was blocked | No |
| **InstructionsLoaded** | CLAUDE.md/rules loaded | No |
| **UserPromptSubmit** | User sends message | Yes (exit 2) |
| **PermissionRequest** | Permission asked | No |
| **PermissionDenied** | After auto-mode denial | Yes (return retry) |
| **Notification** | Notification triggered | No |
| **SubagentStart** | Subagent spawned | No |
| **SubagentStop** | Subagent finished | No |
| **TeammateIdle** | Team agent idle | No |
| **TaskCreated** | Background task starts | No |
| **TaskCompleted** | Background task done | No |
| **ConfigChange** | Config modified | No |
| **WorktreeCreate** | Worktree created | No |
| **WorktreeRemove** | Worktree removed | No |
| **PreCompact** | Before compaction | No |
| **PostCompact** | After compaction | No |
| **Elicitation** | MCP elicitation | No |
| **ElicitationResult** | Elicitation response | No |

### Hook Configuration & Filtering
Hooks now support a conditional `if` field using permission rule syntax (e.g., `Bash(git *)`) to filter execution and reduce overhead.

**Example: Conditional Hook**
```json
{
  "hooks": {
    "PreToolUse": [{
      "if": "Bash(git push*)",
      "hooks": [{"type": "command", "command": "npm test"}]
    }]
  }
}
```

### Advanced Hook Capabilities
- **Headless Interaction:** `PreToolUse` hooks can now satisfy `AskUserQuestion` tools by returning an `updatedInput` alongside `permissionDecision: "allow"`. This allows external UIs to provide answers programmatically.
- **Auto-Mode Retries:** The `PermissionDenied` hook fires when the auto-mode classifier blocks a command. Returning `{retry: true}` signals the model that it may attempt the action again (e.g., after a hook fixes a permission issue).

### Example: Auto-Format on Write
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [{"type": "command", "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\""}]
    }]
  }
}
```

## Git Worktrees
Parallel feature branches with full isolation:
```bash
claude --worktree          # New worktree for current task
```
- Each worktree gets its own directory copy
- Safe parallel development on multiple features
- Use `EnterWorktree`/`ExitWorktree` tools programmatically
- Hooks: `WorktreeCreate`, `WorktreeRemove`

## Scheduled Tasks
Schedule recurring or one-time tasks:
```bash
/schedule                  # Manage scheduled tasks
```
Tools: `CronCreate`, `CronList`, `CronDelete`
- Automate recurring maintenance (dependency updates, code reviews)
- Background execution with result notifications
- View with `/tasks`
- Hooks: `TaskCreated`, `TaskCompleted`

## Checkpointing & Rewind
Claude Code creates checkpoints automatically during work:
- `Escape` — Cancel current generation
- `Escape (2×)` — Rewind menu: jump back to any checkpoint
- Undo destructive changes by rewinding to a safe state
- Checkpoints persist within a session

## CI/CD Integration
```bash
claude -p "Analyze PR" --output-format json --allowedTools Read,Grep,Glob --max-turns 5
git diff HEAD~1 | claude -p "Review this diff"
claude --from-pr 42 -p "Review and suggest improvements"
```

## Performance & UI Optimization
- **Flicker-free Rendering:** Use `CLAUDE_CODE_NO_FLICKER=1` for virtualized scrollback in compatible terminals.
- **Cost Optimization:** Sonnet for 90% of work; `/compact` after subtasks; `/effort low` for simple tasks.
- **Session Management:** `/fork` to branch conversations; `/resume` to pick up previous work.
- **Prompt Caching:** Claude Code now optimizes tool schema bytes and file injections to maximize cache hits in long sessions.

## 🔗 Verwandte Konzepte
- **Hook-Events für Agents** → siehe `08-agents-and-teams.md` § Agent Hooks
- **Plan Mode & Feature-Workflow** → siehe `GEMINI.md` § Coaching-Szenarien: Neues Feature
- **CLI-Flags für CI/CD** → siehe `02-tools-and-commands.md` § CLI Flags
- **Worktrees & Branching** → siehe `02-tools-and-commands.md` § Slash Commands