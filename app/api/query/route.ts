import { NextRequest, NextResponse } from "next/server";
import { retrieveFromRagie } from "@/lib/ragie";
import { generateAnswer } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, documentId } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ error: "Question must not be empty." }, { status: 400 });
    }

    if (question.length > 1000) {
      return NextResponse.json({ error: "Question too long (max. 1000 characters)." }, { status: 400 });
    }

    const chunks = await retrieveFromRagie(question.trim(), documentId ?? undefined);

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "No relevant information found in the knowledge base. Please upload documents first or rephrase your question.",
        sources: [],
        durationMs: 0,
      });
    }

    const result = await generateAnswer(question.trim(), chunks);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
