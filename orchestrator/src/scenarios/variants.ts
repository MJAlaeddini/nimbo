import { type Scenario, type StepPlan, dbg, err, info, min, ok, sec, usageFor, warn } from "./types";

const step = (p: StepPlan): StepPlan => ({ usage: usageFor(p.durationMs), ...p });

/** A short, uneventful run: one patch set, green on the first try. */
export const cleanRun: Scenario = {
  key: "metrics-cardinality",
  taskKey: "NIMBO-4688",
  taskTitle: "Drop merchant_id from the payout latency histogram labels",
  taskSummary:
    "The payout latency histogram carries merchant_id as a label, producing ~40k series. Remove the label and add a separate low-cardinality counter for per-merchant volume.",
  repository: "platform/delivery-service",
  targetBranch: "master",
  requester: "d.karimi",
  priority: "normal",
  headline: "Small, clean change — straight through the pipeline with a single patch set.",
  config: { scenario: "metrics-cardinality", changeId: "I2a7b0c31e9f45d82c6a1b3407e5d9f28a4c60b17", changeNumber: "218402", patchSetsBeforeRun: 0, jiraUrl: "https://jira.internal/browse/NIMBO-4688", gerritUrl: "https://gerrit.internal/c/platform/delivery-service/+/218402" },
  steps: {
    "DISCOVERY.JIRA_FETCH": () =>
      step({
        status: "success",
        summary: "Read NIMBO-4688: Task, 2 acceptance criteria.",
        durationMs: sec(3.4),
        log: [info("jira.fetch", "GET /rest/api/3/issue/NIMBO-4688"), ok("jira.fetch", "2 acceptance criteria extracted")],
        effects: [{ type: "external_reference", system: "jira", refKey: "NIMBO-4688", title: "Drop merchant_id from the payout latency histogram labels", url: "https://jira.internal/browse/NIMBO-4688", relation: "task", excerpt: "Task · Normal · Observability" }],
      }),
    "DISCOVERY.CONFLUENCE_READ": () =>
      step({
        status: "success",
        summary: "Cardinality budget page confirms the 10k-series ceiling per service.",
        durationMs: sec(7.1),
        log: [ok("confluence.read", "OPS/2210 — Metrics cardinality budget: 10k series per service")],
        effects: [{ type: "external_reference", system: "confluence", refKey: "OPS/2210", title: "Metrics cardinality budget", url: "https://confluence.internal/display/OPS/2210", relation: "runbook", excerpt: "Hard ceiling of 10k active series per service." }],
      }),
    "IMPLEMENTATION.CODE_EDIT": () =>
      step({
        status: "success",
        summary: "2 files changed (+31 / −18).",
        durationMs: min(1.6),
        log: [ok("agent.edit", "PayoutMetrics.java — merchant_id label removed from the histogram"), ok("agent.edit", "payout.submission.count gains a merchant tag on a plain counter")],
      }),
    "LOCAL_VALIDATION.UNIT_TESTS": () =>
      step({
        status: "success",
        summary: "406 tests, 0 failures.",
        durationMs: min(2.1),
        log: [info("gradle.run", "./gradlew test"), ok("gradle.out", "406 tests completed, 0 failed")],
        effects: [{ type: "validation", tool: "junit", name: "Unit tests", command: "./gradlew test", status: "pass", durationMs: 124_000, testsRun: 406, testsFailed: 0, output: "406 tests completed, 0 failed" }],
      }),
    "PUBLISH_PATCHSET.PUSH": () =>
      step({
        status: "success",
        summary: "Pushed patch set 1 (5e2a09c).",
        durationMs: sec(12),
        log: [info("gerrit.push", "git push origin HEAD:refs/for/master"), ok("gerrit.push", "patch set 1 uploaded")],
        effects: [{ type: "patch_set", number: 1, changeId: "I2a7b0c31e9f45d82c6a1b3407e5d9f28a4c60b17", changeNumber: "218402", revision: "5e2a09c", reason: "Initial orchestrated patch set", meta: { filesChanged: 2, insertions: 31, deletions: 18 } }],
      }),
    "CI_OBSERVATION.JENKINS_RESULT": () =>
      step({
        status: "success",
        summary: "Jenkins voted Verified +1.",
        durationMs: sec(4),
        log: [ok("jenkins.result", "Verified +1 · delivery-service-verify #4462")],
        effects: [{ type: "patch_set_verdict", number: 1, jenkins: { verdict: "pass", label: "Verified +1", url: "https://jenkins.internal/job/delivery-service-verify/4462/", durationMs: 431_000 } }],
      }),
    "CI_OBSERVATION.SONAR_RESULT": () =>
      step({
        status: "success",
        summary: "Quality gate passed.",
        durationMs: sec(4),
        log: [ok("sonar.result", "Quality gate PASSED · Code-Review +1"), ok("sonar.gate", "Coverage on New Code 91.0% ≥ 80.0%")],
        effects: [{ type: "patch_set_verdict", number: 1, sonar: { verdict: "pass", label: "Code-Review +1", url: "https://sonar.internal/dashboard?id=platform%3Adelivery-service&pullRequest=218402" }, issueCount: 0, summary: "Quality gate passed: 0 issues, coverage 91.0%.", meta: { qualityGate: { name: "Nimbo Way", status: "PASSED", conditions: [{ metric: "Coverage on New Code", actual: "91.0%", threshold: "≥ 80.0%", status: "OK" }, { metric: "Reliability Rating on New Code", actual: "A", threshold: "A", status: "OK" }, { metric: "Duplicated Lines on New Code", actual: "0.0%", threshold: "≤ 3.0%", status: "OK" }] } } }],
      }),
    "CI_OBSERVATION.AGGREGATE": () =>
      step({ status: "success", outcome: "success", summary: "All verdicts positive.", durationMs: sec(2), log: [ok("ci.aggregate", "Jenkins +1 · Sonar +1 → ready for human review")] }),
    "READY_FOR_HUMAN_REVIEW.HANDOFF": () =>
      step({ status: "success", outcome: "success", summary: "Handoff composed; patch set 1 is green.", durationMs: sec(16), log: [ok("agent.handoff", "Series count on the histogram drops from ~40k to 12")] }),
  },
};

/** A run that stops for a human: the rebase produces a conflict the agent will not decide. */
export const blockedRebase: Scenario = {
  key: "ledger-schema-conflict",
  taskKey: "NIMBO-4755",
  taskTitle: "Move settlement reconciliation off the legacy ledger client",
  taskSummary:
    "Replace LedgerClientV1 with the v2 client in the settlement reconciliation path, preserving the existing retry semantics.",
  repository: "platform/delivery-service",
  targetBranch: "master",
  requester: "m.tehrani",
  priority: "high",
  headline: "Blocked: a semantic rebase conflict the orchestrator refuses to resolve on its own.",
  config: { scenario: "ledger-schema-conflict", changeId: "I5c93de71b204a8f6e01c7d3b95a24f80c1e6d3a9", changeNumber: "218381", patchSetsBeforeRun: 0, jiraUrl: "https://jira.internal/browse/NIMBO-4755" },
  steps: {
    "DISCOVERY.JIRA_FETCH": () =>
      step({
        status: "success",
        summary: "Read NIMBO-4755: Story, 3 acceptance criteria.",
        durationMs: sec(4),
        log: [ok("jira.fetch", "3 acceptance criteria extracted")],
        effects: [{ type: "external_reference", system: "jira", refKey: "NIMBO-4755", title: "Move settlement reconciliation off the legacy ledger client", url: "https://jira.internal/browse/NIMBO-4755", relation: "task", excerpt: "Story · High · Payments 41" }],
      }),
    "IMPLEMENTATION.CODE_EDIT": () =>
      step({ status: "success", summary: "11 files changed (+512 / −344).", durationMs: min(6.2), log: [ok("agent.edit", "SettlementReconciliationService migrated to LedgerClientV2"), warn("agent.edit", "Retry semantics differ: v2 retries on 409, v1 did not")] }),
    "LOCAL_VALIDATION.UNIT_TESTS": () =>
      step({
        status: "success",
        summary: "431 tests, 0 failures.",
        durationMs: min(2.4),
        log: [ok("gradle.out", "431 tests completed, 0 failed")],
        effects: [{ type: "validation", tool: "junit", name: "Unit tests", command: "./gradlew test", status: "pass", durationMs: 141_000, testsRun: 431, testsFailed: 0 }],
      }),
    "SYNC_WITH_MASTER.FETCH": () =>
      step({ status: "success", summary: "master advanced by 23 commits, 6 touching the ledger client.", durationMs: sec(14), log: [warn("git.fetch", "origin/master a91c2f4 → 7fd3e18 (23 commits)"), warn("git.fetch", "6 commits touch ledger-client — including a v2 API change")] }),
    "SYNC_WITH_MASTER.REBASE": () =>
      step({ status: "success", summary: "Rebase stopped on 4 conflicting files.", durationMs: sec(22), log: [warn("git.rebase", "CONFLICT (content): SettlementReconciliationService.java"), warn("git.rebase", "CONFLICT (content): LedgerClientV2Config.java"), warn("git.rebase", "CONFLICT (content): SettlementReconciliationTest.java"), warn("git.rebase", "CONFLICT (content): ledger-client version catalogue")] }),
    "SYNC_WITH_MASTER.CONFLICTS": () =>
      step({
        status: "blocked",
        outcome: "blocked",
        summary: "3 of 4 conflicts resolved; the retry-semantics conflict needs a product decision.",
        durationMs: min(7.4),
        log: [
          ok("agent.conflict", "Resolved: LedgerClientV2Config.java — upstream timeout defaults kept"),
          ok("agent.conflict", "Resolved: version catalogue — ledger-client 5.2.0 taken from upstream"),
          ok("agent.conflict", "Resolved: SettlementReconciliationTest.java — merged both test sets"),
          err("agent.conflict", "Unresolved: SettlementReconciliationService.java"),
          err("agent.conflict", "Upstream made 409 non-retryable for settlement; this change relies on v2 retrying 409"),
          warn("agent.conflict", "Both behaviours are defensible and the acceptance criteria do not say which wins"),
        ],
        effects: [
          {
            type: "blocker",
            kind: "semantic_conflict",
            severity: "high",
            title: "Conflicting retry semantics for HTTP 409 on settlement",
            detail:
              "master (commit 7fd3e18, \"Stop retrying settlement conflicts\") made 409 non-retryable in the settlement path after INC-2404. This change assumes LedgerClientV2 retries 409, which AC-2 depends on. Textually both sides apply; semantically they contradict each other, and NIMBO-4755 does not state which behaviour is intended. Picking either silently would change production retry behaviour without a decision.",
            options: [
              "Keep master's behaviour: 409 is terminal; amend AC-2 and drop the retry expectation from this change.",
              "Keep this change's behaviour: 409 retries with backoff; requires sign-off from the team that raised INC-2404.",
              "Split: retry 409 only for idempotent reconciliation replays, terminal elsewhere. Needs a new acceptance criterion.",
            ],
          },
        ],
      }),
  },
};

/** A run that fails outright: an unrecoverable environment problem, not a code defect. */
export const failedRun: Scenario = {
  key: "flyway-baseline",
  taskKey: "NIMBO-4702",
  taskTitle: "Backfill payout_submissions.settled_at for pre-2024 rows",
  taskSummary: "Add a backfill migration that populates settled_at from the ledger event log for rows created before 2024-01-01.",
  repository: "platform/delivery-service",
  targetBranch: "master",
  requester: "s.rahimi",
  priority: "normal",
  headline: "Failed: the integration environment cannot produce a usable baseline, and no repair is in scope.",
  config: { scenario: "flyway-baseline", patchSetsBeforeRun: 0, jiraUrl: "https://jira.internal/browse/NIMBO-4702" },
  steps: {
    "DISCOVERY.JIRA_FETCH": () =>
      step({
        status: "success",
        summary: "Read NIMBO-4702: Task, 2 acceptance criteria.",
        durationMs: sec(3.8),
        log: [ok("jira.fetch", "2 acceptance criteria extracted")],
        effects: [{ type: "external_reference", system: "jira", refKey: "NIMBO-4702", title: "Backfill payout_submissions.settled_at for pre-2024 rows", url: "https://jira.internal/browse/NIMBO-4702", relation: "task" }],
      }),
    "IMPLEMENTATION.CODE_EDIT": () =>
      step({ status: "success", summary: "1 migration added (+64 / −0).", durationMs: min(2.2), log: [ok("agent.edit", "V47__backfill_settled_at.sql — batched update, 50k rows per batch")] }),
    "LOCAL_VALIDATION.INTEGRATION": (ctx) =>
      ctx.attempt < 3
        ? step({
            status: "failed",
            outcome: "needs_repair",
            summary: "Flyway cannot baseline: the integration schema is 3 versions ahead of the repository.",
            durationMs: min(2.8),
            log: [
              info("gradle.run", "./gradlew integrationTest"),
              err("gradle.out", "FlywayValidateException: Detected applied migration not resolved locally: 46.2"),
              err("gradle.out", "Schema version 46.2 in the shared integration database; repository has 46"),
              warn("agent.triage", "The shared integration database has hotfix migrations that were never merged"),
            ],
            effects: [{ type: "validation", tool: "gradle", name: "Integration tests", command: "./gradlew integrationTest", status: "fail", durationMs: 168_000, output: "FlywayValidateException: Detected applied migration not resolved locally: 46.2\nBUILD FAILED in 2m 48s" }],
          })
        : step({
            status: "failed",
            outcome: "failed",
            summary: "Third attempt failed identically. The drift is in shared infrastructure, outside this change.",
            durationMs: min(2.9),
            log: [
              err("gradle.out", "FlywayValidateException: Detected applied migration not resolved locally: 46.2"),
              err("agent.triage", "Attempts 1–3 failed identically; nothing in this change can resolve it"),
              err("agent.triage", "Resolution requires reconciling the shared integration database with master — out of scope"),
            ],
          }),
  },
};

/** A run an operator stopped part-way through. */
export const canceledRun: Scenario = {
  key: "webhook-signing",
  taskKey: "NIMBO-4661",
  taskTitle: "Rotate the payout webhook signing key to the v3 KMS alias",
  taskSummary: "Move webhook signature generation from the static secret to the v3 KMS alias, with dual-signing during rollout.",
  repository: "platform/delivery-service",
  targetBranch: "master",
  requester: "d.karimi",
  priority: "normal",
  headline: "Canceled by an operator during implementation.",
  config: { scenario: "webhook-signing", patchSetsBeforeRun: 0, jiraUrl: "https://jira.internal/browse/NIMBO-4661" },
  steps: {
    "DISCOVERY.JIRA_FETCH": () =>
      step({
        status: "success",
        summary: "Read NIMBO-4661: Task, 4 acceptance criteria.",
        durationMs: sec(4.1),
        log: [ok("jira.fetch", "4 acceptance criteria extracted")],
        effects: [{ type: "external_reference", system: "jira", refKey: "NIMBO-4661", title: "Rotate the payout webhook signing key to the v3 KMS alias", url: "https://jira.internal/browse/NIMBO-4661", relation: "task" }],
      }),
    "IMPLEMENTATION.CODE_EDIT": () =>
      step({ status: "success", summary: "4 files changed (+118 / −22).", durationMs: min(3.1), log: [info("agent.edit", "WebhookSigner — dual signing behind a feature flag"), warn("agent.edit", "Rollout ordering depends on the KMS alias existing in every region")] }),
  },
};

/** A run captured mid-flight, waiting on Jenkins. */
export const inFlightRun: Scenario = {
  key: "retry-budget",
  taskKey: "NIMBO-4790",
  taskTitle: "Give the gateway client a per-merchant retry budget",
  taskSummary: "Replace the global retry limiter with a per-merchant token budget so one noisy merchant cannot starve the pool.",
  repository: "platform/delivery-service",
  targetBranch: "master",
  requester: "m.tehrani",
  priority: "high",
  headline: "In flight: patch set 1 published, Jenkins still running.",
  config: { scenario: "retry-budget", changeId: "I4d81f0b62c9a37e5108b4a6f2d90c7e3b5a1f846", changeNumber: "218439", patchSetsBeforeRun: 0, jiraUrl: "https://jira.internal/browse/NIMBO-4790", gerritUrl: "https://gerrit.internal/c/platform/delivery-service/+/218439" },
  steps: {
    "DISCOVERY.JIRA_FETCH": () =>
      step({
        status: "success",
        summary: "Read NIMBO-4790: Story, 3 acceptance criteria.",
        durationMs: sec(4.3),
        log: [ok("jira.fetch", "3 acceptance criteria extracted")],
        effects: [{ type: "external_reference", system: "jira", refKey: "NIMBO-4790", title: "Give the gateway client a per-merchant retry budget", url: "https://jira.internal/browse/NIMBO-4790", relation: "task", excerpt: "Story · High · Payments 41" }],
      }),
    "DISCOVERY.CONFLUENCE_READ": () =>
      step({
        status: "success",
        summary: "ADR-0038 fixes the budget algorithm: token bucket, 1 token per 10 successes.",
        durationMs: sec(9.8),
        log: [ok("confluence.read", "ARCH/9702 — ADR-0038 Retry budgets")],
        effects: [{ type: "external_reference", system: "confluence", refKey: "ARCH/9702", title: "ADR-0038 · Retry budgets", url: "https://confluence.internal/display/ARCH/9702", relation: "decision", excerpt: "Token bucket, refilled 1 token per 10 successful calls." }],
      }),
    "IMPLEMENTATION.CODE_EDIT": () =>
      step({ status: "success", summary: "6 files changed (+201 / −44).", durationMs: min(4.1), log: [ok("agent.edit", "MerchantRetryBudget — token bucket per ADR-0038"), ok("agent.edit", "GatewayClient consults the budget before every retry")] }),
    "LOCAL_VALIDATION.UNIT_TESTS": () =>
      step({
        status: "success",
        summary: "419 tests, 0 failures.",
        durationMs: min(2.3),
        log: [ok("gradle.out", "419 tests completed, 0 failed")],
        effects: [{ type: "validation", tool: "junit", name: "Unit tests", command: "./gradlew test", status: "pass", durationMs: 138_000, testsRun: 419, testsFailed: 0 }],
      }),
    "PUBLISH_PATCHSET.PUSH": () =>
      step({
        status: "success",
        summary: "Pushed patch set 1 (b3c8d10).",
        durationMs: sec(13),
        log: [ok("gerrit.push", "patch set 1 uploaded")],
        effects: [{ type: "patch_set", number: 1, changeId: "I4d81f0b62c9a37e5108b4a6f2d90c7e3b5a1f846", changeNumber: "218439", revision: "b3c8d10", reason: "Initial orchestrated patch set", meta: { filesChanged: 6, insertions: 201, deletions: 44 } }],
      }),
    "CI_OBSERVATION.JENKINS_WAIT": () =>
      step({
        status: "success",
        summary: "Waiting on delivery-service-verify #4479.",
        durationMs: min(8.4),
        log: [info("jenkins.wait", "Polling delivery-service-verify for patch set 1"), dbg("jenkins.wait", "Stage 3/5: unit — 4m 12s elapsed")],
      }),
  },
};

export const VARIANTS = [cleanRun, blockedRebase, failedRun, canceledRun, inFlightRun];
