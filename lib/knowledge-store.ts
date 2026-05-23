import { KnowledgeCard } from "@/types";

const RAGIE_BASE_URL = "https://api.ragie.ai";

function getApiKey(): string {
  const apiKey = process.env.RAGIE_API_KEY;
  if (!apiKey) throw new Error("RAGIE_API_KEY is not configured");
  return apiKey;
}

/**
 * Save a KnowledgeCard by storing it as metadata on the Ragie document.
 * This persists across Vercel serverless cold starts because Ragie IS the store.
 */
export async function saveKnowledgeCard(card: KnowledgeCard): Promise<void> {
  const res = await fetch(`${RAGIE_BASE_URL}/documents/${card.documentId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      metadata: {
        knowledgeCard: JSON.stringify(card),
      },
    }),
  });

  if (!res.ok) {
    // Non-critical: log but don't crash the upload
    console.error(`Failed to save knowledge card to Ragie metadata: ${res.status}`);
  }
}

/**
 * Get a KnowledgeCard by its ID. Scans all documents' metadata.
 * For the hackathon this is fine — small number of documents.
 */
export async function getKnowledgeCard(id: string): Promise<KnowledgeCard | null> {
  const cards = await getAllKnowledgeCards();
  return cards.find((c) => c.id === id) ?? null;
}

/**
 * Get a KnowledgeCard by its Ragie document ID.
 */
export async function getKnowledgeCardByDocumentId(documentId: string): Promise<KnowledgeCard | null> {
  try {
    const res = await fetch(`${RAGIE_BASE_URL}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });
    if (!res.ok) return null;
    const doc = await res.json();
    const cardJson = doc.metadata?.knowledgeCard;
    if (!cardJson) return null;
    return JSON.parse(cardJson) as KnowledgeCard;
  } catch {
    return null;
  }
}

/**
 * Get all KnowledgeCards from all Ragie documents' metadata.
 */
export async function getAllKnowledgeCards(): Promise<KnowledgeCard[]> {
  try {
    const res = await fetch(`${RAGIE_BASE_URL}/documents?page_size=50`, {
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const docs = data.documents ?? [];

    const cards: KnowledgeCard[] = [];
    for (const doc of docs) {
      const cardJson = doc.metadata?.knowledgeCard;
      if (cardJson) {
        try {
          cards.push(JSON.parse(cardJson) as KnowledgeCard);
        } catch {
          // corrupted metadata — skip
        }
      }
    }
    return cards;
  } catch {
    return [];
  }
}

/**
 * Delete a KnowledgeCard by clearing it from document metadata.
 */
export async function deleteKnowledgeCardByDocumentId(documentId: string): Promise<void> {
  try {
    await fetch(`${RAGIE_BASE_URL}/documents/${documentId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        metadata: { knowledgeCard: null },
      }),
    });
  } catch {
    // best-effort
  }
}
