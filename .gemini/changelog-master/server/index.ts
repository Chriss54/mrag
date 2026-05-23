import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import cron, { ScheduledTask } from 'node-cron';
import {
  ingestURL,
  ingestYouTube,
  mapToKBFiles,
  generateKBUpdate,
  generateUpdatesFromChangelog,
  type KBUpdate,
} from './kb-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Default source URL (used for seeding)
const DEFAULT_CHANGELOG_URL = 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md';
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

// Initialize SQLite database
const dbPath = path.join(__dirname, '..', 'data', 'audio.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS audio_cache (
    id TEXT PRIMARY KEY,
    text_hash TEXT NOT NULL,
    voice TEXT NOT NULL,
    audio_data BLOB NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_audio_hash_voice ON audio_cache(text_hash, voice);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS changelog_history (
    version TEXT PRIMARY KEY,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notified BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    selected_versions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);

  CREATE TABLE IF NOT EXISTS analysis_cache (
    version TEXT PRIMARY KEY,
    analysis_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS changelog_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT 1,
    last_version TEXT,
    last_checked_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_changelog_sources_active ON changelog_sources(is_active);

  CREATE TABLE IF NOT EXISTS kb_updates (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_title TEXT NOT NULL,
    original_content TEXT NOT NULL,
    updated_content TEXT NOT NULL,
    change_summary TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    applied_at DATETIME
  );

  CREATE INDEX IF NOT EXISTS idx_kb_updates_status ON kb_updates(status);

  CREATE TABLE IF NOT EXISTS kb_snapshots (
    file_path TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ingestion_log (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    source_type TEXT NOT NULL,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    error TEXT,
    updates_generated INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migrate existing changelog_history to support source_id
try {
  db.exec(`ALTER TABLE changelog_history ADD COLUMN source_id TEXT`);
} catch {
  // Column already exists
}

// Seed default source if none exists
const sourceCount = (db.prepare('SELECT COUNT(*) as count FROM changelog_sources').get() as { count: number }).count;
if (sourceCount === 0) {
  db.prepare(`
    INSERT INTO changelog_sources (id, name, url, is_active)
    VALUES (?, ?, ?, 1)
  `).run('src_claude_code', 'Claude Code', DEFAULT_CHANGELOG_URL);
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ============ Changelog Monitoring ============

let cronJob: ScheduledTask | null = null;
let currentCronExpression: string | null = null;

// Convert milliseconds interval to cron expression
function intervalToCron(intervalMs: number): string | null {
  const minutes = intervalMs / 60000;

  if (minutes <= 0) return null;
  if (minutes === 1) return '* * * * *';           // Every minute
  if (minutes === 5) return '*/5 * * * *';         // Every 5 minutes
  if (minutes === 15) return '*/15 * * * *';       // Every 15 minutes
  if (minutes === 30) return '*/30 * * * *';       // Every 30 minutes
  if (minutes === 60) return '0 * * * *';          // Every hour
  if (minutes === 360) return '0 */6 * * *';       // Every 6 hours
  if (minutes === 720) return '0 */12 * * *';      // Every 12 hours
  if (minutes === 1440) return '0 0 * * *';        // Once a day (midnight)
  if (minutes === 10080) return '0 0 * * 0';       // Once a week (Sunday midnight)
  if (minutes === 20160) return '0 0 1,15 * *';    // Every two weeks (1st and 15th)

  // Default: convert to nearest minute interval
  return `*/${Math.max(1, Math.round(minutes))} * * * *`;
}

interface ChangelogSource {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  last_version: string | null;
  last_checked_at: string | null;
}

function getActiveSources(): ChangelogSource[] {
  const stmt = db.prepare('SELECT * FROM changelog_sources WHERE is_active = 1');
  return stmt.all() as ChangelogSource[];
}

function getAllSources(): ChangelogSource[] {
  const stmt = db.prepare('SELECT * FROM changelog_sources ORDER BY created_at ASC');
  return stmt.all() as ChangelogSource[];
}

function getLastKnownVersion(sourceId?: string): string | null {
  if (sourceId) {
    const stmt = db.prepare('SELECT version FROM changelog_history WHERE source_id = ? ORDER BY detected_at DESC LIMIT 1');
    const row = stmt.get(sourceId) as { version: string } | undefined;
    return row?.version ?? null;
  }
  const stmt = db.prepare('SELECT version FROM changelog_history ORDER BY detected_at DESC LIMIT 1');
  const row = stmt.get() as { version: string } | undefined;
  return row?.version ?? null;
}

function saveVersion(version: string, sourceId: string): void {
  const stmt = db.prepare('INSERT OR IGNORE INTO changelog_history (version, source_id) VALUES (?, ?)');
  stmt.run(version, sourceId);

  // Update source's last_version
  db.prepare('UPDATE changelog_sources SET last_version = ?, last_checked_at = CURRENT_TIMESTAMP WHERE id = ?').run(version, sourceId);
}

function markVersionNotified(version: string, sourceId: string): void {
  const stmt = db.prepare('UPDATE changelog_history SET notified = 1 WHERE version = ? AND source_id = ?');
  stmt.run(version, sourceId);
}

async function fetchChangelog(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch changelog: ${response.status}`);
  return response.text();
}

function parseLatestVersion(markdown: string): { version: string; content: string } | null {
  const lines = markdown.split('\n');
  let version = '';
  let content: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const versionMatch = line.match(/^##\s+\[?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)\]?/);
    if (versionMatch) {
      if (capturing) break; // Stop at second version
      version = versionMatch[1];
      capturing = true;
      content.push(line);
    } else if (capturing) {
      content.push(line);
    }
  }

  return version ? { version, content: content.join('\n') } : null;
}

async function analyzeChangelog(changelogText: string): Promise<ChangelogEmailRequest | null> {
  if (!GEMINI_API_KEY) return null;

  const prompt = `Analyze this changelog and return JSON:
{
  "tldr": "150-200 word summary",
  "categories": {
    "critical_breaking_changes": [],
    "removals": [{"feature": "", "severity": "", "why": ""}],
    "major_features": [],
    "important_fixes": [],
    "new_slash_commands": [],
    "terminal_improvements": [],
    "api_changes": []
  },
  "action_items": [],
  "sentiment": "positive|neutral|critical"
}

Changelog:
${changelogText}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  // Try to extract JSON from the response (sometimes Gemini adds extra text)
  try {
    return JSON.parse(text);
  } catch {
    // Try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  }
}

async function generateTTSAudio(text: string, voice: string = 'Charon'): Promise<Buffer | null> {
  if (!GEMINI_API_KEY) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Read this changelog summary:\n\n${text}` }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;

  // Convert PCM to WAV
  const pcmBuffer = Buffer.from(base64Audio, 'base64');
  return pcmToWav(pcmBuffer);
}

function pcmToWav(pcmData: Buffer): Buffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const buffer = Buffer.alloc(headerSize + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  pcmData.copy(buffer, headerSize);

  return buffer;
}

async function sendEmailWithAttachment(
  data: ChangelogEmailRequest,
  audioBuffer: Buffer | null
): Promise<boolean> {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) return false;

  const html = generateEmailHtml(data);

  const emailPayload: Record<string, unknown> = {
    from: 'Changelog Tracker <onboarding@resend.dev>',
    to: [NOTIFY_EMAIL],
    subject: `🆕 Claude Code ${data.version} Released`,
    html,
  };

  if (audioBuffer) {
    emailPayload.attachments = [
      {
        filename: `claude-code-${data.version}-summary.wav`,
        content: audioBuffer.toString('base64'),
      },
    ];
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  return response.ok;
}

async function checkSourceForNewChangelog(source: ChangelogSource): Promise<void> {
  try {
    console.log(`[Monitor] Checking source: ${source.name} (${source.url})`);

    const markdown = await fetchChangelog(source.url);
    const latest = parseLatestVersion(markdown);

    if (!latest) {
      console.log(`[Monitor] Could not parse changelog for ${source.name}`);
      return;
    }

    const lastKnown = getLastKnownVersion(source.id);
    console.log(`[Monitor] ${source.name}: Latest: ${latest.version}, Last known: ${lastKnown}`);

    // Check settings
    const settingsStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const notifyEnabled = settingsStmt.get('emailNotificationsEnabled') as { value: string } | undefined;
    const alwaysSendEmail = settingsStmt.get('alwaysSendEmail') as { value: string } | undefined;

    if (notifyEnabled?.value !== 'true') {
      console.log(`[Monitor] Email notifications disabled for ${source.name}, skipping`);
      if (lastKnown !== latest.version) {
        saveVersion(latest.version, source.id);
      }
      return;
    }

    const isNewVersion = lastKnown !== latest.version;
    const shouldSendEmail = isNewVersion || alwaysSendEmail?.value === 'true';

    if (!shouldSendEmail) {
      console.log(`[Monitor] ${source.name}: No new version and always-send disabled`);
      return;
    }

    if (isNewVersion) {
      console.log(`[Monitor] ${source.name}: New version detected: ${latest.version}`);
      saveVersion(latest.version, source.id);
    } else {
      console.log(`[Monitor] ${source.name}: Sending scheduled email for current version`);
    }

    // Analyze the changelog
    console.log(`[Monitor] Analyzing changelog for ${source.name}...`);
    const analysis = await analyzeChangelog(latest.content);

    if (!analysis) {
      console.log(`[Monitor] Failed to analyze changelog for ${source.name}`);
      return;
    }

    analysis.version = `${source.name} ${latest.version}`;

    // NEW C1 LOGIC: Generate KB Updates automatically
    try {
      console.log(`[Monitor] Auto-Generating KB Updates for ${source.name}...`);
      const kbResult = await processKBUpdates(
        latest.content,
        analysis.version,
        'changelog',
        source.url
      );
      console.log(`[Monitor] Auto-Heartbeat generated ${kbResult.updates} KB updates (${kbResult.skipped} skipped)`);
    } catch (kbError) {
      console.error(`[Monitor] Failed to auto-generate KB updates:`, kbError);
    }

    // Generate audio
    console.log(`[Monitor] Generating audio for ${source.name}...`);
    const voiceSetting = settingsStmt.get('notificationVoice') as { value: string } | undefined;
    const voice = voiceSetting?.value || 'Charon';
    const audioBuffer = await generateTTSAudio(analysis.tldr, voice);

    // Send email
    console.log(`[Monitor] Sending notification email for ${source.name}...`);
    const sent = await sendEmailWithAttachment(analysis, audioBuffer);

    if (sent) {
      markVersionNotified(latest.version, source.id);
      console.log(`[Monitor] Notification sent for ${source.name} ${latest.version}`);
    } else {
      console.log(`[Monitor] Failed to send notification for ${source.name}`);
    }
  } catch (error) {
    console.error(`[Monitor] Error checking ${source.name}:`, error);
  }
}

async function checkForNewChangelog(): Promise<void> {
  console.log('[Monitor] Starting changelog check for all active sources...');

  const sources = getActiveSources();

  if (sources.length === 0) {
    console.log('[Monitor] No active sources configured');
    return;
  }

  console.log(`[Monitor] Checking ${sources.length} source(s)`);

  for (const source of sources) {
    await checkSourceForNewChangelog(source);
  }

  console.log('[Monitor] Finished checking all sources');
}

function startMonitoring(intervalMs: number): void {
  // Stop existing cron job if any
  stopMonitoring();

  const cronExpression = intervalToCron(intervalMs);

  if (!cronExpression) {
    console.log('[Monitor] Monitoring disabled (no valid interval)');
    return;
  }

  console.log(`[Monitor] Starting cron job: "${cronExpression}" (every ${intervalMs / 60000} minutes)`);
  currentCronExpression = cronExpression;

  // Check immediately on start
  checkForNewChangelog();

  // Schedule cron job
  cronJob = cron.schedule(cronExpression, () => {
    console.log(`[Cron] Running scheduled check at ${new Date().toISOString()}`);
    checkForNewChangelog();
  });

  console.log('[Monitor] Cron job started successfully');
}

function stopMonitoring(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    currentCronExpression = null;
    console.log('[Monitor] Cron job stopped');
  }
}

// ============ Express Routes ============

// Audio cache endpoints
app.get('/api/audio/:textHash/:voice', (req, res) => {
  const { textHash, voice } = req.params;

  const stmt = db.prepare('SELECT audio_data FROM audio_cache WHERE text_hash = ? AND voice = ?');
  const row = stmt.get(textHash, voice) as { audio_data: Buffer } | undefined;

  if (row) {
    res.set('Content-Type', 'audio/wav');
    res.send(row.audio_data);
  } else {
    res.status(404).json({ error: 'Audio not found' });
  }
});

app.post('/api/audio', (req, res) => {
  const { textHash, voice, audioData } = req.body;

  if (!textHash || !voice || !audioData) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const buffer = Buffer.from(audioData, 'base64');
    const id = `${textHash}_${voice}_${Date.now()}`;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO audio_cache (id, text_hash, voice, audio_data)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, textHash, voice, buffer);

    res.json({ success: true, id });
  } catch (error) {
    console.error('Failed to save audio:', error);
    res.status(500).json({ error: 'Failed to save audio' });
  }
});

app.get('/api/audio/list', (_req, res) => {
  const stmt = db.prepare(`
    SELECT id, text_hash, voice, created_at, LENGTH(audio_data) as size
    FROM audio_cache
    ORDER BY created_at DESC
  `);
  const rows = stmt.all();
  res.json(rows);
});

app.delete('/api/audio/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM audio_cache WHERE id = ?');
  stmt.run(id);
  res.json({ success: true });
});

// Settings endpoints
app.get('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key) as { value: string } | undefined;
  res.json({ value: row?.value ?? null });
});

app.post('/api/settings/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  stmt.run(key, value);

  // Handle monitoring settings
  if (key === 'emailNotificationsEnabled' || key === 'notificationCheckInterval') {
    const enabledRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('emailNotificationsEnabled') as { value: string } | undefined;
    const intervalRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('notificationCheckInterval') as { value: string } | undefined;

    const enabled = enabledRow?.value === 'true';
    const interval = parseInt(intervalRow?.value || '0') || 0;

    if (enabled && interval > 0) {
      startMonitoring(interval);
    } else {
      stopMonitoring();
    }
  }

  res.json({ success: true });
});

app.get('/api/settings', (_req, res) => {
  const stmt = db.prepare('SELECT key, value FROM settings');
  const rows = stmt.all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  rows.forEach((row) => {
    settings[row.key] = row.value;
  });
  res.json(settings);
});

// Monitoring endpoints
app.post('/api/monitor/check', async (_req, res) => {
  await checkForNewChangelog();
  res.json({ success: true });
});

// Send demo email with audio attachment on demand
app.post('/api/send-demo-email', async (req, res) => {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    res.status(500).json({ success: false, error: 'Email configuration missing' });
    return;
  }

  try {
    const { voice = 'Charon', sourceId } = req.body;

    // Get source URL
    let sourceUrl = DEFAULT_CHANGELOG_URL;
    let sourceName = 'Claude Code';

    if (sourceId) {
      const stmt = db.prepare('SELECT * FROM changelog_sources WHERE id = ?');
      const source = stmt.get(sourceId) as ChangelogSource | undefined;
      if (source) {
        sourceUrl = source.url;
        sourceName = source.name;
      }
    } else {
      // Use first active source
      const sources = getActiveSources();
      if (sources.length > 0) {
        sourceUrl = sources[0].url;
        sourceName = sources[0].name;
      }
    }

    console.log(`[Demo] Fetching changelog from ${sourceName}...`);
    const markdown = await fetchChangelog(sourceUrl);
    const latest = parseLatestVersion(markdown);

    if (!latest) {
      res.status(500).json({ success: false, error: 'Could not parse changelog' });
      return;
    }

    console.log(`[Demo] Analyzing ${sourceName} version ${latest.version}...`);
    const analysis = await analyzeChangelog(latest.content);

    if (!analysis) {
      res.status(500).json({ success: false, error: 'Failed to analyze changelog' });
      return;
    }

    analysis.version = `${sourceName} ${latest.version}`;

    console.log('[Demo] Generating audio...');
    const audioBuffer = await generateTTSAudio(analysis.tldr, voice);

    console.log('[Demo] Sending email with attachment...');
    const sent = await sendEmailWithAttachment(analysis, audioBuffer);

    if (sent) {
      console.log('[Demo] Demo email sent successfully!');
      res.json({ success: true, version: latest.version });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
  } catch (error) {
    console.error('[Demo] Error:', error);
    res.status(500).json({ success: false, error: 'Failed to send demo email' });
  }
});

app.get('/api/monitor/status', (_req, res) => {
  const enabledRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('emailNotificationsEnabled') as { value: string } | undefined;
  const intervalRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('notificationCheckInterval') as { value: string } | undefined;
  const lastVersion = getLastKnownVersion();

  res.json({
    enabled: enabledRow?.value === 'true',
    interval: parseInt(intervalRow?.value || '0') || 0,
    lastKnownVersion: lastVersion,
    isRunning: cronJob !== null,
    cronExpression: currentCronExpression,
  });
});

app.get('/api/monitor/history', (_req, res) => {
  const stmt = db.prepare('SELECT version, detected_at, notified, source_id FROM changelog_history ORDER BY detected_at DESC LIMIT 20');
  const rows = stmt.all();
  res.json(rows);
});

// ============ Changelog Sources Endpoints ============

// Get all sources
app.get('/api/sources', (_req, res) => {
  const sources = getAllSources();
  res.json(sources);
});

// Get a single source
app.get('/api/sources/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('SELECT * FROM changelog_sources WHERE id = ?');
  const source = stmt.get(id);

  if (!source) {
    res.status(404).json({ error: 'Source not found' });
    return;
  }

  res.json(source);
});

// Create a new source
app.post('/api/sources', (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    res.status(400).json({ error: 'Name and URL are required' });
    return;
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  const id = `src_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const stmt = db.prepare(`
      INSERT INTO changelog_sources (id, name, url, is_active)
      VALUES (?, ?, ?, 1)
    `);
    stmt.run(id, name, url);

    res.json({ id, name, url, is_active: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'A source with this URL already exists' });
    } else {
      console.error('Failed to create source:', error);
      res.status(500).json({ error: 'Failed to create source' });
    }
  }
});

// Update a source
app.patch('/api/sources/:id', (req, res) => {
  const { id } = req.params;
  const { name, url, is_active } = req.body;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }

  if (url !== undefined) {
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }
    updates.push('url = ?');
    values.push(url);
  }

  if (is_active !== undefined) {
    updates.push('is_active = ?');
    values.push(is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No updates provided' });
    return;
  }

  values.push(id);

  try {
    const stmt = db.prepare(`UPDATE changelog_sources SET ${updates.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }

    res.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'A source with this URL already exists' });
    } else {
      console.error('Failed to update source:', error);
      res.status(500).json({ error: 'Failed to update source' });
    }
  }
});

// Delete a source
app.delete('/api/sources/:id', (req, res) => {
  const { id } = req.params;

  // Delete associated history
  db.prepare('DELETE FROM changelog_history WHERE source_id = ?').run(id);

  // Delete source
  const stmt = db.prepare('DELETE FROM changelog_sources WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Source not found' });
    return;
  }

  res.json({ success: true });
});

// Fetch changelog from a source (for preview)
app.get('/api/sources/:id/changelog', async (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('SELECT * FROM changelog_sources WHERE id = ?');
  const source = stmt.get(id) as ChangelogSource | undefined;

  if (!source) {
    res.status(404).json({ error: 'Source not found' });
    return;
  }

  try {
    const markdown = await fetchChangelog(source.url);
    res.json({ markdown, source });
  } catch (error) {
    console.error(`Failed to fetch changelog for ${source.name}:`, error);
    res.status(500).json({ error: 'Failed to fetch changelog' });
  }
});

// Test a URL to see if it's a valid changelog
app.post('/api/sources/test', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  try {
    const markdown = await fetchChangelog(url);
    const latest = parseLatestVersion(markdown);

    if (!latest) {
      res.json({
        valid: false,
        message: 'Could not parse version from this URL. Make sure it contains markdown with version headers like "## 1.0.0"',
      });
      return;
    }

    res.json({
      valid: true,
      latestVersion: latest.version,
      preview: latest.content.slice(0, 500) + (latest.content.length > 500 ? '...' : ''),
    });
  } catch (error) {
    res.json({
      valid: false,
      message: `Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

// Chat endpoint - Gemini-powered changelog assistant
app.post('/api/chat', async (req, res) => {
  if (!GEMINI_API_KEY) {
    res.status(500).json({ error: 'Gemini API key not configured' });
    return;
  }

  try {
    const { message, context, history = [] } = req.body;

    const systemPrompt = `You are a helpful assistant that answers questions about Claude Code changelog releases.
You have access to specific changelog versions that the user has selected.
Be concise but thorough. Use bullet points for lists.
If the user asks about something not in the provided context, say so.
Focus on practical implications for developers.

IMPORTANT FORMATTING RULES:
- NEVER use em dashes (—) or en dashes (–). Use regular hyphens (-) or colons (:) instead.
- Keep responses clean and readable.`;

    const contextSection = context
      ? `\n\n## Selected Changelog Versions:\n${context}\n\n---\n`
      : '\n\n(No specific versions selected - answering based on general knowledge)\n\n';

    const contents = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt + contextSection }],
          },
          contents,
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      res.status(500).json({ error: 'Failed to get response from Gemini' });
      return;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      res.status(500).json({ error: 'No response from Gemini' });
      return;
    }

    res.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat request failed' });
  }
});

// ============ Chat Persistence Endpoints ============

// Get all conversations
app.get('/api/conversations', (_req, res) => {
  const stmt = db.prepare(`
    SELECT c.id, c.title, c.created_at, c.updated_at,
           (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) as message_count
    FROM chat_conversations c
    ORDER BY c.updated_at DESC
  `);
  const conversations = stmt.all();
  res.json(conversations);
});

// Get a single conversation with messages
app.get('/api/conversations/:id', (req, res) => {
  const { id } = req.params;

  const convStmt = db.prepare('SELECT * FROM chat_conversations WHERE id = ?');
  const conversation = convStmt.get(id);

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const msgStmt = db.prepare('SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC');
  const messages = msgStmt.all(id);

  res.json({ ...conversation, messages });
});

// Create a new conversation
app.post('/api/conversations', (req, res) => {
  const { title } = req.body;
  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare('INSERT INTO chat_conversations (id, title) VALUES (?, ?)');
  stmt.run(id, title || 'New Conversation');

  res.json({ id, title: title || 'New Conversation' });
});

// Update conversation title
app.patch('/api/conversations/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  const stmt = db.prepare('UPDATE chat_conversations SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  stmt.run(title, id);

  res.json({ success: true });
});

// Delete a conversation
app.delete('/api/conversations/:id', (req, res) => {
  const { id } = req.params;

  db.prepare('DELETE FROM chat_messages WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM chat_conversations WHERE id = ?').run(id);

  res.json({ success: true });
});

// Add message to conversation
app.post('/api/conversations/:id/messages', (req, res) => {
  const { id: conversationId } = req.params;
  const { role, content, selectedVersions } = req.body;

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const stmt = db.prepare(`
    INSERT INTO chat_messages (id, conversation_id, role, content, selected_versions)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(msgId, conversationId, role, content, JSON.stringify(selectedVersions || []));

  // Update conversation timestamp
  db.prepare('UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);

  res.json({ id: msgId, role, content });
});

// ============ Analysis Cache Endpoints ============

// Get cached analysis for a version
app.get('/api/analysis/:version', (req, res) => {
  const { version } = req.params;

  const stmt = db.prepare('SELECT analysis_json, created_at FROM analysis_cache WHERE version = ?');
  const row = stmt.get(version) as { analysis_json: string; created_at: string } | undefined;

  if (row) {
    res.json({ analysis: JSON.parse(row.analysis_json), cached: true, cachedAt: row.created_at });
  } else {
    res.status(404).json({ error: 'Analysis not cached' });
  }
});

// Save analysis to cache
app.post('/api/analysis/:version', (req, res) => {
  const { version } = req.params;
  const { analysis } = req.body;

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO analysis_cache (version, analysis_json, created_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run(version, JSON.stringify(analysis));

  res.json({ success: true });
});

// Get all cached analyses
app.get('/api/analysis', (_req, res) => {
  const stmt = db.prepare('SELECT version, created_at FROM analysis_cache ORDER BY created_at DESC');
  const analyses = stmt.all();
  res.json(analyses);
});

// Email endpoint
interface ChangelogEmailRequest {
  version: string;
  tldr: string;
  categories: {
    critical_breaking_changes: string[];
    removals: { feature: string; severity: string; why: string }[];
    major_features: string[];
    important_fixes: string[];
    new_slash_commands: string[];
    terminal_improvements: string[];
    api_changes: string[];
  };
  action_items: string[];
  sentiment: string;
}

function generateEmailHtml(data: ChangelogEmailRequest): string {
  const { version, tldr, categories, action_items, sentiment } = data;

  const sentimentEmoji = sentiment === 'positive' ? '🎉' : sentiment === 'critical' ? '⚠️' : '📋';

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #d97706; }
    h2 { color: #374151; margin-top: 24px; }
    .tldr { background: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .section { margin-bottom: 20px; }
    .breaking { border-left: 4px solid #ef4444; padding-left: 12px; background: #fef2f2; padding: 12px; border-radius: 0 8px 8px 0; }
    .feature { border-left: 4px solid #14b8a6; padding-left: 12px; }
    .fix { border-left: 4px solid #6b7280; padding-left: 12px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
    .audio-note { background: #e0f2fe; padding: 12px; border-radius: 8px; margin-top: 16px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>${sentimentEmoji} Claude Code ${version} Released</h1>

  <div class="tldr">
    <strong>TL;DR:</strong> ${tldr}
  </div>
`;

  if (categories.critical_breaking_changes.length > 0) {
    html += `
  <div class="section breaking">
    <h2>🚨 Critical Breaking Changes</h2>
    <ul>
      ${categories.critical_breaking_changes.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  </div>
`;
  }

  if (categories.removals.length > 0) {
    html += `
  <div class="section">
    <h2>⚠️ Removals</h2>
    <ul>
      ${categories.removals.map((r) => `<li><strong>${r.feature}</strong> (${r.severity}): ${r.why}</li>`).join('')}
    </ul>
  </div>
`;
  }

  if (categories.major_features.length > 0) {
    html += `
  <div class="section feature">
    <h2>✨ Major Features</h2>
    <ul>
      ${categories.major_features.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  </div>
`;
  }

  if (categories.important_fixes.length > 0) {
    html += `
  <div class="section fix">
    <h2>🔧 Important Fixes</h2>
    <ul>
      ${categories.important_fixes.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  </div>
`;
  }

  if (action_items.length > 0) {
    html += `
  <div class="section">
    <h2>📋 Action Items</h2>
    <ul>
      ${action_items.map((item) => `<li>${item}</li>`).join('')}
    </ul>
  </div>
`;
  }

  html += `
  <div class="audio-note">
    🎧 <strong>Audio summary attached!</strong> Listen to the changelog summary on the go.
  </div>

  <div class="footer">
    <p>This email was automatically sent by Claude Code Changelog Tracker</p>
  </div>
</body>
</html>
`;

  return html;
}

app.post('/api/send-changelog', async (req, res) => {
  if (!RESEND_API_KEY || !NOTIFY_EMAIL) {
    console.error('Missing RESEND_API_KEY or NOTIFY_EMAIL environment variables');
    res.status(500).json({ success: false, error: 'Email configuration missing' });
    return;
  }

  try {
    const data = req.body as ChangelogEmailRequest;
    const html = generateEmailHtml(data);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Changelog Tracker <onboarding@resend.dev>',
        to: [NOTIFY_EMAIL],
        subject: `Claude Code ${data.version} Released`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      res.status(500).json({ success: false, error: 'Failed to send email' });
      return;
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    res.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// ============ KB Update Endpoints ============

// Ingest a URL (web page or YouTube)
app.post('/api/kb/ingest', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  // ── DEDUP LAYER 1: URL already ingested? ──
  const normalizedUrl = url.replace(/[&?]list=.*/, '').replace(/[&?]index=.*/, '').replace(/\/$/, '');
  const existingIngestion = db.prepare(
    `SELECT id, status, updates_generated FROM ingestion_log 
     WHERE (url = ? OR url LIKE ? || '%' OR ? LIKE url || '%') 
     AND status = 'complete' AND updates_generated > 0`
  ).get(normalizedUrl, normalizedUrl, normalizedUrl) as { id: string; status: string; updates_generated: number } | undefined;

  if (existingIngestion) {
    res.status(409).json({ 
      error: `This URL was already ingested (${existingIngestion.updates_generated} updates generated). Use a different source or delete the previous ingestion first.`,
      existing_id: existingIngestion.id
    });
    return;
  }

  const ingestionId = `ing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const sourceType = isYouTube ? 'youtube' : 'url';

  // Log the ingestion
  db.prepare('INSERT INTO ingestion_log (id, url, source_type, status) VALUES (?, ?, ?, ?)')
    .run(ingestionId, normalizedUrl, sourceType, 'processing');

  try {
    // 1. Ingest content
    console.log(`[KB] Ingesting ${sourceType}: ${url}`);
    const result = isYouTube ? await ingestYouTube(url) : await ingestURL(url);

    db.prepare('UPDATE ingestion_log SET title = ? WHERE id = ?').run(result.title, ingestionId);

    // 2 & 3. Map & Generate Updates
    const { updates, skipped } = await processKBUpdates(result.content, result.title || 'Unknown Title', sourceType, url, ingestionId);

    const message = skipped > 0 
      ? `${updates} new update(s), ${skipped} skipped (already have pending updates)`
      : undefined;

    res.json({ success: true, id: ingestionId, updates, skipped, message });
  } catch (error) {
    console.error('[KB] Ingestion error:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    db.prepare('UPDATE ingestion_log SET status = ?, error = ? WHERE id = ?')
      .run('error', errMsg, ingestionId);
    res.status(500).json({ error: errMsg });
  }
});

// List all KB updates
app.get('/api/kb/updates', (req, res) => {
  const status = req.query.status as string | undefined;
  let stmt;
  if (status) {
    stmt = db.prepare('SELECT id, file_path, file_name, source_type, source_url, source_title, change_summary, status, created_at FROM kb_updates WHERE status = ? ORDER BY created_at DESC');
    res.json(stmt.all(status));
  } else {
    stmt = db.prepare('SELECT id, file_path, file_name, source_type, source_url, source_title, change_summary, status, created_at FROM kb_updates ORDER BY created_at DESC');
    res.json(stmt.all());
  }
});

// Get a specific KB update with full content
app.get('/api/kb/updates/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('SELECT * FROM kb_updates WHERE id = ?');
  const update = stmt.get(id);

  if (!update) {
    res.status(404).json({ error: 'Update not found' });
    return;
  }

  res.json(update);
});

// Approve/reject/edit a KB update
app.patch('/api/kb/updates/:id', (req, res) => {
  const { id } = req.params;
  const { status, updated_content } = req.body;

  if (status && !['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Must be: pending, approved, or rejected' });
    return;
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (updated_content) {
    updates.push('updated_content = ?');
    values.push(updated_content);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No updates provided' });
    return;
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE kb_updates SET ${updates.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Update not found' });
    return;
  }

  res.json({ success: true });
});

// Resuable process function for KB updates (C1 auto-heartbeat & manual ingest)
async function processKBUpdates(
  content: string,
  title: string,
  sourceType: string,
  sourceUrl: string,
  ingestionId?: string
): Promise<{ updates: number; skipped: number }> {
  console.log(`[KB] Mapping to KB files for ${sourceUrl}...`);
  const mappings = await mapToKBFiles(content, title, sourceType);

  let updatesGenerated = 0;
  let skippedDuplicates = 0;

  if (mappings.length === 0) {
    if (ingestionId) {
      db.prepare('UPDATE ingestion_log SET status = ?, updates_generated = 0 WHERE id = ?')
        .run('complete', ingestionId);
    }
    return { updates: 0, skipped: 0 };
  }

  const normalizedUrl = sourceUrl.replace(/[&?]list=.*/, '').replace(/[&?]index=.*/, '').replace(/\/$/, '');

  for (const mapping of mappings) {
    try {
      const existingFileUpdate = db.prepare(
        `SELECT id, change_summary FROM kb_updates 
         WHERE file_path = ? AND status IN ('pending', 'approved')
         ORDER BY created_at DESC LIMIT 1`
      ).get(mapping.file_path) as { id: string; change_summary: string } | undefined;

      if (existingFileUpdate) {
        console.log(`[KB] Skipping ${mapping.file_path} — already has a pending/approved update (${existingFileUpdate.id})`);
        skippedDuplicates++;
        continue;
      }

      const latestApplied = db.prepare(
        `SELECT updated_content FROM kb_updates 
         WHERE file_path = ? AND status = 'applied' 
         ORDER BY created_at DESC LIMIT 1`
      ).get(mapping.file_path) as { updated_content: string } | undefined;

      const snapshot = db.prepare('SELECT content FROM kb_snapshots WHERE file_path = ?')
        .get(mapping.file_path) as { content: string } | undefined;

      const currentContent = latestApplied?.updated_content || snapshot?.content;

      if (!currentContent) {
        console.log(`[KB] No snapshot for ${mapping.file_path}, skipping (run sync first)`);
        continue;
      }

      console.log(`[KB] Generating update for ${mapping.file_path}...`);
      const update = await generateKBUpdate(
        mapping.file_path,
        currentContent,
        content,
        mapping.changes_needed
      );

      if (update.updatedContent.trim() === currentContent.trim()) {
        console.log(`[KB] Skipping ${mapping.file_path} — generated content is identical to current`);
        skippedDuplicates++;
        continue;
      }

      const updateId = `upd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = mapping.file_path.split('/').pop() || mapping.file_path;

      db.prepare(`
        INSERT INTO kb_updates (id, file_path, file_name, source_type, source_url, source_title, original_content, updated_content, change_summary, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(updateId, mapping.file_path, fileName, sourceType, normalizedUrl, title, currentContent, update.updatedContent, update.summary);

      updatesGenerated++;
    } catch (err) {
      console.error(`[KB] Failed to generate update for ${mapping.file_path}:`, err);
    }
  }

  if (ingestionId) {
    db.prepare('UPDATE ingestion_log SET status = ?, updates_generated = ? WHERE id = ?')
      .run('complete', updatesGenerated, ingestionId);
  }

  return { updates: updatesGenerated, skipped: skippedDuplicates };
}

// Delete a KB update
app.delete('/api/kb/updates/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM kb_updates WHERE id = ?');
  const result = stmt.run(id);
  res.json({ success: true, deleted: result.changes });
});

// Apply a KB update directly: Approve → Write to local file → Mark as applied
app.post('/api/kb/apply/:id', (req, res) => {
  const { id } = req.params;
  
  const update = db.prepare('SELECT * FROM kb_updates WHERE id = ?').get(id) as {
    id: string; file_path: string; file_name: string; updated_content: string; status: string;
  } | undefined;

  if (!update) {
    res.status(404).json({ error: 'Update not found' });
    return;
  }

  if (update.status === 'applied') {
    res.status(400).json({ error: 'Update already applied' });
    return;
  }

  try {
    // Resolve the KB base path — server runs from .gemini/changelog-master/
    // brain/ is at ../brain/ (sibling directory)
    const cwd = process.cwd();
    const kbCandidates = [
      path.resolve(cwd, '..', 'brain'),                              // .gemini/brain (sibling)
    ];
    
    let kbBasePath: string | null = null;
    for (const candidate of kbCandidates) {
      if (fs.existsSync(candidate)) {
        kbBasePath = candidate;
        break;
      }
    }

    if (!kbBasePath) {
      res.status(500).json({ error: 'KB directory not found. Run sync-kb.ts --push first.' });
      return;
    }

    // Resolve target file path
    let targetPath: string;
    if (update.file_path === 'GEMINI.md') {
      targetPath = path.resolve(kbBasePath, '..', '..', 'GEMINI.md');
    } else {
      targetPath = path.join(kbBasePath, update.file_path);
    }

    // Ensure directory exists
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write the file
    fs.writeFileSync(targetPath, update.updated_content, 'utf-8');

    // Mark as applied in DB
    db.prepare('UPDATE kb_updates SET status = ?, applied_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('applied', id);

    // Update snapshot so future ingestions see the latest content
    db.prepare('INSERT OR REPLACE INTO kb_snapshots (file_path, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
      .run(update.file_path, update.updated_content);

    console.log(`[KB] ✅ Applied update ${id} → ${targetPath}`);
    res.json({ success: true, file: update.file_name, path: targetPath });
  } catch (err) {
    console.error(`[KB] Failed to apply update ${id}:`, err);
    res.status(500).json({ error: `Failed to write file: ${err instanceof Error ? err.message : 'Unknown error'}` });
  }
});

// B1: KB Freshness endpoint — how up-to-date is the knowledge base?
app.get('/api/kb/freshness', (_req, res) => {
  try {
    const lastApplied = db.prepare(
      'SELECT applied_at FROM kb_updates WHERE status = ? ORDER BY applied_at DESC LIMIT 1'
    ).get('applied') as { applied_at: string } | undefined;

    const totalApplied = (db.prepare(
      'SELECT COUNT(*) as count FROM kb_updates WHERE status = ?'
    ).get('applied') as { count: number })?.count || 0;

    let daysSinceUpdate = 999;
    if (lastApplied?.applied_at) {
      const lastDate = new Date(lastApplied.applied_at);
      const now = new Date();
      daysSinceUpdate = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    let healthStatus: 'fresh' | 'aging' | 'stale';
    if (totalApplied === 0) healthStatus = 'stale';
    else if (daysSinceUpdate <= 7) healthStatus = 'fresh';
    else if (daysSinceUpdate <= 21) healthStatus = 'aging';
    else healthStatus = 'stale';

    res.json({
      lastApplied: lastApplied?.applied_at || null,
      daysSinceUpdate,
      totalApplied,
      healthStatus,
    });
  } catch (err) {
    console.error('[KB] Freshness check failed:', err);
    res.status(500).json({ error: 'Failed to check freshness' });
  }
});

// B3: Push Snapshot UI — Git Commit & Push for the `.gemini/` changes
app.post('/api/kb/push', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const path = require('path');
    const execAsync = util.promisify(exec);
    
    // The drop_project repository root is two levels up from server/.gemini/changelog-master
    const repoPath = path.resolve(__dirname, '../../../');
    console.log(`[KB Push] Running git operations in ${repoPath}`);
    
    // 1. Stage only the .gemini folder to avoid committing user's other files
    await execAsync('git add .gemini', { cwd: repoPath });
    
    // 2. Commit
    let commitMessage = '';
    try {
      const { stdout } = await execAsync('git commit -m "chore(kb): update knowledge base via Changelog Master"', { cwd: repoPath });
      commitMessage = stdout;
      console.log(`[KB Push] Commit successful: ${stdout}`);
    } catch (commitError: any) {
      if (commitError.stdout && (commitError.stdout.includes('nothing to commit') || commitError.stdout.includes('clean'))) {
         console.log(`[KB Push] Nothing to commit. Proceeding to push anyway just in case.`);
      } else {
         throw commitError;
      }
    }
    
    // 3. Push
    console.log(`[KB Push] Pushing to remote...`);
    const { stdout: pushOut, stderr: pushErr } = await execAsync('git push', { cwd: repoPath });
    console.log(`[KB Push] Push successful: ${pushOut} ${pushErr}`);
    
    res.json({ 
      success: true, 
      message: commitMessage ? 'Successfully committed and pushed KB updates!' : 'No new changes to commit, but push check completed.',
      details: { commit: commitMessage, push: pushOut || pushErr }
    });
  } catch (err: any) {
    console.error('[KB Push] Git operation failed:', err);
    res.status(500).json({ 
      error: 'Failed to push to repository', 
      details: err.stderr || err.message || String(err)
    });
  }
});

// B2: Undo an applied update — restore original content
app.post('/api/kb/undo/:id', (req, res) => {
  const { id } = req.params;

  const update = db.prepare('SELECT * FROM kb_updates WHERE id = ?').get(id) as {
    id: string; file_path: string; file_name: string; original_content: string; status: string;
  } | undefined;

  if (!update) {
    res.status(404).json({ error: 'Update not found' });
    return;
  }

  if (update.status !== 'applied') {
    res.status(400).json({ error: 'Only applied updates can be undone' });
    return;
  }

  try {
    const cwd = process.cwd();
    const kbCandidates = [
      path.resolve(cwd, '..', 'brain'),
    ];

    let kbBasePath: string | null = null;
    for (const candidate of kbCandidates) {
      if (fs.existsSync(candidate)) {
        kbBasePath = candidate;
        break;
      }
    }

    if (!kbBasePath) {
      res.status(500).json({ error: 'KB directory not found' });
      return;
    }

    let targetPath: string;
    if (update.file_path === 'GEMINI.md') {
      targetPath = path.resolve(kbBasePath, '..', '..', 'GEMINI.md');
    } else {
      targetPath = path.join(kbBasePath, update.file_path);
    }

    // Restore original content
    fs.writeFileSync(targetPath, update.original_content, 'utf-8');

    // Revert status to pending
    db.prepare('UPDATE kb_updates SET status = ?, applied_at = NULL WHERE id = ?')
      .run('pending', id);

    // Update snapshot back to original
    db.prepare('INSERT OR REPLACE INTO kb_snapshots (file_path, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
      .run(update.file_path, update.original_content);

    console.log(`[KB] ↩️ Undone update ${id} → ${targetPath}`);
    res.json({ success: true, file: update.file_name, path: targetPath });
  } catch (err) {
    console.error(`[KB] Failed to undo update ${id}:`, err);
    res.status(500).json({ error: `Failed to undo: ${err instanceof Error ? err.message : 'Unknown error'}` });
  }
});

// Upload KB snapshots (current file contents from local)
app.post('/api/kb/snapshot', (req, res) => {
  const { files } = req.body;

  if (!files || !Array.isArray(files)) {
    res.status(400).json({ error: 'files array is required: [{file_path, content}]' });
    return;
  }

  const stmt = db.prepare('INSERT OR REPLACE INTO kb_snapshots (file_path, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
  const insertMany = db.transaction((items: { file_path: string; content: string }[]) => {
    for (const item of items) {
      stmt.run(item.file_path, item.content);
    }
  });

  insertMany(files);
  res.json({ success: true, count: files.length });
});

// Get KB snapshots
app.get('/api/kb/snapshots', (_req, res) => {
  const stmt = db.prepare('SELECT file_path, updated_at, LENGTH(content) as size FROM kb_snapshots ORDER BY file_path');
  res.json(stmt.all());
});

// Sync endpoint: Get approved updates for local application
app.get('/api/kb/sync', (_req, res) => {
  const stmt = db.prepare('SELECT * FROM kb_updates WHERE status = ? ORDER BY created_at ASC');
  const updates = stmt.all('approved');
  res.json(updates);
});

// Confirm sync: Mark updates as applied and update snapshots
app.post('/api/kb/sync/confirm', (req, res) => {
  const { update_ids } = req.body;

  if (!update_ids || !Array.isArray(update_ids)) {
    res.status(400).json({ error: 'update_ids array is required' });
    return;
  }

  const markApplied = db.prepare('UPDATE kb_updates SET status = ?, applied_at = CURRENT_TIMESTAMP WHERE id = ?');
  const getUpdate = db.prepare('SELECT file_path, updated_content FROM kb_updates WHERE id = ?');
  const updateSnapshot = db.prepare('INSERT OR REPLACE INTO kb_snapshots (file_path, content, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
  
  const confirmMany = db.transaction((ids: string[]) => {
    for (const id of ids) {
      markApplied.run('applied', id);
      // Also update the snapshot so future ingestions use the latest content
      const update = getUpdate.get(id) as { file_path: string; updated_content: string } | undefined;
      if (update) {
        updateSnapshot.run(update.file_path, update.updated_content);
      }
    }
  });

  confirmMany(update_ids);
  res.json({ success: true, count: update_ids.length });
});

// Get ingestion history
app.get('/api/kb/ingestions', (_req, res) => {
  const stmt = db.prepare('SELECT * FROM ingestion_log ORDER BY created_at DESC LIMIT 50');
  res.json(stmt.all());
});

// KB stats
app.get('/api/kb/stats', (_req, res) => {
  const pending = (db.prepare('SELECT COUNT(*) as count FROM kb_updates WHERE status = ?').get('pending') as { count: number }).count;
  const approved = (db.prepare('SELECT COUNT(*) as count FROM kb_updates WHERE status = ?').get('approved') as { count: number }).count;
  const applied = (db.prepare('SELECT COUNT(*) as count FROM kb_updates WHERE status = ?').get('applied') as { count: number }).count;
  const rejected = (db.prepare('SELECT COUNT(*) as count FROM kb_updates WHERE status = ?').get('rejected') as { count: number }).count;
  const snapshots = (db.prepare('SELECT COUNT(*) as count FROM kb_snapshots').get() as { count: number }).count;

  res.json({ pending, approved, applied, rejected, snapshots });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: ${dbPath}`);

  // Initialize monitoring from saved settings
  const enabledRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('emailNotificationsEnabled') as { value: string } | undefined;
  const intervalRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('notificationCheckInterval') as { value: string } | undefined;

  const enabled = enabledRow?.value === 'true';
  const interval = parseInt(intervalRow?.value || '0') || 0;

  if (enabled && interval > 0) {
    startMonitoring(interval);
  }
});
