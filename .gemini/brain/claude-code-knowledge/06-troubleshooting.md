# Troubleshooting

> Based on: Claude Code documentation, March 2026 | Last verified: 2026-03-24

> *Wenn etwas nicht funktioniert, ist es fast immer eines von drei Dingen: (1) Der Kontext ist voll — Claude Code hat buchstäblich vergessen, woran es arbeitet. (2) Die Konfiguration ist falsch — ein falscher API-Key, eine fehlerhafte CLAUDE.md. (3) Du sprichst aneinander vorbei — dein Prompt ist zu vage. Die gute Nachricht: Claude Code hat eingebaute Diagnostik-Tools für alle drei Fälle.*

## Diagnostics
| Command | Purpose |
|---------|---------|
| `/doctor` | Full system diagnostics |
| `/debug` | Debug logging mid-session |
| `/status` | Auth and system info |
| `/cost` | Token usage and costs |
| `/context` | Context window visualization |

## Common Errors

### "This organization has been disabled" (API 400)
Cause: ANTHROPIC_API_KEY env var overrides subscription. Fix: `unset ANTHROPIC_API_KEY`

### "Prompt is too long" on resume
Cause: Context exceeded limit. Fix: Start new session. Persist info in CLAUDE.md.

### Context degradation in long sessions
Symptoms: Inconsistent answers, references "typical patterns" instead of specific code.
Fix: `/compact` regularly, sub-agents for exploration, scratchpad files, `/clear` between tasks.

### MCP connection failures
Fix: `claude --mcp-debug`. Check env vars.

## Reset (Eskalationsstufen — vom Sanften zum Harten)

### Level 1: Sanft ✅ (kein Datenverlust)
- `/clear` — Session-Kontext zurücksetzen (Einstellungen bleiben)
- `claude auth logout && claude auth login` — Authentifizierung erneuern
- `/doctor` — Diagnostik laufen lassen

### Level 2: Mittel ⚠️ (Settings gehen verloren)
> ⚠️ **Warnung:** Erstelle vorher ein Backup!
- `cp ~/.claude.json ~/.claude.json.backup`
- Dann: `rm ~/.claude.json` — Nur User-Settings zurücksetzen
- Danach: `claude auth login` und Settings neu konfigurieren

### Level 3: Komplett-Reset 🚨 (ALLES geht verloren)
> 🚨 **NUR als allerletzter Ausweg!** Dies löscht ALLE Einstellungen, Plugins, Custom Configs unwiderruflich.
- `cp -r ~/.claude/ ~/.claude-backup/` — Backup!
- `rm ~/.claude.json && rm -rf ~/.claude/` — Alles weg
- Danach: Komplett neu einrichten (Login, Settings, Plugins)

### Projekt-Reset (getrennt vom User-Reset)
- `rm -rf .claude/ && rm -f .mcp.json` — Projekt-Config löschen (CLAUDE.md bleibt)
- `/clear` — Session-Kontext zurücksetzen
- `/bug` — Problem an Anthropic melden

## 🔗 Verwandte Konzepte
- **Context-Probleme** → siehe `01-fundamentals.md` § Context Window
- **MCP Debugging** → siehe `07-mcp-servers.md` § Debugging
- **Hook-Fehler** → siehe `05-advanced-patterns.md` § Hooks
- **Konfigurationsprobleme** → siehe `03-configuration.md` § Permission Config


