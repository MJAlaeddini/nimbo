import type { SonarIssue } from "@/domain/types";
import { type Scenario, type StepPlan, dbg, err, genericStep, info, min, ok, sec, usageFor, warn } from "./types";

/**
 * The reference scenario: a real-shaped run that exercises every loop in the
 * workflow — discovery, a generated-artifact failure and its repair, a rebase
 * with conflicts, patch set 3 with Sonar -1, a Sonar repair, patch set 4 all
 * green, and handoff.
 */

const CHANGE_ID = "I8f2c1d94ab7e5306f1c0b2a7d4e9f31c6b0a8d52";
const CHANGE_NUMBER = "218447";
const GERRIT = `https://gerrit.internal/c/platform/delivery-service/+/${CHANGE_NUMBER}`;

const FILES = [
  "payout-api/src/main/java/com/nimbo/payout/api/PayoutSubmissionController.java",
  "payout-core/src/main/java/com/nimbo/payout/core/IdempotencyKeyService.java",
  "payout-core/src/main/java/com/nimbo/payout/core/PayoutSubmissionService.java",
  "payout-persistence/src/main/java/com/nimbo/payout/persistence/IdempotencyRecordRepository.java",
  "payout-persistence/src/main/resources/db/migration/V47__idempotency_records.sql",
];

const SONAR_ISSUES: SonarIssue[] = [
  {
    key: "AZ4h-payout-0001",
    rule: "java:S2095",
    severity: "BLOCKER",
    type: "BUG",
    file: "payout-core/src/main/java/com/nimbo/payout/core/IdempotencyKeyService.java",
    line: 118,
    message: "Use try-with-resources or close this \"DigestInputStream\" in a \"finally\" clause.",
    effort: "10min",
    status: "open",
  },
  {
    key: "AZ4h-payout-0002",
    rule: "java:S3776",
    severity: "CRITICAL",
    type: "CODE_SMELL",
    file: "payout-core/src/main/java/com/nimbo/payout/core/PayoutSubmissionService.java",
    line: 96,
    message: "Refactor this method to reduce its Cognitive Complexity from 24 to the 15 allowed.",
    effort: "24min",
    status: "open",
  },
  {
    key: "AZ4h-payout-0003",
    rule: "java:S2259",
    severity: "MAJOR",
    type: "BUG",
    file: "payout-api/src/main/java/com/nimbo/payout/api/PayoutSubmissionController.java",
    line: 74,
    message: "A \"NullPointerException\" could be thrown; \"idempotencyKey()\" can return null.",
    effort: "5min",
    status: "open",
  },
  {
    key: "AZ4h-payout-0004",
    rule: "java:S1192",
    severity: "MINOR",
    type: "CODE_SMELL",
    file: "payout-api/src/main/java/com/nimbo/payout/api/PayoutSubmissionController.java",
    line: 52,
    message: "Define a constant instead of duplicating this literal \"Idempotency-Key\" 4 times.",
    effort: "8min",
    status: "open",
  },
];

const step = (p: StepPlan): StepPlan => ({ usage: usageFor(p.durationMs), ...p });

export const flagship: Scenario = {
  key: "payout-idempotency",
  taskKey: "NIMBO-4821",
  taskTitle: "Add idempotency keys to the payout submission API",
  taskSummary:
    "Duplicate payout submissions are reaching the ledger when clients retry after a gateway timeout. Accept an Idempotency-Key header on POST /v2/payouts, persist the key with the submission outcome, and replay the stored response for repeats within 24 hours.",
  repository: "platform/delivery-service",
  targetBranch: "master",
  requester: "s.rahimi",
  priority: "high",
  headline:
    "Full reference run: artifact repair, rebase with conflicts, patch set 3 with Sonar −1, repair, patch set 4 all green.",
  config: {
    scenario: "payout-idempotency",
    changeId: CHANGE_ID,
    changeNumber: CHANGE_NUMBER,
    /** Patch sets 1–2 were uploaded by a human before the run started. */
    patchSetsBeforeRun: 2,
    jiraUrl: "https://jira.internal/browse/NIMBO-4821",
    gerritUrl: GERRIT,
  },

  steps: {
    // ── DISCOVERY ───────────────────────────────────────────────────────────
    "DISCOVERY.JIRA_FETCH": () =>
      step({
        status: "success",
        summary: "Read NIMBO-4821: Story, 5 acceptance criteria, fix version 2026.9.",
        durationMs: sec(4.2),
        log: [
          info("jira.fetch", "GET /rest/api/3/issue/NIMBO-4821"),
          dbg("jira.fetch", "type=Story  priority=High  fixVersion=2026.9  sprint=Payments 41"),
          ok("jira.fetch", "5 acceptance criteria extracted"),
          dbg("jira.ac", "AC-1 POST /v2/payouts accepts an optional Idempotency-Key header"),
          dbg("jira.ac", "AC-2 A repeated key within 24h replays the original response verbatim"),
          dbg("jira.ac", "AC-3 A repeated key with a different body returns 422"),
          dbg("jira.ac", "AC-4 Keys are scoped per merchant, never global"),
          dbg("jira.ac", "AC-5 Replayed responses carry Idempotent-Replay: true"),
        ],
        effects: [
          {
            type: "external_reference",
            system: "jira",
            refKey: "NIMBO-4821",
            title: "Add idempotency keys to the payout submission API",
            url: "https://jira.internal/browse/NIMBO-4821",
            relation: "task",
            excerpt: "Story · High · fixVersion 2026.9 · Payments 41",
          },
        ],
        contextPatch: { discovery: { jiraKey: "NIMBO-4821", confluencePages: [], modules: [] } },
      }),

    "DISCOVERY.JIRA_LINKED": () =>
      step({
        status: "success",
        summary: "2 linked issues: one prior incident, one blocked follow-up.",
        durationMs: sec(3.1),
        log: [
          info("jira.links", "Traversing issue links"),
          ok("jira.links", "NIMBO-4390 (relates to) — INC-2291 duplicate payouts after gateway timeout"),
          ok("jira.links", "NIMBO-4712 (is blocked by) — Client SDK retry policy"),
          warn("jira.links", "NIMBO-4712 depends on this change landing first; scope stays inside the service"),
        ],
        effects: [
          {
            type: "external_reference",
            system: "jira",
            refKey: "NIMBO-4390",
            title: "INC-2291 duplicate payouts after gateway timeout",
            url: "https://jira.internal/browse/NIMBO-4390",
            relation: "relates",
            excerpt: "Post-incident review: 214 duplicate payouts over 40 minutes.",
          },
          {
            type: "external_reference",
            system: "jira",
            refKey: "NIMBO-4712",
            title: "Client SDK retry policy",
            url: "https://jira.internal/browse/NIMBO-4712",
            relation: "blocked_by",
          },
        ],
      }),

    "DISCOVERY.CONFLUENCE_SEARCH": () =>
      step({
        status: "success",
        summary: "3 relevant pages found across 2 spaces.",
        durationMs: sec(5.6),
        log: [
          info("confluence.search", 'CQL: text ~ "idempotency" AND space in (PAY, ARCH, OPS)'),
          dbg("confluence.search", "17 hits, ranked by recency and space authority"),
          ok("confluence.search", "3 pages retained above the relevance threshold"),
        ],
      }),

    "DISCOVERY.CONFLUENCE_READ": () =>
      step({
        status: "success",
        summary: "ADR-0042 fixes the storage model: keys are merchant-scoped with a 24h TTL.",
        durationMs: sec(12.4),
        log: [
          info("confluence.read", "PAY/12345 — Payout Submission API · Design"),
          info("confluence.read", "ARCH/9871 — ADR-0042 Idempotency at the edge"),
          ok("confluence.read", "ADR-0042 §3: keys are stored server-side, scoped per merchant, TTL 24h"),
          ok("confluence.read", "ADR-0042 §5: replays must return the original status code, not 200"),
          info("confluence.read", "OPS/4410 — Runbook: payout replay incidents"),
          warn("confluence.read", "Runbook expects a metric payout.idempotency.replay to exist before rollout"),
        ],
        effects: [
          { type: "external_reference", system: "confluence", refKey: "PAY/12345", title: "Payout Submission API · Design", url: "https://confluence.internal/display/PAY/12345", relation: "design", excerpt: "Endpoint contract, error taxonomy, merchant scoping rules." },
          { type: "external_reference", system: "confluence", refKey: "ARCH/9871", title: "ADR-0042 · Idempotency at the edge", url: "https://confluence.internal/display/ARCH/9871", relation: "decision", excerpt: "§3 merchant-scoped keys, 24h TTL. §5 replays preserve the original status code." },
          { type: "external_reference", system: "confluence", refKey: "OPS/4410", title: "Runbook · payout replay incidents", url: "https://confluence.internal/display/OPS/4410", relation: "runbook", excerpt: "Requires payout.idempotency.replay counter before rollout." },
        ],
        contextPatch: {
          discovery: { jiraKey: "NIMBO-4821", confluencePages: ["PAY/12345", "ARCH/9871", "OPS/4410"], modules: [] },
        },
      }),

    "DISCOVERY.REPO_MAP": () =>
      step({
        status: "success",
        summary: "9 Gradle modules; 3 are in scope.",
        durationMs: sec(8.8),
        log: [
          info("repo.map", "Reading settings.gradle.kts — 9 modules"),
          dbg("repo.map", "payout-api · payout-core · payout-persistence · payout-gateway · ledger-client · …"),
          ok("repo.map", "In scope: payout-api, payout-core, payout-persistence"),
          dbg("repo.map", "Flyway migrations at payout-persistence/src/main/resources/db/migration (latest V46)"),
          dbg("repo.map", "OpenAPI spec is generated: gradle generateOpenApiSpec, committed under payout-api/…/openapi"),
        ],
        contextPatch: {
          discovery: {
            jiraKey: "NIMBO-4821",
            confluencePages: ["PAY/12345", "ARCH/9871", "OPS/4410"],
            modules: ["payout-api", "payout-core", "payout-persistence"],
          },
        },
      }),

    "DISCOVERY.CODE_SEARCH": () =>
      step({
        status: "success",
        summary: "Submission path traced end to end; 6 call sites.",
        durationMs: sec(11.2),
        log: [
          info("code.search", "PayoutSubmissionController.submit → PayoutSubmissionService.submit → LedgerClient.post"),
          ok("code.search", "6 call sites of PayoutSubmissionService.submit (4 in tests)"),
          warn("code.search", "PayoutSubmissionService.submit is already 84 lines; Sonar complexity budget is tight here"),
        ],
      }),

    "DISCOVERY.CONTEXT_SYNTHESIS": () =>
      step({
        status: "success",
        summary: "Context reduced to 5 constraints and 3 in-scope modules.",
        durationMs: sec(6.4),
        outcome: "success",
        log: [
          info("agent.synthesis", "Reducing 3 pages, 3 issues and 9 modules to a working context"),
          ok("agent.synthesis", "Constraints: merchant-scoped keys · 24h TTL · replay preserves status · replay counter · 422 on body mismatch"),
        ],
      }),

    // ── PLANNING ────────────────────────────────────────────────────────────
    "PLANNING.REQUIREMENTS": () =>
      step({
        status: "success",
        summary: "5 acceptance criteria restated as verifiable statements.",
        durationMs: sec(7.9),
        log: [ok("agent.plan", "Each AC mapped to at least one test assertion")],
      }),

    "PLANNING.IMPACT": () =>
      step({
        status: "success",
        summary: "3 modules, 1 migration, 1 generated artifact affected.",
        durationMs: sec(9.3),
        log: [
          info("agent.plan", "Impact: payout-api (contract), payout-core (logic), payout-persistence (schema)"),
          warn("agent.plan", "The OpenAPI spec is generated and committed — it must be regenerated with the contract change"),
        ],
      }),

    "PLANNING.CHANGE_PLAN": () =>
      step({
        status: "success",
        summary: "8 ordered edits across 5 files plus 3 test classes.",
        durationMs: min(0.6),
        log: [
          ok("agent.plan", "1 · V47__idempotency_records.sql — table, unique (merchant_id, key), TTL index"),
          ok("agent.plan", "2 · IdempotencyRecordRepository — upsert + findActive"),
          ok("agent.plan", "3 · IdempotencyKeyService — canonical request digest, conflict detection"),
          ok("agent.plan", "4 · PayoutSubmissionService — replay branch before submission"),
          ok("agent.plan", "5 · PayoutSubmissionController — read header, emit Idempotent-Replay"),
          ok("agent.plan", "6 · Metric payout.idempotency.replay"),
          ok("agent.plan", "7 · Regenerate OpenAPI spec"),
          ok("agent.plan", "8 · Tests: service, repository, controller MVC slice"),
        ],
        contextPatch: { plan: { steps: ["migration", "repository", "key service", "replay branch", "controller", "metric", "spec", "tests"], files: FILES } },
      }),

    "PLANNING.TEST_STRATEGY": () =>
      step({
        status: "success",
        summary: "11 new tests; every AC covered at least once.",
        durationMs: sec(14.1),
        log: [
          ok("agent.plan", "AC-1/AC-5 → controller MVC slice"),
          ok("agent.plan", "AC-2/AC-3 → service tests with a fixed clock"),
          ok("agent.plan", "AC-4 → repository test asserting the merchant-scoped unique constraint"),
        ],
      }),

    "PLANNING.RISK": () =>
      step({
        status: "success",
        summary: "One medium risk: the migration takes a write lock on payout_submissions.",
        durationMs: sec(8.2),
        outcome: "success",
        log: [
          warn("agent.plan", "V47 adds a FK to payout_submissions — brief write lock on deploy"),
          ok("agent.plan", "Mitigation: create the table without the FK, add it CONCURRENTLY in a follow-up"),
        ],
      }),

    // ── CHECKPOINT ──────────────────────────────────────────────────────────
    "CHECKPOINT.PLAN_REVIEW": () =>
      step({
        status: "success",
        summary: "Self-review found one gap: no test for the 24h expiry boundary.",
        durationMs: sec(10.6),
        log: [
          warn("agent.review", "AC-2 covers replay inside the window but not at the boundary"),
          ok("agent.review", "Plan amended: 12 tests, expiry boundary at exactly 24h"),
        ],
      }),

    "CHECKPOINT.SCOPE_GUARD": () =>
      step({
        status: "success",
        summary: "All 5 planned files are inside the declared blast radius.",
        durationMs: sec(2.4),
        log: [ok("policy.scope", "0 files outside payout-api, payout-core, payout-persistence")],
      }),

    "CHECKPOINT.GATE": (ctx) =>
      step({
        status: "success",
        summary: "Auto-approved: change is inside one service and carries no public API break.",
        durationMs: sec(1.8),
        outcome: "success",
        log: [
          info("policy.gate", `Policy: ${String(ctx.run.config.approvalPolicy ?? "auto-within-service")}`),
          ok("policy.gate", "Checkpoint passed without human approval"),
        ],
      }),

    // ── IMPLEMENTATION ──────────────────────────────────────────────────────
    "IMPLEMENTATION.WORKSPACE": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "Clean tree at master@a91c2f4." : "Workspace retained from the previous attempt.",
        durationMs: ctx.attempt === 1 ? sec(18.5) : sec(3.2),
        log:
          ctx.attempt === 1
            ? [
                info("git.workspace", "git fetch origin && git checkout -B feature/NIMBO-4821 origin/master"),
                dbg("git.workspace", "HEAD is now at a91c2f4 — Bump ledger-client to 4.19.0"),
                ok("gradle.cache", "Dependency cache warm (0 downloads)"),
              ]
            : [info("git.workspace", "Reusing workspace; tree still at feature/NIMBO-4821")],
      }),

    "IMPLEMENTATION.CODE_EDIT": (ctx) => {
      if (ctx.attempt === 1) {
        return step({
          status: "success",
          summary: "8 edits applied across 5 files (+284 / −37).",
          durationMs: min(3.4),
          log: [
            info("agent.edit", "V47__idempotency_records.sql — new table, unique (merchant_id, idempotency_key)"),
            info("agent.edit", "IdempotencyRecordRepository.java — upsert, findActive(merchantId, key, now)"),
            info("agent.edit", "IdempotencyKeyService.java — SHA-256 canonical digest of the request body"),
            info("agent.edit", "PayoutSubmissionService.java — replay branch ahead of submission"),
            info("agent.edit", "PayoutSubmissionController.java — header binding, Idempotent-Replay response header"),
            ok("agent.edit", "payout.idempotency.replay counter registered with the Micrometer registry"),
            ok("agent.edit", "5 files changed, 284 insertions(+), 37 deletions(-)"),
          ],
        });
      }
      // Attempt 2 exists because the generated OpenAPI spec drifted.
      return step({
        status: "success",
        summary: "Regenerated the OpenAPI spec and committed the drifted artifact.",
        durationMs: min(1.1),
        log: [
          info("agent.repair", "Failure: generated OpenAPI spec differs from the committed copy"),
          info("gradle.run", "./gradlew :payout-api:generateOpenApiSpec"),
          ok("agent.repair", "payout-v2.yaml regenerated — Idempotency-Key parameter and 422 response now present"),
          dbg("agent.repair", "1 file changed, 34 insertions(+), 2 deletions(-)"),
        ],
      });
    },

    "IMPLEMENTATION.TEST_AUTHORING": (ctx) =>
      ctx.attempt === 1
        ? step({
            status: "success",
            summary: "12 tests authored across 3 classes.",
            durationMs: min(2.6),
            log: [
              ok("agent.edit", "PayoutSubmissionServiceIdempotencyTest — 6 tests, fixed clock"),
              ok("agent.edit", "IdempotencyRecordRepositoryTest — 3 tests against Testcontainers Postgres"),
              ok("agent.edit", "PayoutSubmissionControllerTest — 3 MVC slice tests"),
            ],
          })
        : step({
            status: "success",
            summary: "No new tests needed for the artifact repair.",
            durationMs: sec(6),
            log: [info("agent.edit", "Repair is confined to a generated artifact; existing tests cover the contract")],
          }),

    "IMPLEMENTATION.SELF_REVIEW": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "Diff reviewed; one dead import removed." : "Repair diff reviewed; scope is the spec only.",
        durationMs: ctx.attempt === 1 ? sec(38) : sec(9),
        outcome: "success",
        log:
          ctx.attempt === 1
            ? [
                warn("agent.review", "Unused import java.time.Duration in PayoutSubmissionService"),
                ok("agent.review", "Removed; diff is otherwise on-plan"),
              ]
            : [ok("agent.review", "1 file, generated content only")],
      }),

    // ── LOCAL_VALIDATION ────────────────────────────────────────────────────
    "LOCAL_VALIDATION.COMPILE": () =>
      step({
        status: "success",
        summary: "Compilation succeeded.",
        durationMs: min(1.3),
        log: [
          info("gradle.run", "./gradlew compileJava compileTestJava"),
          dbg("gradle.out", "> Task :payout-persistence:compileJava"),
          dbg("gradle.out", "> Task :payout-core:compileJava"),
          dbg("gradle.out", "> Task :payout-api:compileJava"),
          ok("gradle.out", "BUILD SUCCESSFUL in 1m 18s"),
        ],
        effects: [
          { type: "validation", tool: "gradle", name: "Compile", command: "./gradlew compileJava compileTestJava", status: "pass", durationMs: 78_000, output: "BUILD SUCCESSFUL in 1m 18s\n34 actionable tasks: 12 executed, 22 up-to-date" },
        ],
      }),

    "LOCAL_VALIDATION.STATIC": () =>
      step({
        status: "success",
        summary: "Spotless and Checkstyle clean.",
        durationMs: sec(41),
        log: [
          info("gradle.run", "./gradlew spotlessCheck checkstyleMain"),
          ok("gradle.out", "BUILD SUCCESSFUL in 39s"),
        ],
        effects: [
          { type: "validation", tool: "spotless", name: "Format & static analysis", command: "./gradlew spotlessCheck checkstyleMain", status: "pass", durationMs: 39_000, output: "BUILD SUCCESSFUL in 39s" },
        ],
      }),

    "LOCAL_VALIDATION.UNIT_TESTS": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "412 tests, 0 failures." : ctx.attempt === 2 ? "412 tests, 0 failures." : "418 tests, 0 failures.",
        durationMs: min(2.2),
        log: [
          info("gradle.run", "./gradlew test"),
          dbg("gradle.out", "> Task :payout-core:test"),
          ok("gradle.out", ctx.attempt >= 3 ? "418 tests completed, 0 failed" : "412 tests completed, 0 failed"),
          ok("gradle.out", "BUILD SUCCESSFUL in 2m 09s"),
        ],
        effects: [
          {
            type: "validation",
            tool: "junit",
            name: "Unit tests",
            command: "./gradlew test",
            status: "pass",
            durationMs: 129_000,
            testsRun: ctx.attempt >= 3 ? 418 : 412,
            testsFailed: 0,
            output: `${ctx.attempt >= 3 ? 418 : 412} tests completed, 0 failed\nBUILD SUCCESSFUL in 2m 09s`,
          },
        ],
      }),

    "LOCAL_VALIDATION.ARTIFACT": (ctx) => {
      if (ctx.attempt === 1) {
        return step({
          status: "failed",
          summary: "Generated OpenAPI spec is out of date — committed copy differs from the generated one.",
          durationMs: sec(52),
          log: [
            info("gradle.run", "./gradlew :payout-api:generateOpenApiSpec verifyOpenApiSpec"),
            err("gradle.out", "> Task :payout-api:verifyOpenApiSpec FAILED"),
            err("gradle.out", "Generated API specification does not match the committed specification."),
            dbg("gradle.out", "--- a/payout-api/src/main/resources/openapi/payout-v2.yaml"),
            dbg("gradle.out", "+++ b/build/generated/openapi/payout-v2.yaml"),
            dbg("gradle.out", "+      - name: Idempotency-Key"),
            dbg("gradle.out", "+        in: header"),
            dbg("gradle.out", "+        required: false"),
            dbg("gradle.out", "+      '422': { description: Idempotency key reused with a different payload }"),
            err("gradle.out", "BUILD FAILED in 48s"),
          ],
          effects: [
            {
              type: "validation",
              tool: "gradle",
              name: "Generated artifacts",
              command: "./gradlew :payout-api:generateOpenApiSpec verifyOpenApiSpec",
              status: "fail",
              durationMs: 48_000,
              output:
                "> Task :payout-api:verifyOpenApiSpec FAILED\nGenerated API specification does not match the committed specification.\n  + parameter Idempotency-Key (header)\n  + response 422\nBUILD FAILED in 48s",
            },
          ],
          contextPatch: { failures: [{ tool: "gradle", detail: "verifyOpenApiSpec: committed payout-v2.yaml is stale" }] },
        });
      }
      return step({
        status: "success",
        summary: "Generated artifacts match the committed copies.",
        durationMs: sec(46),
        log: [
          info("gradle.run", "./gradlew :payout-api:generateOpenApiSpec verifyOpenApiSpec"),
          ok("gradle.out", "Generated API specification matches the committed specification."),
          ok("gradle.out", "BUILD SUCCESSFUL in 44s"),
        ],
        effects: [
          { type: "validation", tool: "gradle", name: "Generated artifacts", command: "./gradlew :payout-api:generateOpenApiSpec verifyOpenApiSpec", status: "pass", durationMs: 44_000, output: "Generated API specification matches the committed specification.\nBUILD SUCCESSFUL in 44s" },
        ],
      });
    },

    "LOCAL_VALIDATION.INTEGRATION": (ctx) => {
      if (ctx.attempt === 1) {
        // Never reached: the phase already failed at ARTIFACT.
        return step({ status: "success", summary: "Skipped.", durationMs: 0, log: [] });
      }
      return step({
        status: "success",
        summary: "38 integration tests, 0 failures.",
        durationMs: min(3.1),
        outcome: "success",
        log: [
          info("gradle.run", "./gradlew integrationTest"),
          dbg("gradle.out", "Testcontainers: postgres:16-alpine started in 6.2s"),
          ok("gradle.out", "38 tests completed, 0 failed"),
          ok("gradle.out", "BUILD SUCCESSFUL in 3m 04s"),
        ],
        effects: [
          { type: "validation", tool: "junit", name: "Integration tests", command: "./gradlew integrationTest", status: "pass", durationMs: 184_000, testsRun: 38, testsFailed: 0, output: "38 tests completed, 0 failed\nBUILD SUCCESSFUL in 3m 04s" },
        ],
      });
    },

    // ── PREFLIGHT ───────────────────────────────────────────────────────────
    "PREFLIGHT.CODER_LINT": () =>
      step({
        status: "success",
        summary: "House lint profile clean over 6 changed files.",
        durationMs: sec(22),
        log: [info("coder.lint", "coder lint --profile house --changed-only"), ok("coder.lint", "0 findings across 6 files")],
        effects: [
          { type: "validation", tool: "coder", name: "Coder lint profile", command: "coder lint --profile house --changed-only", status: "pass", durationMs: 22_000, output: "0 findings across 6 files" },
        ],
      }),

    "PREFLIGHT.SECRET_SCAN": () =>
      step({
        status: "success",
        summary: "No credentials or internal hostnames in the diff.",
        durationMs: sec(9),
        log: [ok("coder.secrets", "0 matches across 6 files, 284 added lines")],
      }),

    "PREFLIGHT.DIFF_REVIEW": () =>
      step({
        status: "success",
        summary: "Diff hygiene clean; no stray debug output.",
        durationMs: sec(16),
        log: [ok("coder.diff", "No TODO, System.out or commented-out code in the added lines")],
      }),

    "PREFLIGHT.COMMIT_MSG": (ctx) =>
      step({
        status: "success",
        summary: "Commit message drafted with the issue key and Change-Id.",
        durationMs: sec(12),
        outcome: "success",
        log: [
          ok("git.message", "feat(payout): accept Idempotency-Key on submission"),
          dbg("git.message", "Body: 6 lines · NIMBO-4821 · Change-Id preserved"),
          dbg("git.message", `Change-Id: ${String(ctx.run.config.changeId ?? CHANGE_ID)}`),
        ],
      }),

    // ── COMMIT ──────────────────────────────────────────────────────────────
    "COMMIT.STAGE": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "6 files staged." : "3 files staged for the repair.",
        durationMs: sec(3.5),
        log: [info("git.stage", ctx.attempt === 1 ? "git add — 6 paths from the change plan" : "git add — 3 repaired paths")],
      }),

    "COMMIT.COMMIT_CREATE": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "Commit 4b1e77a created." : "Amended into 4b1e77a (single-commit change).",
        durationMs: sec(2.2),
        log: [
          info("git.commit", ctx.attempt === 1 ? "git commit" : "git commit --amend --no-edit"),
          ok("git.commit", ctx.attempt === 1 ? "[feature/NIMBO-4821 4b1e77a] feat(payout): accept Idempotency-Key on submission" : "[feature/NIMBO-4821 4b1e77a] amended — repairs folded into the change"),
        ],
      }),

    "COMMIT.CHANGE_ID": () =>
      step({
        status: "success",
        summary: "Change-Id preserved across patch sets.",
        durationMs: sec(1.4),
        outcome: "success",
        log: [ok("git.commit", `Change-Id: ${CHANGE_ID}`)],
      }),

    // ── SYNC_WITH_MASTER ────────────────────────────────────────────────────
    "SYNC_WITH_MASTER.FETCH": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "master advanced by 7 commits since the run started." : "master unchanged since the last sync.",
        durationMs: sec(11),
        log:
          ctx.attempt === 1
            ? [
                info("git.fetch", "git fetch origin master"),
                warn("git.fetch", "origin/master a91c2f4 → e30b96d (7 commits, 2 touching payout-core)"),
              ]
            : [info("git.fetch", "git fetch origin master"), ok("git.fetch", "Already up to date with e30b96d")],
      }),

    "SYNC_WITH_MASTER.REBASE": (ctx) =>
      ctx.attempt === 1
        ? step({
            status: "success",
            summary: "Rebase onto e30b96d stopped on 2 conflicting files.",
            durationMs: sec(19),
            log: [
              info("git.rebase", "git rebase origin/master"),
              warn("git.rebase", "CONFLICT (content): PayoutSubmissionService.java"),
              warn("git.rebase", "CONFLICT (content): payout-persistence/…/db/migration — V47 taken upstream"),
            ],
          })
        : step({
            status: "success",
            summary: "Rebase clean; already on the tip of master.",
            durationMs: sec(6),
            log: [ok("git.rebase", "Current branch is up to date with origin/master")],
          }),

    "SYNC_WITH_MASTER.CONFLICTS": (ctx) =>
      ctx.attempt === 1
        ? step({
            status: "success",
            summary: "2 conflicts resolved: kept upstream metrics refactor, renumbered the migration to V48.",
            durationMs: min(2.4),
            log: [
              info("agent.conflict", "PayoutSubmissionService.java — upstream extracted a MetricsRecorder"),
              ok("agent.conflict", "Resolved: replay branch re-expressed against MetricsRecorder; upstream structure kept"),
              warn("agent.conflict", "Migration collision — upstream landed its own V47__payout_gateway_timeout.sql"),
              ok("agent.conflict", "Resolved: our migration renamed V47 → V48__idempotency_records.sql"),
              ok("git.rebase", "Successfully rebased and updated refs/heads/feature/NIMBO-4821"),
            ],
          })
        : step({ status: "success", summary: "No conflicts.", durationMs: sec(1.2), log: [ok("agent.conflict", "Nothing to resolve")] }),

    "SYNC_WITH_MASTER.POST_REBASE": (ctx) =>
      ctx.attempt === 1
        ? step({
            status: "success",
            summary: "Post-rebase re-validation green: 412 unit + 38 integration tests.",
            durationMs: min(4.2),
            outcome: "success",
            log: [
              info("gradle.run", "./gradlew test integrationTest — re-run after rebase"),
              ok("gradle.out", "412 tests completed, 0 failed"),
              ok("gradle.out", "38 tests completed, 0 failed"),
              ok("gradle.out", "BUILD SUCCESSFUL in 4m 06s"),
            ],
            effects: [
              { type: "validation", tool: "junit", name: "Post-rebase re-validation", command: "./gradlew test integrationTest", status: "pass", durationMs: 246_000, testsRun: 450, testsFailed: 0, output: "412 unit + 38 integration tests, 0 failed\nBUILD SUCCESSFUL in 4m 06s" },
            ],
          })
        : step({
            status: "success",
            summary: "Base unchanged; re-validation not required.",
            durationMs: sec(4),
            outcome: "success",
            log: [info("gradle.run", "Skipped — base revision identical to the validated tree")],
          }),

    // ── PUBLISH_PATCHSET ────────────────────────────────────────────────────
    "PUBLISH_PATCHSET.PUSH": (ctx) => {
      const psNumber = 2 + ctx.attempt; // patch sets 1–2 predate the run
      const revision = ctx.attempt === 1 ? "c7f41ab" : "9d0e5b3";
      return step({
        status: "success",
        summary: `Pushed patch set ${psNumber} (${revision}).`,
        durationMs: sec(14),
        log: [
          info("gerrit.push", "git push origin HEAD:refs/for/master"),
          dbg("gerrit.push", "remote: Processing changes: refs: 1, updated: 1"),
          ok("gerrit.push", `remote: ${GERRIT}/${psNumber} — patch set ${psNumber} uploaded`),
        ],
        effects: [
          {
            type: "patch_set",
            number: psNumber,
            changeId: CHANGE_ID,
            changeNumber: CHANGE_NUMBER,
            revision,
            reason: ctx.attempt === 1 ? "Initial orchestrated patch set (rebased onto e30b96d)" : "Sonar repair: 4 issues fixed, coverage raised",
            meta:
              ctx.attempt === 1
                ? { filesChanged: 6, insertions: 284, deletions: 37 }
                : { filesChanged: 8, insertions: 143, deletions: 61 },
          },
        ],
        contextPatch: { patchSetNumber: psNumber },
      });
    },

    "PUBLISH_PATCHSET.REGISTER": (ctx) =>
      step({
        status: "success",
        summary: `Patch set ${2 + ctx.attempt} registered against change ${CHANGE_NUMBER}.`,
        durationMs: sec(3.1),
        log: [ok("gerrit.register", `Change ${CHANGE_NUMBER} now at patch set ${2 + ctx.attempt}`)],
        effects:
          ctx.attempt === 1
            ? [{ type: "external_reference", system: "gerrit", refKey: `change ${CHANGE_NUMBER}`, title: "feat(payout): accept Idempotency-Key on submission", url: GERRIT, relation: "change", excerpt: `Change-Id ${CHANGE_ID}` }]
            : [],
      }),

    "PUBLISH_PATCHSET.REVIEWERS": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "3 reviewers attached from CODEOWNERS." : "Existing reviewers notified.",
        durationMs: sec(4.4),
        outcome: "success",
        log:
          ctx.attempt === 1
            ? [ok("gerrit.reviewers", "Added m.tehrani, s.rahimi, payments-oncall from CODEOWNERS")]
            : [info("gerrit.reviewers", "Reviewers unchanged; notified of patch set 4")],
      }),

    // ── CI_OBSERVATION ──────────────────────────────────────────────────────
    "CI_OBSERVATION.JENKINS_WAIT": (ctx) =>
      step({
        status: "success",
        summary: ctx.attempt === 1 ? "Build #4471 finished in 8m 12s." : "Build #4488 finished in 7m 54s.",
        durationMs: ctx.attempt === 1 ? min(8.2) : min(7.9),
        log: [
          info("jenkins.wait", `Polling delivery-service-verify for patch set ${2 + ctx.attempt}`),
          dbg("jenkins.wait", "Stage: checkout → build → unit → integration → package"),
          ok("jenkins.wait", ctx.attempt === 1 ? "Build #4471 SUCCESS in 8m 12s" : "Build #4488 SUCCESS in 7m 54s"),
        ],
      }),

    "CI_OBSERVATION.JENKINS_RESULT": (ctx) => {
      const ps = 2 + ctx.attempt;
      const build = ctx.attempt === 1 ? 4471 : 4488;
      return step({
        status: "success",
        summary: `Jenkins voted Verified +1 on patch set ${ps}.`,
        durationMs: sec(4),
        log: [ok("jenkins.result", `Verified +1 · delivery-service-verify #${build}`)],
        effects: [
          {
            type: "patch_set_verdict",
            number: ps,
            jenkins: { verdict: "pass", label: "Verified +1", url: `https://jenkins.internal/job/delivery-service-verify/${build}/`, durationMs: ctx.attempt === 1 ? 492_000 : 474_000 },
          },
          { type: "external_reference", system: "jenkins", refKey: `#${build}`, title: `delivery-service-verify #${build}`, url: `https://jenkins.internal/job/delivery-service-verify/${build}/`, relation: "verification", excerpt: `Patch set ${ps} · SUCCESS` },
        ],
      });
    },

    "CI_OBSERVATION.SONAR_WAIT": (ctx) =>
      step({
        status: "success",
        summary: "Quality gate computed.",
        durationMs: ctx.attempt === 1 ? min(3.1) : min(2.8),
        log: [
          info("sonar.wait", `Polling quality gate for patch set ${2 + ctx.attempt}`),
          dbg("sonar.wait", "Analysis task in progress…"),
          info("sonar.wait", "Analysis complete; gate evaluated"),
        ],
      }),

    "CI_OBSERVATION.SONAR_RESULT": (ctx) => {
      const ps = 2 + ctx.attempt;
      if (ctx.attempt === 1) {
        return step({
          status: "success",
          summary: "Sonar voted Code-Review −1: quality gate failed with 4 issues on new code.",
          durationMs: sec(6),
          log: [
            err("sonar.result", "Quality gate FAILED · Code-Review −1"),
            err("sonar.issue", "BLOCKER java:S2095 IdempotencyKeyService.java:118 — DigestInputStream is never closed"),
            err("sonar.issue", "CRITICAL java:S3776 PayoutSubmissionService.java:96 — Cognitive Complexity 24 > 15"),
            warn("sonar.issue", "MAJOR java:S2259 PayoutSubmissionController.java:74 — possible NullPointerException"),
            warn("sonar.issue", "MINOR java:S1192 PayoutSubmissionController.java:52 — literal duplicated 4 times"),
            err("sonar.gate", "Coverage on New Code 71.4% < 80.0%"),
            err("sonar.gate", "Reliability Rating on New Code C < A"),
          ],
          effects: [
            {
              type: "patch_set_verdict",
              number: ps,
              sonar: { verdict: "fail", label: "Code-Review −1", url: `https://sonar.internal/dashboard?id=platform%3Adelivery-service&pullRequest=${CHANGE_NUMBER}` },
              issueCount: 4,
              summary: "Quality gate failed: 4 issues on new code, coverage 71.4%.",
              meta: {
                sonarIssues: SONAR_ISSUES,
                qualityGate: {
                  name: "Nimbo Way",
                  status: "FAILED",
                  conditions: [
                    { metric: "Coverage on New Code", actual: "71.4%", threshold: "≥ 80.0%", status: "ERROR" },
                    { metric: "Reliability Rating on New Code", actual: "C", threshold: "A", status: "ERROR" },
                    { metric: "Maintainability Rating on New Code", actual: "A", threshold: "A", status: "OK" },
                    { metric: "Duplicated Lines on New Code", actual: "0.0%", threshold: "≤ 3.0%", status: "OK" },
                    { metric: "Security Hotspots Reviewed", actual: "100%", threshold: "100%", status: "OK" },
                  ],
                },
              },
            },
            { type: "external_reference", system: "sonar", refKey: "platform:delivery-service", title: "Quality gate · patch set 3", url: `https://sonar.internal/dashboard?id=platform%3Adelivery-service&pullRequest=${CHANGE_NUMBER}`, relation: "quality", excerpt: "FAILED · 4 issues on new code · coverage 71.4%" },
          ],
          contextPatch: { sonarIssues: SONAR_ISSUES },
        });
      }
      return step({
        status: "success",
        summary: "Sonar voted Code-Review +1: quality gate passed.",
        durationMs: sec(5),
        log: [
          ok("sonar.result", "Quality gate PASSED · Code-Review +1"),
          ok("sonar.gate", "Coverage on New Code 86.2% ≥ 80.0%"),
          ok("sonar.gate", "Reliability Rating on New Code A"),
          ok("sonar.result", "0 issues on new code"),
        ],
        effects: [
          {
            type: "patch_set_verdict",
            number: ps,
            sonar: { verdict: "pass", label: "Code-Review +1", url: `https://sonar.internal/dashboard?id=platform%3Adelivery-service&pullRequest=${CHANGE_NUMBER}` },
            issueCount: 0,
            summary: "Quality gate passed: 0 issues on new code, coverage 86.2%.",
            meta: {
              qualityGate: {
                name: "Nimbo Way",
                status: "PASSED",
                conditions: [
                  { metric: "Coverage on New Code", actual: "86.2%", threshold: "≥ 80.0%", status: "OK" },
                  { metric: "Reliability Rating on New Code", actual: "A", threshold: "A", status: "OK" },
                  { metric: "Maintainability Rating on New Code", actual: "A", threshold: "A", status: "OK" },
                  { metric: "Duplicated Lines on New Code", actual: "0.0%", threshold: "≤ 3.0%", status: "OK" },
                  { metric: "Security Hotspots Reviewed", actual: "100%", threshold: "100%", status: "OK" },
                ],
              },
            },
          },
        ],
      });
    },

    "CI_OBSERVATION.AGGREGATE": (ctx) =>
      ctx.attempt === 1
        ? step({
            status: "success",
            outcome: "ci_failed",
            summary: "Verified +1 but Code-Review −1 — repairable without human input.",
            durationMs: sec(3),
            log: [
              warn("ci.aggregate", "Jenkins +1 · Sonar −1 → repairable"),
              info("ci.aggregate", "All 4 findings are in code this change introduced; no suppression will be used"),
            ],
          })
        : step({
            status: "success",
            outcome: "success",
            summary: "Verified +1 and Code-Review +1 — all verdicts positive.",
            durationMs: sec(2.5),
            log: [ok("ci.aggregate", "Jenkins +1 · Sonar +1 → ready for human review")],
          }),

    // ── CI_REPAIR ───────────────────────────────────────────────────────────
    "CI_REPAIR.TRIAGE": () =>
      step({
        status: "success",
        summary: "All 4 findings attributed to this change; none are pre-existing.",
        durationMs: sec(21),
        log: [
          info("agent.triage", "Blame check on each finding's line range"),
          ok("agent.triage", "4/4 findings sit on lines added by patch set 3"),
          ok("agent.triage", "Jenkins is green — no test regression to chase"),
        ],
      }),

    "CI_REPAIR.ISSUE_ANALYSIS": () =>
      step({
        status: "success",
        summary: "Each finding mapped to a concrete fix.",
        durationMs: min(1.4),
        log: [
          info("agent.analysis", "S2095 → wrap DigestInputStream in try-with-resources"),
          info("agent.analysis", "S3776 → extract replay branch into IdempotentReplayResolver"),
          info("agent.analysis", "S2259 → Optional binding for the header, 400 when blank"),
          info("agent.analysis", "S1192 → constant IDEMPOTENCY_KEY_HEADER"),
          warn("agent.analysis", "Coverage gap: the 24h expiry boundary and the 422 path are untested"),
        ],
      }),

    "CI_REPAIR.REPAIR_PLAN": () =>
      step({
        status: "success",
        summary: "4 fixes plus 6 tests to clear the coverage condition.",
        durationMs: sec(28),
        log: [ok("agent.plan", "No @SuppressWarnings and no Sonar exclusions — every finding is fixed at the source")],
      }),

    "CI_REPAIR.REPAIR_EDIT": () =>
      step({
        status: "success",
        outcome: "success",
        summary: "4 Sonar issues fixed; 6 tests added (+143 / −61).",
        durationMs: min(5.6),
        log: [
          ok("agent.edit", "S2095 fixed — try-with-resources around DigestInputStream"),
          ok("agent.edit", "S3776 fixed — IdempotentReplayResolver extracted; complexity 24 → 9"),
          ok("agent.edit", "S2259 fixed — Optional<String> header binding, 400 on blank"),
          ok("agent.edit", "S1192 fixed — IDEMPOTENCY_KEY_HEADER constant"),
          ok("agent.edit", "6 tests added: expiry boundary, 422 mismatch, blank header, replay counter"),
          dbg("agent.edit", "8 files changed, 143 insertions(+), 61 deletions(-)"),
        ],
        contextPatch: { sonarIssues: SONAR_ISSUES.map((i) => ({ ...i, status: "fixed" as const })) },
      }),

    // ── READY_FOR_HUMAN_REVIEW ──────────────────────────────────────────────
    "READY_FOR_HUMAN_REVIEW.HANDOFF": () =>
      step({
        status: "success",
        outcome: "success",
        summary: "Handoff composed. Patch set 4 is green and awaiting human review.",
        durationMs: sec(24),
        log: [
          ok("agent.handoff", "Change 218447 patch set 4 · Verified +1 · Code-Review +1"),
          info("agent.handoff", "Review first: IdempotentReplayResolver — it carries the AC-2/AC-3 branch logic"),
          info("agent.handoff", "Migration renumbered V47 → V48 during the rebase; confirm ordering with the DBA"),
          info("agent.handoff", "Follow-up NIMBO-4712 (client SDK retries) is unblocked by this change"),
        ],
      }),
  },
};

export const FLAGSHIP_FALLBACK = genericStep;
