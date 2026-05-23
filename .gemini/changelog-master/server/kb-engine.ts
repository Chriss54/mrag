/**
 * KB Update Engine — Core AI pipeline for knowledge base updates.
 * 
 * Responsibilities:
 * 1. Ingest content from URLs and YouTube
 * 2. Map new information to affected KB files
 * 3. Generate updated file content with diffs
 */

import { getKBSchemaForPrompt, findRelevantFiles, type KBFileSchema } from './kb-schema.js';

// youtube-transcript has ESM export issues, use dynamic import
async function getYoutubeTranscript() {
  const mod = await import('youtube-transcript');
  return (mod as any).YoutubeTranscript || (mod as any).default?.YoutubeTranscript || mod;
}

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';

// ============ Types ============

export interface KBUpdate {
  id: string;
  file_path: string;
  file_name: string;
  source_type: 'changelog' | 'url' | 'youtube';
  source_url: string;
  source_title: string;
  original_content: string;
  updated_content: string;
  change_summary: string;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  created_at: string;
}

export interface IngestionResult {
  title: string;
  content: string;
  source_type: 'url' | 'youtube';
}

export interface KBMapping {
  file_path: string;
  relevance: string;
  changes_needed: string;
}

// ============ Content Ingestion ============

/**
 * Fetch and extract content from a web page URL.
 */
export async function ingestURL(url: string): Promise<IngestionResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; KBUpdater/1.0)',
      'Accept': 'text/html,application/xhtml+xml,text/markdown,text/plain',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  // If it's already markdown or plain text, use directly
  if (contentType.includes('text/markdown') || contentType.includes('text/plain') || url.endsWith('.md')) {
    return {
      title: extractTitleFromMarkdown(rawText) || new URL(url).pathname.split('/').pop() || 'Untitled',
      content: rawText,
      source_type: 'url',
    };
  }

  // For HTML, use Gemini to extract the meaningful content
  const extracted = await extractContentWithAI(rawText, url);
  return {
    title: extracted.title,
    content: extracted.content,
    source_type: 'url',
  };
}

/**
 * Extract YouTube transcript using youtube-transcript library.
 * Falls back to page title + description if no captions available.
 */
export async function ingestYouTube(url: string): Promise<IngestionResult> {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  // Get video title from oEmbed API (reliable, no scraping needed)
  let videoTitle = `YouTube Video: ${videoId}`;
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      videoTitle = oembedData.title || videoTitle;
    }
  } catch { /* fallback to ID-based title */ }

  // Try fetching transcript via youtube-transcript library
  let transcript: string;
  try {
    const YT = await getYoutubeTranscript();
    const transcriptItems = await YT.fetchTranscript(videoId);
    
    if (transcriptItems && transcriptItems.length > 0) {
      transcript = transcriptItems
        .map((item: any) => item.text.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
        .join(' ');
      
      console.log(`[KB Engine] YouTube transcript extracted: ${transcriptItems.length} segments, ${transcript.length} chars`);
    } else {
      transcript = await fallbackVideoContent(videoId, videoTitle);
    }
  } catch (err) {
    console.log(`[KB Engine] youtube-transcript failed: ${err instanceof Error ? err.message : 'Unknown'}, using fallback`);
    transcript = await fallbackVideoContent(videoId, videoTitle);
  }

  return {
    title: videoTitle,
    content: `Video Title: ${videoTitle}\n\nTranscript:\n${transcript}`,
    source_type: 'youtube',
  };
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Fallback: extract title + description from YouTube page when transcript is unavailable.
 */
async function fallbackVideoContent(videoId: string, knownTitle: string): Promise<string> {
  try {
    const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
    });
    
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      const descMatch = html.match(/"shortDescription":"(.*?)"/);
      const desc = descMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || '';
      
      if (desc) {
        return `${desc}\n\n[Note: Full transcript could not be extracted. Content is from video description only.]`;
      }
    }
  } catch { /* ignore fallback errors */ }

  return `[No transcript or description available for video: ${knownTitle}]`;
}

// ============ AI Processing ============

/**
 * Extract meaningful content from HTML using Gemini.
 */
async function extractContentWithAI(html: string, url: string): Promise<{ title: string; content: string }> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  // Truncate HTML to avoid token limits
  const truncatedHtml = html.slice(0, 50000);

  const prompt = `Extract the main content from this HTML page. Return JSON:
{
  "title": "page title",
  "content": "the main article/documentation content in clean markdown format. Remove navigation, footers, ads, etc. Keep code examples, lists, and formatting."
}

URL: ${url}
HTML (truncated):
${truncatedHtml}`;

  const data = await callGemini(prompt, true);
  return JSON.parse(data);
}

/**
 * Map ingested content to affected KB files.
 * Returns which files need updating and what changes are needed.
 */
export async function mapToKBFiles(
  content: string,
  sourceTitle: string,
  sourceType: string
): Promise<KBMapping[]> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  // Pre-filter with keywords for context
  const relevantFiles = findRelevantFiles(content);
  const preFilterNote = relevantFiles.length > 0
    ? `\nPre-filter suggests these files might be relevant: ${relevantFiles.map(f => f.path).join(', ')}`
    : '';

  const schema = getKBSchemaForPrompt();

  const prompt = `You are a knowledge base curator for a Claude Code teaching tool. 
Given new information from a ${sourceType} source titled "${sourceTitle}", determine which knowledge base files need to be updated.
${preFilterNote}

## Knowledge Base File Schema:
${schema}

## New Information:
${content.slice(0, 15000)}

## Task:
Analyze the new information and return JSON array of affected files:
[
  {
    "file_path": "exact path from schema above",
    "relevance": "high|medium|low",
    "changes_needed": "Brief description of what needs to be added/updated in this file"
  }
]

Rules:
- Only include files that genuinely need updates based on the new information
- If the information is about a new slash command → 02-tools-and-commands.md
- If it's about a new feature/concept → relevant topic file
- If it changes how something works → the file that documents that thing
- Prefer updating existing files over suggesting new ones
- Return an empty array [] if the information doesn't warrant any KB updates
- The GEMINI.md (system prompt) should ONLY be updated if there's a fundamental change to how Claude Code works that affects the teaching approach`;

  const data = await callGemini(prompt, true);
  return JSON.parse(data);
}

/**
 * Generate updated file content for a specific KB file.
 * Returns the full updated file content.
 */
export async function generateKBUpdate(
  filePath: string,
  currentContent: string,
  newInformation: string,
  changeSummary: string
): Promise<{ updatedContent: string; summary: string }> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const today = new Date().toISOString().split('T')[0];

  const prompt = `You are updating a knowledge base file for a Claude Code teaching tool.

## File: ${filePath}

## Current Content:
${currentContent}

## New Information to Integrate:
${newInformation.slice(0, 10000)}

## What Needs to Change:
${changeSummary}

## Task:
Return JSON with the updated file and a summary:
{
  "updatedContent": "The COMPLETE updated file content. Integrate the new information naturally into the existing structure. Update the 'Last verified' date to ${today}. Keep the same formatting style, language mix (German analogies, English technical terms), and cross-references. Do NOT remove existing content unless it's explicitly contradicted by the new information. ADD new entries to existing tables/lists where appropriate.",
  "summary": "2-3 sentence summary of what was changed"
}

Rules:
- PRESERVE the existing file structure and style
- UPDATE the versioning header date to ${today}
- ADD new information in the appropriate section
- If a new section is needed, add it in a logical position
- Keep German analogy/intro paragraphs (the blockquote at the top) unchanged unless the fundamental concept changed
- Cross-references (🔗 Verwandte Konzepte) should be updated if new connections exist
- Tables should maintain their format — add new rows, don't restructure`;

  const data = await callGemini(prompt, true);
  return JSON.parse(data);
}

/**
 * Generate updates from a changelog analysis result.
 * This bridges changelog-master's existing analysis with the KB update pipeline.
 */
export async function generateUpdatesFromChangelog(
  changelogVersion: string,
  analysisJson: string,
  changelogContent: string
): Promise<KBMapping[]> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const schema = getKBSchemaForPrompt();

  const prompt = `You are updating a Claude Code teaching tool's knowledge base based on a new Claude Code release.

## Claude Code Version: ${changelogVersion}

## Changelog Analysis (structured):
${analysisJson}

## Raw Changelog Content:
${changelogContent.slice(0, 10000)}

## Knowledge Base Schema:
${schema}

## Task:
Determine which KB files need updates based on this release. Return JSON array:
[
  {
    "file_path": "exact path from schema",
    "relevance": "high|medium|low", 
    "changes_needed": "Specific description: what to add, update, or modify"
  }
]

Focus on:
- New slash commands → 02-tools-and-commands.md
- New tools → 02-tools-and-commands.md
- Configuration changes → 03-configuration.md
- New hook events → 05-advanced-patterns.md
- MCP changes → 07-mcp-servers.md
- Agent/team changes → 08-agents-and-teams.md
- Plugin/extension changes → 09-plugins-and-extensions.md
- Breaking changes that affect any topic → that topic's file
- Template changes only if command/skill/agent/rule syntax changed
- GEMINI.md only if there are fundamental workflow changes`;

  const data = await callGemini(prompt, true);
  return JSON.parse(data);
}

// ============ Utility ============

async function callGemini(prompt: string, jsonResponse: boolean = false): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        ...(jsonResponse && { responseMimeType: 'application/json' }),
        temperature: 0.3, // Lower temperature for more consistent KB updates
        maxOutputTokens: 65536,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('No response from Gemini API');

  return text;
}

function extractTitleFromMarkdown(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)/m);
  return match ? match[1].trim() : null;
}
