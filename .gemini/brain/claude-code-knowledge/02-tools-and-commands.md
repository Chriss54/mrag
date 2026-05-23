# Tools and Commands

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-31

> *Tools sind die Hände von Claude Code — sie lassen es Dateien lesen, Code schreiben, Befehle ausführen. Slash Commands sind Abkürzungen, die du ihm beibringst: Statt jedes Mal „mach ein Code Review" zu erklären, sagst du einmal `/project:review`. Der Unterschied: Tools sind eingebaut, Commands erstellst DU. Und genau das macht Claude Code mächtig — du formst es nach deinen Bedürfnissen.*

## Built-in Tools
| Tool | Purpose | Permission? |
|------|---------|------------|
| Read | Read files (text, images, PDFs) | No |
| Write | Create/overwrite files | Yes |
| Edit | String replacement in files | Yes |
| MultiEdit | Multiple atomic edits in one file | Yes |
| Bash | Shell commands (default: 120s timeout, configurable via `BASH_DEFAULT_TIMEOUT_MS`) | Yes |
| PowerShell | Shell commands for Windows (supports 5.1 and 7+) | Yes |
| Glob | File pattern matching (`**/*.ts`) | No |
| Grep | Content search via ripgrep | No |
| LS | List directories (shows "Listed N directories" in summary) | No |
| WebFetch | Fetch URL contents | Yes |
| WebSearch | Web search | Yes |
| Task | Spawn sub-agent | No |
| TodoRead/TodoWrite | Task list management | No |
| Agent | Invoke custom agent | No |
| AskUserQuestion | Ask user for input | No |
| Skill | Execute a skill | No |
| LSP | Language Server Protocol queries | No |
| NotebookEdit | Edit Jupyter notebooks | Yes |
| ToolSearch | Search for tools across MCP servers | No |
| EnterPlanMode/ExitPlanMode | Switch plan mode programmatically | No |
| EnterWorktree/ExitWorktree | Git worktree isolation | Yes |
| ListMcpResourcesTool | List MCP server resources | No |
| ReadMcpResourceTool | Read MCP server resource | No |
| CronCreate/CronDelete/CronList | Schedule recurring tasks (adds timestamp markers) | Yes |
| TaskCreate/TaskGet/TaskList/TaskOutput/TaskStop/TaskUpdate | Background task management | No |

**System prompt rules:** Always use Grep not `grep`, Glob not `find`, Read not `cat`.

## Slash Commands

### Session & Navigation
| Command | Purpose |
|---------|---------|
| `/init` | Initialize project setup |
| `/memory` | Open CLAUDE.md + Auto-Memory settings |
| `/compact [focus]` | Compress context (with optional focus) |
| `/clear` | Reset session context completely |
| `/resume` | Session picker (continue past sessions) |
| `/fork` | Branch the conversation |
| `/add-dir` | Add directory to context |
| `/rewind` | Rewind to a previous checkpoint |
| `/branch` | Create a git branch for current work |
| `/teleport` | Transfer session between terminal ↔ claude.ai web UI |
| `/exit` | Exit Claude Code |

### Info & Diagnostics
| Command | Purpose |
|---------|---------|
| `/cost` | Current session costs |
| `/context` | Context window visualization |
| `/usage` | Token usage stats (hides redundant bars for Pro/Enterprise) |
| `/help` | Show help |
| `/doctor` | Full system diagnostics |
| `/status` | Auth and system info |
| `/stats` | Session statistics (includes subagent/fork usage) |
| `/insights` | Performance insights |
| `/release-notes` | Show what's new |
| `/passes` | View remaining passes |

### Modes & Models
| Command | Purpose |
|---------|---------|
| `/model` | Switch model (sonnet/opus/haiku) |
| `/effort <level>` | Set thinking depth: `low`, `medium`, `high`, `max`, `auto` |
| `/plan` | Toggle plan mode |
| `/fast` | Quick mode (less thinking) |
| `/vim` | Vim keybindings |

### Config & Setup
| Command | Purpose |
|---------|---------|
| `/permissions` | Manage permissions (includes Recent tab for auto-denials) |
| `/sandbox` | Enter sandbox mode |
| `/hooks` | Manage hooks (supports `if` filtering and `PermissionDenied`) |
| `/mcp` | MCP server management |
| `/config` | Edit config (e.g., `showThinkingSummaries`) |
| `/env` | Set environment variables for Bash and PowerShell |
| `/agents` | Create/manage agents |
| `/skills` | Manage skills (alphabetical sorting, 250-char descriptions) |
| `/privacy-settings` | Privacy configuration |
| `/terminal-setup` | Terminal configuration |
| `/keybindings` | Customize keyboard shortcuts |
| `/theme` | Customize appearance |
| `/statusline` | Configure status bar |

### Collaboration & Tools
| Command | Purpose |
|---------|---------|
| `/review` | Code review |
| `/pr-comments` | Review PR comments |
| `/diff` | Show current diff |
| `/copy` | Copy to clipboard |
| `/export` | Export session |
| `/btw` | Side question (scrollable viewport for long responses) |
| `/feedback` | Send feedback to Anthropic |
| `/bug` | Report bug |
| `/security-review` | Security audit |
| `/schedule` | Manage scheduled tasks |
| `/tasks` | View task queue |
| `/loop` | Automate recurring prompts at intervals |
| `/simplify` | Bundled simplification workflow |
| `/batch` | Bundled batch workflow |

### Extensions & Integrations
| Command | Purpose |
|---------|---------|
| `/chrome` | Chrome browser integration |
| `/voice` | Voice dictation (supports push-to-talk) |
| `/plugin` | Browse/install/uninstall plugins (preserves data on uninstall) |
| `/reload-plugins` | Reload installed plugins |
| `/install-github-app` | Install GitHub integration |
| `/install-slack-app` | Install Slack integration |
| `/remote-control` | Remote control settings |
| `/remote-env` | Remote environment config |
| `/mobile` | Mobile companion |
| `/stickers` | Visual terminal indicators |
| `/channels` | Interact via messaging apps (Discord, Telegram) |

### System
| Command | Purpose |
|---------|---------|
| `/login` | Log in to Anthropic |
| `/logout` | Log out |
| `/upgrade` | Upgrade Claude Code |
| `/ide` | IDE integration settings |
| `/rename` | Rename session |
| `/color` | Color settings |
| `/debug` | Debug logging mid-session |

## Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| Shift+Tab | Cycle: Normal → Auto-Accept → Plan |
| Escape | Cancel generation |
| Escape (2×) | Rewind menu — go back to a previous checkpoint |
| @ | Mention files or **named subagents** in prompt |
| ! | Execute shell inline (pasting `!cmd` into empty prompt enters bash mode) |
| # | Quick-add rule to CLAUDE.md (e.g. `# Always use TypeScript` → saved as permanent instruction) |
| Shift+Enter | Insert newline (fixed for Windows Terminal Preview) |

## CLI Flags
| Flag | Purpose |
|------|---------|
| `-p "prompt"` | Headless/non-interactive mode |
| `-c` | Continue last session |
| `-r ID` | Resume specific session |
| `--model <n>` | Set model |
| `--output-format json` | JSON output |
| `--allowedTools` | Restrict tools |
| `--max-turns N` | Limit turns |
| `--worktree` | Git worktree isolation |
| `--bare` | Skip all config (fast start) |
| `--agent <name>` | Start with specific agent |
| `--agents <n>` | Start with n parallel agents |
| `--chrome` | Enable Chrome integration |
| `--channels` | Channel configuration |
| `--effort <level>` | Set thinking effort |
| `--fallback-model` | Fallback if primary unavailable |
| `--from-pr` | Start from a PR context |
| `--json-schema` | Enforce JSON schema output |
| `--max-budget-usd` | Set spending limit |
| `--name <n>` | Name the session |
| `--permission-mode` | Set permission mode |
| `--remote` | Remote session |
| `--remote-control` | Enable remote control |
| `--teammate-mode` | Agent team collaboration |
| `--teleport` | Transfer session context |
| `--verbose` | Verbose output |

## Environment Variables
| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_NO_FLICKER=1` | Opt into flicker-free alt-screen rendering |
| `BASH_DEFAULT_TIMEOUT_MS` | Set default timeout for Bash tool |
| `OTEL_LOG_TOOL_DETAILS=1` | Include tool parameters in OpenTelemetry logs |
| `CLAUDE_CODE_MCP_SERVER_NAME` | Available to MCP helper scripts |

## 🔗 Verwandte Konzepte
- **Custom Commands** → siehe `04-skills-and-agents.md` § Custom Slash Commands
- **Hooks & Automation** → siehe `05-advanced-patterns.md` § Hooks (supports `if` filtering and `PermissionDenied` retries)
- **CLI-Flags für CI/CD** → siehe `05-advanced-patterns.md` § CI/CD
- **Chrome/Plugins Details** → siehe `09-plugins-and-extensions.md`
- **MCP-spezifische Commands** → siehe `07-mcp-servers.md` § CLI Commands