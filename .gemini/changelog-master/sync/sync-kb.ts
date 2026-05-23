#!/usr/bin/env npx tsx
/**
 * KB Sync Script — Pulls approved updates from the Changelog-Master server
 * and applies them to the local Knowledge Base files.
 *
 * Usage:
 *   npx tsx sync/sync-kb.ts                    # Interactive sync
 *   npx tsx sync/sync-kb.ts --push             # Upload current KB as snapshot
 *   npx tsx sync/sync-kb.ts --auto             # Auto-apply all approved updates
 *   npx tsx sync/sync-kb.ts --server URL       # Custom server URL
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_SERVER = 'http://localhost:3001';
const SERVER_URL = process.argv.includes('--server')
  ? process.argv[process.argv.indexOf('--server') + 1]
  : DEFAULT_SERVER;

// KB base path — adjust this to your local setup
const KB_BASE_PATH = path.resolve(__dirname, '..', '..', '.gemini', 'brain');
// Fallback: if running from within drop_project/changelog-master
const KB_FALLBACK_PATH = path.resolve(__dirname, '..', '..', 'GEMINI.md');

function findKBBasePath(): string {
  // Try to find the KB files relative to the script
  const candidates = [
    KB_BASE_PATH,
    path.resolve(__dirname, '..', '..', '..', '.gemini', 'brain'),
    path.resolve(process.env.HOME || '~', '.gemini', 'brain'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Last resort: look for GEMINI.md in parent dirs
  let dir = path.resolve(__dirname, '..');
  for (let i = 0; i < 5; i++) {
    const geminiPath = path.join(dir, 'GEMINI.md');
    if (fs.existsSync(geminiPath)) {
      return path.join(dir, '.gemini', 'brain');
    }
    dir = path.resolve(dir, '..');
  }

  console.error('❌ Could not find Knowledge Base directory.');
  console.error('   Expected at: .gemini/brain/');
  console.error('   Run this script from the project root or pass the path.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// ============ API Calls ============

async function apiGet(endpoint: string) {
  const res = await fetch(`${SERVER_URL}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPost(endpoint: string, body: unknown) {
  const res = await fetch(`${SERVER_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ============ Push KB Snapshot ============

async function pushSnapshot(kbBasePath: string) {
  console.log('\n📤 Uploading KB snapshot to server...\n');

  const files: { file_path: string; content: string }[] = [];

  // Collect KB files
  const kbDir = path.join(kbBasePath, 'claude-code-knowledge');
  const templatesDir = path.join(kbBasePath, 'templates');
  const geminiMd = path.join(kbBasePath, '..', '..', 'GEMINI.md');

  // Knowledge Base files
  if (fs.existsSync(kbDir)) {
    for (const file of fs.readdirSync(kbDir)) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(kbDir, file), 'utf-8');
        files.push({ file_path: `claude-code-knowledge/${file}`, content });
        console.log(`  📄 ${file} (${content.length} bytes)`);
      }
    }
  }

  // Template files
  if (fs.existsSync(templatesDir)) {
    for (const file of fs.readdirSync(templatesDir)) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
        files.push({ file_path: `templates/${file}`, content });
        console.log(`  📄 ${file} (${content.length} bytes)`);
      }
    }
  }

  // GEMINI.md (system prompt)
  if (fs.existsSync(geminiMd)) {
    const content = fs.readFileSync(geminiMd, 'utf-8');
    files.push({ file_path: 'GEMINI.md', content });
    console.log(`  📄 GEMINI.md (${content.length} bytes)`);
  }

  if (files.length === 0) {
    console.error('❌ No KB files found to upload.');
    return;
  }

  const result = await apiPost('/api/kb/snapshot', { files });
  console.log(`\n✅ Uploaded ${result.count} file(s) as snapshot.\n`);
}

// ============ Pull & Apply Updates ============

async function pullUpdates(kbBasePath: string, autoApply: boolean) {
  console.log('\n🔄 Checking for approved updates...\n');

  const updates = await apiGet('/api/kb/sync');

  if (!Array.isArray(updates) || updates.length === 0) {
    console.log('✅ No pending updates to apply.\n');
    return;
  }

  console.log(`📋 ${updates.length} approved update(s) available:\n`);

  for (const update of updates) {
    console.log(`  📝 ${update.file_name}`);
    console.log(`     Source: ${update.source_title} (${update.source_type})`);
    console.log(`     Summary: ${update.change_summary}`);
    console.log('');
  }

  if (!autoApply) {
    const answer = await ask('Apply these updates? (y/n/view): ');
    if (answer.toLowerCase() === 'view') {
      for (const update of updates) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📝 ${update.file_name} — ${update.change_summary}`);
        console.log(`${'='.repeat(60)}`);
        console.log('\n--- UPDATED CONTENT (first 500 chars) ---');
        console.log(update.updated_content.slice(0, 500));
        console.log('...\n');
      }
      const confirm = await ask('Apply all? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        console.log('❌ Cancelled.\n');
        return;
      }
    } else if (answer.toLowerCase() !== 'y') {
      console.log('❌ Cancelled.\n');
      return;
    }
  }

  // Apply updates
  const appliedIds: string[] = [];

  for (const update of updates) {
    try {
      let targetPath: string;

      if (update.file_path === 'GEMINI.md') {
        targetPath = path.join(kbBasePath, '..', '..', 'GEMINI.md');
      } else {
        targetPath = path.join(kbBasePath, update.file_path);
      }

      // Ensure directory exists
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write updated content
      fs.writeFileSync(targetPath, update.updated_content, 'utf-8');
      console.log(`  ✅ Applied: ${update.file_name}`);
      appliedIds.push(update.id);
    } catch (err) {
      console.error(`  ❌ Failed to apply ${update.file_name}:`, err);
    }
  }

  // Confirm with server
  if (appliedIds.length > 0) {
    await apiPost('/api/kb/sync/confirm', { update_ids: appliedIds });
    console.log(`\n✅ ${appliedIds.length} update(s) applied and confirmed.\n`);
  }
}

// ============ Stats ============

async function showStats() {
  const stats = await apiGet('/api/kb/stats');
  console.log('\n📊 KB Update Stats:');
  console.log(`   Pending:  ${stats.pending}`);
  console.log(`   Approved: ${stats.approved}`);
  console.log(`   Applied:  ${stats.applied}`);
  console.log(`   Rejected: ${stats.rejected}`);
  console.log(`   Tracked:  ${stats.snapshots} files\n`);
}

// ============ Main ============

async function main() {
  const args = process.argv.slice(2);

  console.log('🧠 Claude Code Teacher — KB Sync');
  console.log(`   Server: ${SERVER_URL}\n`);

  // Check server connectivity
  try {
    await apiGet('/api/health');
  } catch {
    console.error(`❌ Cannot connect to server at ${SERVER_URL}`);
    console.error('   Make sure the changelog-master server is running: npm run dev:all');
    process.exit(1);
  }

  const kbBasePath = findKBBasePath();
  console.log(`   KB Path: ${kbBasePath}\n`);

  if (args.includes('--push')) {
    await pushSnapshot(kbBasePath);
  } else if (args.includes('--auto')) {
    await pullUpdates(kbBasePath, true);
  } else if (args.includes('--stats')) {
    await showStats();
  } else {
    // Interactive mode
    await showStats();

    const action = await ask('What would you like to do?\n  1) Push current KB as snapshot\n  2) Pull & apply approved updates\n  3) Both (push first, then pull)\n  > ');

    switch (action.trim()) {
      case '1':
        await pushSnapshot(kbBasePath);
        break;
      case '2':
        await pullUpdates(kbBasePath, false);
        break;
      case '3':
        await pushSnapshot(kbBasePath);
        await pullUpdates(kbBasePath, false);
        break;
      default:
        console.log('Invalid option.');
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
