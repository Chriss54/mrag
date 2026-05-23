# Plugins and Extensions

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-31

> *Plugins und Extensions machen Claude Code modular. Statt alles selbst einzubauen, kann die Community Erweiterungen erstellen und teilen — wie ein App Store für deinen Entwickler-Assistenten.*

## Plugin System
Plugins extend Claude Code with community-built functionality.

### Managing Plugins
```bash
/plugin                  # Browse and install plugins
/reload-plugins          # Reload after changes
/release-notes           # See what's new
```

### How Plugins Work
- Plugins add new slash commands, tools, or workflows
- Installed per-user or per-project
- Community marketplace for discovery
- `/plugin` to browse, install, and manage

## Chrome & Computer Use
```bash
/chrome                  # Open Chrome integration
/computer-use            # Enable full desktop control
```
- Claude Code can interact with web pages and **desktop applications**.
- Read page content, take screenshots, and manipulate UI elements (clicks, typing).
- **Automation:** Streamline tasks like LinkedIn outreach (using specialized browsers like **Min browser**), data scraping, and automated form submission.
- **QA Testing:** Automate end-to-end testing for desktop app features and ad management workflows.
- Requires Chrome or compatible browsers to be installed.

## Voice Dictation
```bash
/voice                   # Toggle voice input
```
- Speak instead of type
- Great for describing complex requirements
- Natural language processed as regular prompts

## Remote Sessions
```bash
claude --remote          # Start remote session
/remote-env              # Configure remote environment
/remote-control          # Remote control settings
```
- Run Claude Code on remote/cloud instances
- Full feature parity with local sessions, including **Computer Use** and browser automation
- Useful for powerful hardware or CI environments

## Sandbox Mode
```bash
/sandbox                 # Enter sandbox mode
```
- Isolated execution environment
- Safe for experimenting with destructive operations
- **Recommended for Computer Use:** Use sandbox mode when testing automated desktop interactions to ensure changes don't affect the real filesystem or system settings.

## Other Extensions
| Feature | Command | Purpose |
|---------|---------|---------|
| **Stickers** | `/stickers` | Visual indicators in terminal |
| **Themes** | `/theme` | Customize terminal appearance |
| **Statusline** | `/statusline` | Configure status bar |
| **Keybindings** | `/keybindings` | Customize keyboard shortcuts |
| **Mobile** | `/mobile` | Mobile companion features |

## Claude Code Security
```bash
/security-review              # Run AI-powered security scan
```
- Reasoning-based vulnerability scanner (not pattern matching)
- Built on Opus 4.6 — traces data flows, maps component interactions
- Identifies complex issues: broken access control, business logic flaws
- Proposes targeted patches for human review
- **Risk Advisory:** Bypassing browser-based restrictions for automation (e.g., "black hat" social media scraping) can lead to account suspension. Always review AI-generated automation scripts for compliance.

## Claude Code Channels
```bash
/channels                     # Configure messaging integration
```
- Interact with Claude Code agents via Discord, Telegram
- Continue sessions across terminal, web, and messaging apps
- Useful for mobile access and team collaboration

## 🔗 Verwandte Konzepte
- **Chrome als Tool** → siehe `02-tools-and-commands.md` § Built-in Tools
- **Remote CLI-Flags** → siehe `02-tools-and-commands.md` § CLI Flags
- **Plugin-Hooks** → siehe `05-advanced-patterns.md` § Hooks