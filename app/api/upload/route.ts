import { NextRequest, NextResponse } from "next/server";
import { uploadToRagie, retrieveFromRagie, getRagieDocument } from "@/lib/ragie";
import { generateKnowledgeCard } from "@/lib/openai";
import { saveKnowledgeCard } from "@/lib/knowledge-store";
import { KnowledgeCard, UploadResponse } from "@/types";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/m4a",
  "audio/ogg",
];
const MAX_SIZE_PDF = 50 * 1024 * 1024;
const MAX_SIZE_MEDIA = 200 * 1024 * 1024;

// Next.js App Router Route Segment Config — extend timeout for large media uploads
export const maxDuration = 10; // Vercel Hobby max is 10s

function isMediaFile(file: File): boolean {
  return (
    file.type.startsWith("video/") ||
    file.type.startsWith("audio/") ||
    /\.(mp4|mp3|wav|m4a|ogg)$/i.test(file.name)
  );
}

async function waitForIndexing(documentId: string, maxWaitMs = 7000): Promise<boolean> {
  const readyStatuses = ["indexed", "ready"];
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const doc = await getRagieDocument(documentId);
      if (readyStatuses.includes(doc.status)) return true;
      if (doc.status === "failed") return false;
    } catch {
      // transient error — keep polling
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const media = isMediaFile(file);
    const maxSize = media ? MAX_SIZE_MEDIA : MAX_SIZE_PDF;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${maxSize / 1024 / 1024} MB for ${media ? "media files" : "PDF"}` },
        { status: 400 }
      );
    }

    const isAllowed =
      ALLOWED_TYPES.includes(file.type) ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".mp4") ||
      file.name.endsWith(".mp3") ||
      file.name.endsWith(".wav") ||
      file.name.endsWith(".m4a");

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: PDF, MP4, MP3, WAV, M4A" },
        { status: 400 }
      );
    }

    const document = await uploadToRagie(file, {
      uploadedAt: new Date().toISOString(),
      originalName: file.name,
    });

    // Wait for indexing, then generate knowledge card
    let knowledgeCard: KnowledgeCard;
    try {
      const indexed = await waitForIndexing(document.id);

      if (indexed) {
        const chunks = await retrieveFromRagie(
          "Main topics, problems, safety notes, content overview",
          document.id
        );

        const cardData = chunks.length > 0
          ? await generateKnowledgeCard(document.name, chunks)
          : {
              summary: "Content could not be analyzed.",
              mainTopics: [],
              typicalProblems: [],
              safetyNotes: [],
            };

        knowledgeCard = {
          id: randomUUID(),
          documentId: document.id,
          documentName: document.name,
          createdAt: new Date().toISOString(),
          ...cardData,
        };
      } else {
        knowledgeCard = {
          id: randomUUID(),
          documentId: document.id,
          documentName: document.name,
          createdAt: new Date().toISOString(),
          summary: "Document is still being processed — knowledge card will follow.",
          mainTopics: [],
          typicalProblems: [],
          safetyNotes: [],
        };
      }
    } catch {
      knowledgeCard = {
        id: randomUUID(),
        documentId: document.id,
        documentName: document.name,
        createdAt: new Date().toISOString(),
        summary: "Knowledge card will be available after indexing.",
        mainTopics: [],
        typicalProblems: [],
        safetyNotes: [],
      };
    }

    await saveKnowledgeCard(knowledgeCard);

    const response: UploadResponse = { document, knowledgeCard };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
