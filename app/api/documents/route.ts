import { NextRequest, NextResponse } from "next/server";
import { listRagieDocuments, deleteRagieDocument } from "@/lib/ragie";
import { deleteKnowledgeCardByDocumentId, getKnowledgeCardByDocumentId } from "@/lib/knowledge-store";

export async function GET() {
  try {
    const documents = await listRagieDocuments();
    // Attach knowledge card info to each document
    const enriched = await Promise.all(
      documents.map(async (doc) => {
        const card = await getKnowledgeCardByDocumentId(doc.id);
        return { ...doc, knowledgeCardId: card?.id ?? null };
      })
    );
    return NextResponse.json({ documents: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Document ID missing." }, { status: 400 });
    }

    await deleteRagieDocument(id);
    await deleteKnowledgeCardByDocumentId(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
