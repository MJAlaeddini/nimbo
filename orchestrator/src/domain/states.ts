/**
 * The workflow vocabulary.
 *
 * These constants are the single source of truth for the orchestrator, the
 * database and the UI. The agent runtime is deliberately *not* allowed to
 * introduce states: it reports outcomes, the orchestrator maps outcomes to
 * states (see `transitions.ts`).
 */

export const TOP_LEVEL_STATES = [
  "DISCOVERY",
  "PLANNING",
  "CHECKPOINT",
  "IMPLEMENTATION",
  "LOCAL_VALIDATION",
  "PREFLIGHT",
  "COMMIT",
  "SYNC_WITH_MASTER",
  "PUBLISH_PATCHSET",
  "CI_OBSERVATION",
  "CI_REPAIR",
  "READY_FOR_HUMAN_REVIEW",
  "BLOCKED",
  "FAILED",
  "CANCELED",
] as const;

export type WorkflowState = (typeof TOP_LEVEL_STATES)[number];

/** States that end a run. Nothing is scheduled after them. */
export const TERMINAL_STATES: readonly WorkflowState[] = [
  "READY_FOR_HUMAN_REVIEW",
  "BLOCKED",
  "FAILED",
  "CANCELED",
];

/** The happy-path spine, in the order it is drawn in the pipeline track. */
export const PIPELINE_STATES: readonly WorkflowState[] = [
  "DISCOVERY",
  "PLANNING",
  "CHECKPOINT",
  "IMPLEMENTATION",
  "LOCAL_VALIDATION",
  "PREFLIGHT",
  "COMMIT",
  "SYNC_WITH_MASTER",
  "PUBLISH_PATCHSET",
  "CI_OBSERVATION",
  "CI_REPAIR",
  "READY_FOR_HUMAN_REVIEW",
];

export function isTerminal(state: WorkflowState): boolean {
  return TERMINAL_STATES.includes(state);
}

export type ChildStateDef = {
  key: string;
  label: string;
  /** Shown in the execution tree when the row is expanded. */
  description: string;
};

export type PhaseDef = {
  state: WorkflowState;
  label: string;
  /** One line explaining what the orchestrator is responsible for here. */
  intent: string;
  children: ChildStateDef[];
};

const phase = (
  state: WorkflowState,
  label: string,
  intent: string,
  children: [string, string, string][],
): PhaseDef => ({
  state,
  label,
  intent,
  children: children.map(([key, l, description]) => ({ key, label: l, description })),
});

/**
 * Hierarchical child states. Every unit of agent work happens inside a child
 * state, which is why child states — not top-level states — carry the agent
 * sessions, validation results and log lines.
 */
export const PHASES: readonly PhaseDef[] = [
  phase("DISCOVERY", "Discovery", "Gather everything the agent needs before it is allowed to plan.", [
    ["JIRA_FETCH", "Fetch Jira task", "Read the issue, its type, acceptance criteria and fix version."],
    ["JIRA_LINKED", "Traverse linked issues", "Follow blocks/relates links for prior art and regressions."],
    ["CONFLUENCE_SEARCH", "Search Confluence", "Locate design pages, ADRs and runbooks referenced by the task."],
    ["CONFLUENCE_READ", "Read design pages", "Extract constraints and decisions from the located pages."],
    ["REPO_MAP", "Map repository", "Build a module map: build files, source sets, ownership."],
    ["CODE_SEARCH", "Locate call sites", "Find the code paths the change will touch."],
    ["CONTEXT_SYNTHESIS", "Synthesise context", "Reduce findings to a working context the planner can consume."],
  ]),
  phase("PLANNING", "Planning", "Turn context into an explicit, reviewable change plan.", [
    ["REQUIREMENTS", "Extract requirements", "Restate acceptance criteria as verifiable statements."],
    ["IMPACT", "Impact analysis", "Enumerate modules, public APIs and consumers affected."],
    ["CHANGE_PLAN", "Draft change plan", "Ordered edits with rationale, per file."],
    ["TEST_STRATEGY", "Test strategy", "Decide which tests prove each requirement."],
    ["RISK", "Risk assessment", "Call out migration, compatibility and rollout risk."],
  ]),
  phase("CHECKPOINT", "Checkpoint", "Gate the plan before any code is written.", [
    ["PLAN_REVIEW", "Self-review plan", "Agent critiques its own plan against the requirements."],
    ["SCOPE_GUARD", "Scope guard", "Reject edits outside the declared blast radius."],
    ["GATE", "Policy gate", "Apply the run's approval policy (auto or human)."],
  ]),
  phase("IMPLEMENTATION", "Implementation", "Write code against the approved plan only.", [
    ["WORKSPACE", "Prepare workspace", "Clean tree, correct base revision, dependency cache warm."],
    ["CODE_EDIT", "Apply code changes", "Execute the change plan edit by edit."],
    ["TEST_AUTHORING", "Author tests", "Write the tests named in the test strategy."],
    ["SELF_REVIEW", "Review diff", "Re-read the produced diff before spending a build."],
  ]),
  phase("LOCAL_VALIDATION", "Local validation", "Prove the change builds and passes tests locally.", [
    ["COMPILE", "Compile", "./gradlew compileJava compileTestJava"],
    ["STATIC", "Format & static analysis", "./gradlew spotlessCheck checkstyleMain"],
    ["UNIT_TESTS", "Unit tests", "./gradlew test"],
    ["ARTIFACT", "Generated artifacts", "./gradlew generateApiDocs bootJar — generated sources must match."],
    ["INTEGRATION", "Integration tests", "./gradlew integrationTest"],
  ]),
  phase("PREFLIGHT", "Coder preflight", "Everything a reviewer would reject before they read the diff.", [
    ["CODER_LINT", "Coder lint profile", "House lint profile over the changed files only."],
    ["SECRET_SCAN", "Secret scan", "Reject credentials, tokens and internal hostnames in the diff."],
    ["DIFF_REVIEW", "Diff hygiene", "No debug output, no stray TODOs, no unrelated churn."],
    ["COMMIT_MSG", "Commit message", "Conventional subject, body, issue key, Change-Id."],
  ]),
  phase("COMMIT", "Commit", "Materialise the change as a single reviewable commit.", [
    ["STAGE", "Stage changes", "Stage only files named in the change plan."],
    ["COMMIT_CREATE", "Create commit", "Author the commit with the generated message."],
    ["CHANGE_ID", "Attach Change-Id", "Preserve the Gerrit Change-Id across patch sets."],
  ]),
  phase("SYNC_WITH_MASTER", "Sync with master", "Rebase onto the tip of master and prove it still holds.", [
    ["FETCH", "Fetch master", "Fetch the target branch and report drift."],
    ["REBASE", "Rebase", "Replay the commit onto the new base."],
    ["CONFLICTS", "Resolve conflicts", "Resolve textual and semantic conflicts."],
    ["POST_REBASE", "Re-validate after rebase", "Re-run the checks that the new base can invalidate."],
  ]),
  phase("PUBLISH_PATCHSET", "Publish patch set", "Push a new patch set to Gerrit.", [
    ["PUSH", "Push refs/for", "git push origin HEAD:refs/for/master"],
    ["REGISTER", "Register patch set", "Record the patch set number and revision."],
    ["REVIEWERS", "Notify reviewers", "Attach reviewers from CODEOWNERS."],
  ]),
  phase("CI_OBSERVATION", "CI observation", "Watch the verdicts the change must earn.", [
    ["JENKINS_WAIT", "Await Jenkins", "Poll the verification build for this patch set."],
    ["JENKINS_RESULT", "Read Jenkins verdict", "Verified +1 / -1 with failing stage detail."],
    ["SONAR_WAIT", "Await Sonar", "Poll the quality gate for this patch set."],
    ["SONAR_RESULT", "Read Sonar verdict", "Code-Review +1 / -1 with issues on new code."],
    ["AGGREGATE", "Aggregate verdicts", "Decide green, repairable, or blocked."],
  ]),
  phase("CI_REPAIR", "CI repair", "Diagnose CI and Sonar findings and drive a fix.", [
    ["TRIAGE", "Triage failures", "Separate our regressions from infrastructure noise."],
    ["ISSUE_ANALYSIS", "Analyse findings", "Map each finding to a file, a rule and a fix."],
    ["REPAIR_PLAN", "Plan repairs", "Order the fixes; refuse suppressions."],
    ["REPAIR_EDIT", "Apply repairs", "Implement the fixes."],
  ]),
  phase("READY_FOR_HUMAN_REVIEW", "Ready for human review", "Hand off to a person with a complete summary.", [
    ["HANDOFF", "Compose handoff", "What changed, why, what was proven, what to look at first."],
  ]),
  phase("BLOCKED", "Blocked", "Stopped: a human decision is required.", []),
  phase("FAILED", "Failed", "Stopped: the run exhausted its budget or hit an unrecoverable error.", []),
  phase("CANCELED", "Canceled", "Stopped by an operator.", []),
];

const PHASE_INDEX = new Map<WorkflowState, PhaseDef>(PHASES.map((p) => [p.state, p]));

export function getPhase(state: WorkflowState): PhaseDef {
  const found = PHASE_INDEX.get(state);
  if (!found) throw new Error(`Unknown workflow state: ${state}`);
  return found;
}

export function stateLabel(state: string): string {
  return PHASE_INDEX.get(state as WorkflowState)?.label ?? state;
}

export function childLabel(state: string, childKey: string): string {
  const p = PHASE_INDEX.get(state as WorkflowState);
  return p?.children.find((c) => c.key === childKey)?.label ?? childKey;
}
