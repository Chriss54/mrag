import { NextRequest, NextResponse } from "next/server";
import { getRagieDocument } from "@/lib/ragie";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID fehlt." }, { status: 400 });
  }

  try {
    const doc = await getRagieDocument(id);
    return NextResponse.json({ status: doc.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
