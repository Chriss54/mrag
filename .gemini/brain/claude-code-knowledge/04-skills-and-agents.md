# Skills, Commands, and Agents

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-31

> *Skills und Agents sind Spezialisierungen. Ein Skill ist wie ein Rezept: „Wenn jemand ‚Feature planen' sagt, mache GENAU diese Schritte." Ein Agent ist ein eigenständiger Mitarbeiter mit eigenen Fähigkeiten und eigenem Gedächtnis. Der Clou: Skills und Agents laufen in einem eigenen Context Window — sie verschmutzen nicht dein Hauptgespräch. Das ist wie ein Kollege, der im Nebenraum arbeitet und dir nur das Ergebnis zurückbringt.*

## Custom Slash Commands
Location: `.claude/commands/<name>.md` → `/project:<name>`
User-level: `~/.claude/commands/<name>.md` → `/user:<name>`

### Frontmatter Options
| Option | Purpose |
|--------|---------|
| `description` | Shown in /help |
| `allowed-tools` | Tool restriction |
| `argument-hint` | Expected argument |
| `model` | Override: haiku/sonnet/opus |
| `context: fork` | Isolated sub-agent execution |

### Variables
- `$ARGUMENTS` – Everything after command name
- `$1`, `$2` – Positional parameters
- `` !` `` – Execute shell, inject output

## Skills
Location: `.claude/skills/<name>/SKILL.md`

Key frontmatter:
- `context: fork` – RECOMMENDED: prevents context pollution
- `allowed-tools` – Minimum tools needed
- `argument-hint` – What user should describe

### Automation Skill Patterns
Skills can be configured to handle complex automation workflows using computer-use capabilities.

| Pattern | Primary Use Case | Key Tools |
|---------|------------------|-----------|
| **Social Outreach** | Automating LinkedIn/social connection requests | Browser, Task |
| **Data Scraping** | Extracting leads or structured data from platforms | Browser, Grep, Shell |
| **Form Submission** | Automating repetitive data entry and submissions | Browser, Task |
| **Ad Management** | Monitoring and adjusting ad spend/campaigns | Browser, Shell |
| **Finance/Invoicing** | Managing invoices and billing processes | Read, Shell, Task |
| **QA Testing** | Automated testing of desktop and web app features | Computer, Task |

## Sub-Agents (Task Tool)
| Type | Tools | Use Case |
|------|-------|----------|
| Explore | Glob, Grep, Read | Fast read-only exploration |
| Plan | Read-only | Architecture planning |
| general-purpose | All | Multi-step tasks |
| Bash | Only Bash | Command execution |
| Automation | Computer, Browser | UI-based tasks, scraping, and outreach |

Facts: Stateless, single return message, up to ~10 concurrent, own context window.

## Custom Agents
Location: `.claude/agents/<name>.md`
```markdown
---
name: code-reviewer
description: Reviews code quality
tools: [Read, Grep, Glob]
model: haiku
---
# Instructions here
```
Invoke: `@agent-code-reviewer, review the auth module`

## 🔗 Verwandte Konzepte
- **Agents im Detail** → siehe `08-agents-and-teams.md` § Custom Agents, Agent Teams
- **Skills vs. Commands** → siehe `02-tools-and-commands.md` § Slash Commands
- **Sub-Agents haben eigene Context Windows** → siehe `01-fundamentals.md` § Context Window
- **Agent Templates** → siehe `templates/agent-templates.md`
- **Automation Workflows** → siehe `09-automation-workflows.md`