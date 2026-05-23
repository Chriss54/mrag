# Claude Code Fundamentals

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-24

> *Claude Code ist wie ein brillanter Entwickler mit perfektem Kurzzeitgedächtnis aber begrenztem Arbeitsgedächtnis. Es kann deinen gesamten Code lesen und verstehen — aber es kann nur eine begrenzte Menge gleichzeitig „im Kopf behalten". Das Context Window ist sein Arbeitsgedächtnis: Wird es voll, vergisst Claude Code woran es arbeitet. Deshalb ist Context Management nicht optional — es ist die wichtigste Fähigkeit, die du als Claude-Code-Nutzer lernst.*

## What is Claude Code?
Anthropic's autonomous coding tool. Lives in the terminal, understands entire codebases, autonomously reads files, writes code, executes commands. Works as an agentic loop: Gather Context → Take Action → Verify Results.

## Key Facts
- Built with TypeScript, React+Ink (terminal UI), Bun for builds
- ~90% of its own code was written by itself
- Available as Terminal CLI, VS Code/JetBrains Extension, Desktop App, and in Antigravity
- Uses Autocompact when approaching context window limits
- Optimized for Prefix Caching: Wiederkehrende Teile (System-Prompt, CLAUDE.md) werden gecached und kosten beim erneuten Senden ~90% weniger. Lange Sessions werden dadurch überraschend günstig.

## Context Window
- Default: 200K Tokens. Opus 4.6 and Sonnet 4.6: 1M Tokens
- System prompts + tool schemas use a significant portion of the context window. Use `/context` to see actual usage.
- Auto-compaction triggers when approaching context window limits. Use `/context` to monitor utilization.
- `/compact [focus]` to manually compress. `/clear` to reset completely
- `/context` to visualize usage

## How It Differs from IDE Plugins
| Aspect | IDE Plugin (Copilot, Cursor) | Claude Code |
|--------|------------------------------|-------------|
| Interaction | Synchronous (autocomplete) | Asynchronous (task delegation) |
| Scope | Single file | Entire codebase + terminal |
| Autonomy | Suggests completions | Plans, executes, verifies |
| Tool Access | Editor only | Filesystem, Git, shell, web |

## Auto-Memory
Claude Code can automatically remember your preferences and patterns:
- Enable/disable in settings
- Stored in `~/.claude/` (user-level)
- Works alongside CLAUDE.md — `/memory` shows both
- Learns coding style, preferred tools, project conventions

## 🔗 Verwandte Konzepte
- **Context komprimieren** → siehe `02-tools-and-commands.md` § Slash Commands (compact/clear)
- **Sub-Agents haben eigene Context Windows** → siehe `04-skills-and-agents.md` § Sub-Agents
- **Auto-Memory** → siehe `03-configuration.md` § Auto-Memory
