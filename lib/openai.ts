import OpenAI from "openai";
import { KnowledgeCard, QueryResult } from "@/types";
import { RagieChunk } from "./ragie";

function getClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function generateAnswer(
  question: string,
  chunks: RagieChunk[]
): Promise<QueryResult> {
  const client = getClient();
  const startMs = Date.now();

  const contextBlocks = chunks.map((c, i) => {
    const source = `[Source ${i + 1}: ${c.document_name}]`;
    return `${source}\n${c.text}`;
  });

  const systemPrompt = `You are a precise Technical Assistant for mechanical engineers.
You answer questions exclusively based on the provided source documents.
Always respond in English.
ALWAYS include source references (file name). If multiple sources are relevant, cite all of them.
If timestamps are present (e.g. "00:03:45"), mention them explicitly.
If the answer cannot be determined from the sources, state that clearly.`;

  const userPrompt = `Context Documents:
${contextBlocks.join("\n\n---\n\n")}

Question: ${question}

Answer the question precisely and cite the relevant sources.`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  });

  const answer = response.choices[0]?.message?.content ?? "No answer generated.";

  const sources = chunks.map((c) => ({
    documentId: c.document_id,
    documentName: c.document_name,
    score: c.score,
    text: c.text.slice(0, 300),
    timestamp: extractTimestamp(c.text),
  }));

  return {
    answer,
    sources,
    durationMs: Date.now() - startMs,
  };
}

function extractTimestamp(text: string): string | undefined {
  // Match patterns like 00:03:45 or 3:45 in the chunk text
  const match = text.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/);
  return match?.[1];
}

export async function generateKnowledgeCard(
  documentName: string,
  chunks: RagieChunk[]
): Promise<Omit<KnowledgeCard, "id" | "documentId" | "documentName" | "createdAt">> {
  const client = getClient();

  const sampleText = chunks
    .slice(0, 8)
    .map((c) => c.text)
    .join("\n\n---\n\n");

  const prompt = `Analyze the following document "${documentName}" and create a structured knowledge card.

Document content (excerpts):
${sampleText}

Create a JSON response with the following structure (in English):
{
  "summary": "A concise summary in 2-3 sentences",
  "mainTopics": ["Main topic 1", "Main topic 2", "..."],
  "typicalProblems": ["Typical problem 1", "Typical problem 2", "..."],
  "safetyNotes": ["Safety note 1", "Safety note 2", "..."]
}

Rules:
- mainTopics: 3-6 main topics
- typicalProblems: 2-5 typical problems or failure cases covered in the document
- safetyNotes: 1-4 important safety notes (if present, otherwise empty array)
- Respond ONLY with the JSON object, no additional text`;

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary ?? "Summary not available.",
      mainTopics: parsed.mainTopics ?? [],
      typicalProblems: parsed.typicalProblems ?? [],
      safetyNotes: parsed.safetyNotes ?? [],
    };
  } catch {
    return {
      summary: "Summary could not be generated.",
      mainTopics: [],
      typicalProblems: [],
      safetyNotes: [],
    };
  }
}
