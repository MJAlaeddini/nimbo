import { NextResponse } from "next/server";
import { buildSnapshot } from "@/orchestrator/snapshot";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const since = Number(new URL(request.url).searchParams.get("since") ?? 0);
  const snapshot = buildSnapshot(id, Number.isFinite(since) ? since : 0);
  if (!snapshot) return NextResponse.json({ error: "Run not found" }, { status: 404 });
  return NextResponse.json(snapshot);
}
