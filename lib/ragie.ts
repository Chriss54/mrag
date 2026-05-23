import { RagieDocument } from "@/types";

const RAGIE_BASE_URL = "https://api.ragie.ai";

function getHeaders() {
  const apiKey = process.env.RAGIE_API_KEY;
  if (!apiKey) throw new Error("RAGIE_API_KEY is not configured");
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}

/**
 * Detect the correct Ragie processing mode based on file type.
 * - Media files (video/audio): use "all" — processes all media at highest quality
 * - Text/PDF files: use "hi_res" for tables/images extraction
 *
 * We use "all" for media instead of specific modes because Ragie's internal
 * content detection can disagree with browser MIME types (e.g. an MP3 being
 * identified as video/mp4 internally). "all" handles every media type safely.
 */
function getRagieMode(file: File): string {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  const isMedia =
    type.startsWith("video/") ||
    type.startsWith("audio/") ||
    name.endsWith(".mp4") ||
    name.endsWith(".mp3") ||
    name.endsWith(".wav") ||
    name.endsWith(".m4a") ||
    name.endsWith(".ogg");

  if (isMedia) {
    return "all";
  }
  // PDFs and other text documents — hi_res extracts tables + images
  return "hi_res";
}

export async function uploadToRagie(
  file: File,
  metadata?: Record<string, unknown>
): Promise<RagieDocument> {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata) {
    formData.append("metadata", JSON.stringify(metadata));
  }
  formData.append("partition", "default");
  formData.append("mode", getRagieMode(file));

  const res = await fetch(`${RAGIE_BASE_URL}/documents`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ragie upload failed: ${res.status} — ${err}`);
  }

  return res.json();
}

export async function getRagieDocument(id: string): Promise<RagieDocument> {
  const res = await fetch(`${RAGIE_BASE_URL}/documents/${id}`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error(`Ragie get document failed: ${res.status}`);
  return res.json();
}

export async function listRagieDocuments(): Promise<RagieDocument[]> {
  const res = await fetch(`${RAGIE_BASE_URL}/documents?page_size=50`, {
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error(`Ragie list documents failed: ${res.status}`);
  const data = await res.json();
  return data.documents ?? [];
}

export async function deleteRagieDocument(id: string): Promise<void> {
  const res = await fetch(`${RAGIE_BASE_URL}/documents/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (!res.ok) throw new Error(`Ragie delete failed: ${res.status}`);
}

export interface RagieChunk {
  text: string;
  document_id: string;
  document_name: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export async function retrieveFromRagie(
  query: string,
  documentId?: string
): Promise<RagieChunk[]> {
  const body: Record<string, unknown> = {
    query,
    top_k: 6,
    partition: "default",
  };

  if (documentId) {
    body.filter = { document_id: documentId };
  }

  const res = await fetch(`${RAGIE_BASE_URL}/retrievals`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ragie retrieval failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.scored_chunks ?? [];
}
