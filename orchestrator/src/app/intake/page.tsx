import { PageHeader } from "@/components/PageHeader";
import { IntakeForm } from "@/components/IntakeForm";
import { SCENARIOS } from "@/scenarios";

export const dynamic = "force-dynamic";

export const metadata = { title: "New task · Delivery Orchestrator" };

export default function IntakePage() {
  const scenarios = SCENARIOS.map((s) => ({
    key: s.key,
    taskKey: s.taskKey,
    taskTitle: s.taskTitle,
    taskSummary: s.taskSummary,
    repository: s.repository,
    targetBranch: s.targetBranch,
    requester: s.requester,
    priority: s.priority,
    headline: s.headline,
  }));

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="Task intake"
        title="Dispatch a run"
        description="Pick a workload, adjust the task, and hand it to the orchestrator. Milestone 1 executes against a scripted mock runtime — no Jira, Gerrit, Sonar or Git call is made."
        className="mb-7"
      />
      <IntakeForm scenarios={scenarios} />
    </div>
  );
}
