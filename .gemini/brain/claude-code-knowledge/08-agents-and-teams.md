# Agents and Teams

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-31

> *Agents sind eigenständige Mitarbeiter, die du Claude Code gibst. Ein einzelner Claude Code ist ein Generalist. Aber mit Agents und Teams kann er Spezialisten beauftragen: „Du machst das Code Review, du schreibst die Tests, du aktualisierst die Docs." Jeder Agent hat sein eigenes Gedächtnis und seine eigenen Werkzeuge.*

## Custom Agents
Location: `.claude/agents/<name>.md` (project) or `~/.claude/agents/<name>.md` (user)

### Agent File Format
```markdown
---
name: code-reviewer
description: Reviews code for quality and security
tools: [Read, Grep, Glob]
model: haiku
---
# Instructions
Review the code for:
1. Logic errors and bugs
2. Security vulnerabilities
3. Performance issues
Give structured feedback with severity levels.
```

### Frontmatter Options
| Option | Purpose | Example |
|--------|---------|---------|
| `name` | Display name | `code-reviewer` |
| `description` | What the agent does | `Reviews code quality` |
| `tools` | Allowed tools (minimal!) | `[Read, Grep, Glob]` |
| `model` | Model override | `haiku`, `sonnet`, `opus` |

### Invoking Agents
- `@agent-name` — Start or mention an agent or named subagent in your prompt (supports typeahead suggestions)
- `/agents` — Create, list, or manage agents interactively
- Agents run in their own context window (no pollution of your main conversation)

### Agent Scopes
| Scope | Location | Shared? |
|-------|----------|---------|
| **Project** | `.claude/agents/` | Yes (via Git) |
| **User** | `~/.claude/agents/` | No (personal) |

## Built-in Subagents (Task Tool)
Claude Code has built-in subagent types for common patterns:

| Type | Tools Available | Use Case |
|------|---------------|----------|
| **Explore** | Glob, Grep, Read | Fast read-only exploration, finding files |
| **Plan** | Read-only | Architecture planning, analysis |
| **General-purpose** | All tools | Multi-step tasks, complex operations |
| **Other** | Bash only | Command execution, scripts |

**Key Facts:**
- Stateless — each subagent starts fresh
- Single return message — summarizes findings
- Up to ~10 concurrent subagents
- Own context window — doesn't pollute main conversation
- **Thinking Summaries:** Disabled by default in interactive sessions to reduce noise. Set `showThinkingSummaries: true` in settings to restore them.
- **Usage Tracking:** Subagent and fork usage is included in `/stats` and `/usage` reports.

## Agent Teams
Agent Teams let multiple Claude Code instances collaborate on a project simultaneously.

### How It Works
```bash
claude --teammate-mode        # Start in team mode
claude --agents 3             # Start with 3 parallel agents
```

- Agents can delegate work to each other
- Each agent has its own context window and focus area
- Coordination through shared filesystem and git
- Use `TeammateIdle` hook to detect when teammates finish

### When to Use Teams
- Large refactoring across many files
- Parallel feature development
- Code review + implementation simultaneously
- Documentation generation while coding

## Foreground vs Background Agents
| Mode | Behavior | When to Use |
|------|----------|-------------|
| **Foreground** | Interactive, shows output | Active collaboration |
| **Background** | Runs silently | Long tasks, parallel work |

## Persistent Memory for Agents
Agents can remember things across sessions:
- Auto-Memory stores preferences and patterns
- Custom instructions in agent files persist
- Use project-level agents for team-shared memory

## Agent Hooks
| Hook Event | When | Use Case |
|------------|------|----------|
| `TaskCreated` | Task or Cron created | Initialize tracking, log start |
| `SubagentStart` | Agent spawned | Log, validate |
| `SubagentStop` | Agent finished | Process results |
| `TeammateIdle` | Team agent idle | Assign new work |

## 🔗 Verwandte Konzepte
- **Subagents have own Context Windows** → siehe `01-fundamentals.md` § Context Window
- **Skills als leichtere Alternative** → siehe `04-skills-and-agents.md` § Skills
- **Agent Hooks** → siehe `05-advanced-patterns.md` § Hooks
- **Agent Templates** → siehe `templates/agent-templates.md`