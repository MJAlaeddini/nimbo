import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { RunsList } from "@/components/run/RunsList";
import { Button } from "@/components/ui/Button";
import { buildRunList } from "@/orchestrator/snapshot";

export const dynamic = "force-dynamic";

export default function RunsPage() {
  const runs = buildRunList();
  const active = runs.filter((r) => r.status === "running" || r.status === "queued").length;

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="Delivery orchestrator"
        title="Runs"
        description={
          active
            ? `${active} run${active === 1 ? "" : "s"} in flight. Every run is a Jira task driven to a reviewable Gerrit patch set.`
            : "Every run is a Jira task driven to a reviewable Gerrit patch set."
        }
        actions={
          <Link href="/intake">
            <Button variant="primary">New task</Button>
          </Link>
        }
        className="mb-7"
      />
      <RunsList runs={runs as never} />
    </div>
  );
}
