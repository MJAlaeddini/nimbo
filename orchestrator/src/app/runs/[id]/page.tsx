import { notFound } from "next/navigation";
import { RunDetail } from "@/components/run/RunDetail";
import { buildSnapshot } from "@/orchestrator/snapshot";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = buildSnapshot(id);
  return { title: snapshot ? `${snapshot.run.taskKey} · Delivery Orchestrator` : "Run not found" };
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = buildSnapshot(id);
  if (!snapshot) notFound();
  return <RunDetail initial={snapshot as never} />;
}
