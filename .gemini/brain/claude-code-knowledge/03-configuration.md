# Configuration

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-31

> *Configuration ist das Langzeitgedächtnis von Claude Code. Während das Context Window nach jeder Session verschwindet, bleiben CLAUDE.md und `.claude/` bestehen. Hier definierst du, WER Claude Code in deinem Projekt ist: Welche Standards gelten, welche Werkzeuge es nutzen darf, welche Regeln es befolgt. Ein gut konfiguriertes Claude Code ist wie ein Entwickler, der schon drei Monate im Team arbeitet.*

## CLAUDE.md Hierarchy
| File | Loaded | Purpose |
|------|--------|---------|
| `~/.claude/CLAUDE.md` | Always | Personal prefs, all projects |
| `<project>/CLAUDE.md` | Always | Team standards (Git commit!) |
| `<project>/CLAUDE.local.md` | Always | Personal overrides (gitignored) |
| `<subdir>/CLAUDE.md` | On-demand | Directory-specific rules |

Import syntax: `@docs/standards.md` (recursive up to 5 levels)

**CLAUDE.local.md:** Personal, gitignored overrides. Use for your own preferences that shouldn't be shared with the team (e.g. preferred model, personal shortcuts).

## .claude/ Directory
```
.claude/
├── settings.json          # Project settings (committed)
├── settings.local.json    # Personal overrides (gitignored)
├── managed-settings.json  # Org-level policies (read-only)
├── commands/              # Slash commands → /project:<name>
├── agents/                # Custom agents
├── skills/                # Skills with SKILL.md
└── rules/                 # Path-scoped rules with YAML frontmatter
```

## Project Settings (settings.json)
| Key | Type | Description |
|-----|------|-------------|
| `showThinkingSummaries` | boolean | Set to `true` to restore thinking summaries in interactive sessions (default: false). |
| `permissions` | object | Define allow/deny rules for tools and commands. |
| `deniedMcpServers` | string[] | List of MCP servers to block. |

## Path-Specific Rules (.claude/rules/)
Rules and Skills can target specific files using YAML frontmatter. The `paths` field now accepts a YAML list of globs.
```yaml
---
paths:
  - "**/*.test.ts"
  - "tests/**"
---
# Testing rules here (loaded ONLY for matching files)
```

## Permission & Managed Config
```json
{
  "permissions": {
    "allow": ["Read", "Bash(git *)", "Edit"],
    "deny": ["Read(.env*)", "Bash(rm -rf *)", "Bash(sudo *)"]
  }
}
```
Order: deny → ask → allow. Deny always wins.

**Managed Settings (`managed-settings.json`):** Used by organizations to enforce policies. 
- `allowedChannelPlugins`: Restricts which plugins can be installed/enabled based on organization-approved channels.

## Auto-Memory
Claude Code can automatically learn and remember your preferences:
- **Enable/Disable:** In settings or via `/memory`
- **Storage:** `~/.claude/` (user-level, private)
- **What it stores:** Coding style, preferred tools, project conventions, correction patterns
- **How to see it:** `/memory` opens both CLAUDE.md and Auto-Memory settings
- Works alongside CLAUDE.md — Auto-Memory is personal, CLAUDE.md is project-shared

## MCP Server Integration
```bash
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add github -e GITHUB_TOKEN=ghp_xxx -- npx -y @modelcontextprotocol/server-github
```
Scopes: Local (default, private), Project (`.mcp.json`, shared via Git), User (global, private).

**Environment Variables for MCP Helpers:**
- `CLAUDE_CODE_MCP_SERVER_NAME`: Name of the current server.
- `CLAUDE_CODE_MCP_SERVER_URL`: URL of the current server.

## Key Environment Variables
```bash
ANTHROPIC_API_KEY="sk-ant-..."       # Direct API key
ANTHROPIC_MODEL="claude-sonnet-4-6"  # Model override
CLAUDE_CODE_MAX_OUTPUT_TOKENS=32000  # Max output
BASH_DEFAULT_TIMEOUT_MS=120000       # Bash timeout (default: 120s)
CLAUDE_CODE_SIMPLE=1                 # Minimal mode
CLAUDE_CODE_NO_FLICKER=1             # Opt into flicker-free alt-screen rendering
CLAUDE_STREAM_IDLE_TIMEOUT_MS=60000  # Timeout for idle streams
ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTS="..." # Define capabilities for custom model endpoints
```

## 🔗 Verwandte Konzepte
- **MCP-Server im Detail** → siehe `07-mcp-servers.md`
- **Permissions bei Hooks** → siehe `05-advanced-patterns.md` § Hooks (inkl. `PermissionDenied` hook)
- **Rules und Path-Patterns** → siehe `04-skills-and-agents.md`
- **Auto-Memory** → siehe `01-fundamentals.md` § Auto-Memory