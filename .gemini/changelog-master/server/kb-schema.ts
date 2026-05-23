/**
 * KB Schema — Maps all Knowledge Base files and their structure.
 * Used by the AI to determine where new information should be placed.
 */

export interface KBFileSchema {
  path: string;
  purpose: string;
  sections: string[];
  keywords: string[];
}

export const KB_FILES: KBFileSchema[] = [
  // === Knowledge Base Files ===
  {
    path: 'claude-code-knowledge/01-fundamentals.md',
    purpose: 'Core concepts: what Claude Code is, context window, agentic loop, auto-memory, how it differs from IDE plugins',
    sections: ['What is Claude Code?', 'Key Facts', 'Context Window', 'How It Differs from IDE Plugins', 'Auto-Memory'],
    keywords: ['context window', 'agentic loop', 'autocompact', 'prefix caching', 'auto-memory', 'fundamental', 'architecture', 'token'],
  },
  {
    path: 'claude-code-knowledge/02-tools-and-commands.md',
    purpose: 'Complete reference of built-in tools, slash commands, keyboard shortcuts, and CLI flags',
    sections: ['Built-in Tools', 'Slash Commands', 'Keyboard Shortcuts', 'CLI Flags'],
    keywords: ['tool', 'command', 'slash command', 'keyboard shortcut', 'CLI', 'flag', 'bash', 'read', 'write', 'edit', 'grep', 'glob'],
  },
  {
    path: 'claude-code-knowledge/03-configuration.md',
    purpose: 'CLAUDE.md hierarchy, .claude/ directory structure, permissions, auto-memory config, MCP integration, environment variables',
    sections: ['CLAUDE.md Hierarchy', '.claude/ Directory', 'Path-Specific Rules', 'Permission Config', 'Auto-Memory', 'MCP Server Integration', 'Key Environment Variables'],
    keywords: ['CLAUDE.md', 'configuration', 'settings', 'permission', 'rules', '.claude/', 'environment variable', 'config'],
  },
  {
    path: 'claude-code-knowledge/04-skills-and-agents.md',
    purpose: 'Custom slash commands, skills, sub-agents (Task tool), custom agents',
    sections: ['Custom Slash Commands', 'Skills', 'Sub-Agents (Task Tool)', 'Custom Agents'],
    keywords: ['skill', 'agent', 'custom command', 'sub-agent', 'task tool', 'fork', 'context: fork'],
  },
  {
    path: 'claude-code-knowledge/05-advanced-patterns.md',
    purpose: 'Extended thinking, plan mode, hooks (all events), git worktrees, scheduled tasks, CI/CD, cost optimization, session management',
    sections: ['Extended Thinking', 'Plan Mode', 'Hooks', 'Git Worktrees', 'Scheduled Tasks', 'CI/CD Integration', 'Cost Optimization', 'Session Management'],
    keywords: ['think', 'plan mode', 'hook', 'worktree', 'cron', 'schedule', 'CI/CD', 'cost', 'session', 'checkpoint', 'rewind'],
  },
  {
    path: 'claude-code-knowledge/06-troubleshooting.md',
    purpose: 'Diagnostics commands, common errors, reset procedures (Level 1-3)',
    sections: ['Diagnostics', 'Common Errors', 'Reset (Escalation Levels)'],
    keywords: ['error', 'troubleshoot', 'debug', 'reset', 'doctor', 'fix', 'problem', 'broken'],
  },
  {
    path: 'claude-code-knowledge/07-mcp-servers.md',
    purpose: 'MCP protocol, transport types, scopes, CLI commands, .mcp.json format, popular servers, security',
    sections: ['What is MCP?', 'Transport Types', 'Scopes', 'CLI Commands', '.mcp.json Format', 'Popular MCP Servers', 'MCP Features', 'Debugging', 'Security Best Practices'],
    keywords: ['MCP', 'model context protocol', 'server', 'stdio', 'HTTP', 'SSE', '.mcp.json', 'plugin'],
  },
  {
    path: 'claude-code-knowledge/08-agents-and-teams.md',
    purpose: 'Custom agents in detail, built-in subagents, agent teams, foreground/background, persistent memory, agent hooks',
    sections: ['Custom Agents', 'Built-in Subagents', 'Agent Teams', 'Foreground vs Background', 'Persistent Memory', 'Agent Hooks'],
    keywords: ['agent', 'team', 'teammate', 'subagent', 'parallel', 'collaboration', '@agent'],
  },
  {
    path: 'claude-code-knowledge/09-plugins-and-extensions.md',
    purpose: 'Plugin system, Chrome integration, voice dictation, remote sessions, sandbox, security review, channels',
    sections: ['Plugin System', 'Chrome Integration', 'Voice Dictation', 'Remote Sessions', 'Sandbox Mode', 'Other Extensions', 'Claude Code Security', 'Claude Code Channels'],
    keywords: ['plugin', 'chrome', 'voice', 'remote', 'sandbox', 'sticker', 'theme', 'channel', 'extension', 'security review'],
  },

  // === Templates ===
  {
    path: 'templates/claude-md-template.md',
    purpose: 'Guide for generating project-specific CLAUDE.md files, including framework-specific templates',
    sections: ['Vorgehensweise', 'Template', 'Framework-spezifische Ergänzungen', 'Regeln nach Generierung'],
    keywords: ['CLAUDE.md', 'template', 'generate', 'project configuration'],
  },
  {
    path: 'templates/command-templates.md',
    purpose: 'Templates for slash commands: review, test, refactor, debug, commit, plus custom command builder',
    sections: ['Standard-Commands', 'Command-Baukasten'],
    keywords: ['command', 'slash command', 'review', 'test', 'refactor', 'debug', 'commit'],
  },
  {
    path: 'templates/skill-templates.md',
    purpose: 'Templates for skills: explore-codebase, plan-feature, fix-bug, plus custom skill builder',
    sections: ['Standard-Skills', 'Skill-Baukasten'],
    keywords: ['skill', 'explore', 'plan', 'fix', 'SKILL.md'],
  },
  {
    path: 'templates/rule-templates.md',
    purpose: 'Templates for rules: testing, api-conventions, react, database, security, python, plus builder',
    sections: ['Standard-Rules', 'Weitere Rule-Vorlagen', 'Rule-Baukasten'],
    keywords: ['rule', 'testing', 'api', 'react', 'database', 'security', 'python', 'path pattern'],
  },
  {
    path: 'templates/agent-templates.md',
    purpose: 'Templates for agents: code-reviewer, docs-writer, security-auditor, plus agent builder',
    sections: ['Standard-Agents', 'Agent-Baukasten'],
    keywords: ['agent', 'code-reviewer', 'docs-writer', 'security-auditor', 'custom agent'],
  },
  {
    path: 'templates/config-analysis-template.md',
    purpose: 'Checklist for analyzing existing Claude Code configurations — CLAUDE.md, commands, skills, rules, settings, MCP',
    sections: ['CLAUDE.md prüfen', '.claude/ Ordner durchsuchen', 'Commands bewerten', 'Skills bewerten', 'Rules bewerten', 'Settings prüfen', 'MCP-Server prüfen', 'Wissensstand prüfen'],
    keywords: ['analysis', 'config', 'audit', 'check', 'existing', 'optimize'],
  },

  // === System Prompt ===
  {
    path: 'GEMINI.md',
    purpose: 'Main system prompt: role definition, 3 modes (Coach/Konfigurator/Explorer), coaching scenarios, onboarding levels, file system rules, quick reference',
    sections: ['Deine Rolle', 'Verweise auf Wissensdatenbank', 'Konfigurator-Modus', 'Onboarding-Stufen', 'Dateisystem-Zugriff', 'Konfigurator-Rezepte', 'Schnellreferenz', 'Explorer-Modus', 'Coaching-Szenarien', 'Wissen aktualisieren', 'Qualitätsprüfung'],
    keywords: ['system prompt', 'mode', 'coach', 'konfigurator', 'explorer', 'onboarding', 'scenario', 'workflow'],
  },
];

/**
 * Generate a concise schema description for the AI mapper prompt.
 */
export function getKBSchemaForPrompt(): string {
  return KB_FILES.map((f, i) => 
    `${i + 1}. **${f.path}**\n   Purpose: ${f.purpose}\n   Sections: ${f.sections.join(', ')}`
  ).join('\n\n');
}

/**
 * Find potentially affected KB files based on keyword matching.
 * Used as a pre-filter before AI mapping.
 */
export function findRelevantFiles(text: string): KBFileSchema[] {
  const lowerText = text.toLowerCase();
  return KB_FILES.filter(f => 
    f.keywords.some(kw => lowerText.includes(kw.toLowerCase()))
  );
}
