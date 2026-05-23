import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeCard } from "@/lib/knowledge-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const card = await getKnowledgeCard(params.id);

  if (!card) {
    return NextResponse.json({ error: "Knowledge card not found." }, { status: 404 });
  }

  return NextResponse.json(card);
}
