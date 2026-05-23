# MCP Servers

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-31

> *MCP-Server sind Sinne für Claude Code. Ohne sie kann es nur lesen, schreiben und im Terminal arbeiten. Mit einem MCP-Server für Notion kann es plötzlich deine Notizen lesen. Mit einem für GitHub kann es PRs erstellen. MCP-Server erweitern, was Claude Code wahrnehmen und tun kann.*

## What is MCP?
MCP (Model Context Protocol) is a standard for AI tool integration. It lets Claude Code connect to external services — databases, APIs, SaaS tools — through a unified protocol. Think of each MCP server as a "plugin" that gives Claude Code new abilities.

## Transport Types
| Type | Use Case | Example |
|------|----------|---------|
| **stdio** | Local processes | `npx -y @modelcontextprotocol/server-github` |
| **HTTP** | Remote servers | `https://mcp.notion.com/mcp` |
| **SSE** | Legacy remote (being replaced by HTTP) | Older self-hosted servers |

## Scopes
| Scope | Config Location | Shared? | When to Use |
|-------|----------------|---------|-------------|
| **Local** | Per-machine (default) | No | Personal API keys, private tools |
| **Project** | `.mcp.json` in project root | Yes (Git) | Team-shared servers (GitHub, Jira) |
| **User** | `~/.claude/` | No | Global personal servers |

## CLI Commands
```bash
# Add servers
claude mcp add <name> -- <command> [args...]                    # stdio (default)
claude mcp add --transport http <name> <url>                    # HTTP remote
claude mcp add <name> -e KEY=value -- <command> [args...]       # With env vars
claude mcp add --scope project <name> -- <command> [args...]	# Project scope

# Manage servers
claude mcp list                    # Show all configured servers
claude mcp get <name>              # Show server details
claude mcp remove <name>           # Remove a server
claude mcp reset                   # Remove all MCP servers
```

## .mcp.json Format (Project Scope)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "notion": {
      "type": "http",
      "url": "https://mcp.notion.com/mcp",
      "headersHelper": "./scripts/auth-helper.sh"
    }
  }
}
```

**Env-Var-Expansion:** Use `${VAR}` or `${VAR:-default}` in `.mcp.json`. Never hardcode secrets.

**Headers Helper:** Skripte in `headersHelper` werden zur dynamischen Generierung von Auth-Headern genutzt. Sie erhalten automatisch Zugriff auf `CLAUDE_CODE_MCP_SERVER_NAME` und `CLAUDE_CODE_MCP_SERVER_URL`, um einen Helper für mehrere Server verwenden zu können.

## Popular MCP Servers
| Server | Install | What It Does |
|--------|---------|-------------|
| **GitHub** | `claude mcp add github -e GITHUB_TOKEN=ghp_xxx -- npx -y @modelcontextprotocol/server-github` | PRs, issues, repos |
| **Notion** | `claude mcp add --transport http notion https://mcp.notion.com/mcp` | Read/write Notion pages |
| **Slack** | `claude mcp add slack -e SLACK_TOKEN=xoxb-xxx -- npx -y @anthropic/mcp-server-slack` | Send messages, read channels |
| **Filesystem** | `claude mcp add fs -- npx -y @modelcontextprotocol/server-filesystem /path` | Access to specific directories |
| **Postgres** | `claude mcp add pg -e DATABASE_URL=postgres://... -- npx -y @modelcontextprotocol/server-postgres` | Query databases |

## MCP Features
- **MCP Tool Search:** Claude Code kann Tools über alle verbundenen Server hinweg entdecken.
- **MCP Prompts as Commands:** Vom Server definierte Prompts erscheinen als Slash-Commands.
- **MCP Resources:** Read-only Datenquellen (nutze `ListMcpResourcesTool`, `ReadMcpResourceTool`).
- **MCP Elicitation:** Server können Claude Code nach zusätzlichen Informationen fragen.
- **Managed Configuration:** Import von Servern aus Claude Desktop via `claude mcp add-from-desktop`.
- **OAuth for Remote Servers:** HTTP-Server können OAuth nutzen. Claude Code folgt dabei RFC 9728 zur automatischen Discovery von Authorization-Servern.

## Debugging
```bash
claude --mcp-debug          # Start with MCP debug logging
```

**Common Issues:**
- Server won't connect → Check env vars, verify command path.
- "Tool not found" → Run `/mcp` to check server status.
- Permission denied → Verify API tokens. Check `deniedMcpServers` in settings.
- Timeout → Increase timeout or check network for remote servers.
- Tool Details → Set `OTEL_LOG_TOOL_DETAILS=1` to see full tool parameters in OpenTelemetry logs.

## Security Best Practices
- Store secrets in environment variables, never in `.mcp.json` directly.
- Use `${VAR}` expansion for all sensitive values.
- Review server permissions before granting access.
- **Organization Policies:** Administratoren können MCP-Server über `managed-settings.json` einschränken oder blockieren.
- Use project scope (`.mcp.json`) for team servers, local scope for personal keys.
- OAuth for remote servers (more secure than static tokens).

## 🔗 Verwandte Konzepte
- **MCP Config in `.mcp.json`** → siehe `03-configuration.md` § MCP Server Integration
- **MCP Debugging** → siehe `06-troubleshooting.md` § MCP connection failures
- **MCP Resources as Tools** → siehe `02-tools-and-commands.md` § Built-in Tools