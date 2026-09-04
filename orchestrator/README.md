# AI Software Delivery Orchestrator — Milestone 1

An internal tool that drives an AI coding agent from a Jira task to a Gerrit patch set
that is ready for human review.

Milestone 1 is the **product foundation and the frontend**. The workflow engine, the
domain model, the persistence layer and every screen are real. Agent execution runs
against a scripted **mock runtime** — no Jira, Confluence, Gerrit, Jenkins, Sonar, Goose
or Git integration exists yet, and the app makes **no outbound network call of any kind**.

---

## Running it

Requires Node 20+ (developed on 22).

```bash
cd orchestrator
npm install
cp .env.example .env  # turns off Next.js telemetry; see "Not included" below
npm run db:reset      # create the SQLite schema and seed six demo runs
npm run dev           # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Apply `src/db/schema.ts` to the SQLite file |
| `npm run db:seed` | Rebuild the demo history (destructive) |
| `npm run db:reset` | Delete the database, re-push, re-seed |

The database lives at `.data/orchestrator.db` (gitignored). Override with `ORCHESTRATOR_DB`.

> **Note:** `next build` writes to the same `.next` directory the dev server uses. Stop
> `npm run dev` before building, or the running dev server will start serving broken assets.

### Where to look first

1. **Runs** (`/runs`) — six seeded runs covering every terminal state.
2. **NIMBO-4821** — the reference run. Artifact-generation failure and repair, a rebase
   with conflicts, patch set 3 with Sonar −1 and four issues, a repair, patch set 4 all
   green, `READY_FOR_HUMAN_REVIEW`.
3. **New task** (`/intake`) — dispatch a live run. Pick *Observed* (≈3 min) to watch the
   state machine advance over SSE, or *Instant* (≈6 s) to jump to the result.

---

## Architecture

```
src/
  domain/        states, hierarchy, transition function — pure, no I/O
  db/            drizzle schema, SQLite client, seeder
  orchestrator/  engine (owns the state machine), store, bus, clock, scheduler, snapshot
  runtime/       AgentRuntime interface, MockAgentRuntime, GooseAgentRuntime placeholder
  scenarios/     scripted mock behaviour
  app/           routes and API handlers
  components/    ui/ primitives, run/ the orchestration dashboard
```

### The orchestrator owns the state machine

This is the load-bearing decision. The agent runtime is handed **one child state at a
time** and may report an outcome from a closed vocabulary:

```
success | needs_repair | ci_failed | revalidate | blocked | failed
```

It cannot name a state, mutate the run, or write to the database. `decideNext()` in
`src/domain/transitions.ts` is a pure function and the only place a next state is chosen.
The engine also owns attempt counting, the repair budget, and what a failure *means*: a
failure inside a repairable phase becomes `needs_repair`; anywhere else it ends the run.

Consequences worth keeping:

- A prompt-injected or malfunctioning agent cannot skip validation, jump to
  `READY_FOR_HUMAN_REVIEW`, or loop forever — the budget is enforced outside it.
- The transition function is testable without a runtime at all.
- Swapping the mock for Goose changes nothing about control flow.

### Other decisions

**Loops are first-class, not error handling.** `LOCAL_VALIDATION → IMPLEMENTATION`,
`CI_REPAIR → LOCAL_VALIDATION` and `SYNC_WITH_MASTER → LOCAL_VALIDATION` are ordinary
edges. Re-entering a state creates a *new* `StateExecution` with an incremented attempt
rather than mutating the old one, so the history stays honest and the UI can show
"attempt 2" instead of pretending the first attempt did not happen.

**The runtime describes; the orchestrator writes.** A step returns declarative
`AgentEffect`s (`validation`, `patch_set`, `patch_set_verdict`, `external_reference`,
`blocker`). The engine turns them into rows. No runtime ever holds a database handle.

**Time is injected.** `Clock` has a real implementation (with a speed multiplier for
demos) and a virtual one. The seeder runs the *real engine* under a virtual clock and
then shifts the timestamps into place — so seeded history is structurally identical to a
live run, not hand-written fixtures.

**SSE carries signals, not records.** The bus says "run X moved"; the SSE route re-reads
SQLite and pushes a snapshot at most every 400 ms with only events past the client's
cursor. A run at 400× speed emits hundreds of events per second without flooding the
browser, and a dropped connection recovers by re-reading rather than replaying.

**SQLite via Drizzle.** Typed schema, no migration ceremony during a milestone that is
still changing shape, and a single-file database that makes `db:reset` trivial. The
store module is the only thing that touches Drizzle, so Postgres later is a store change.

**Blockers are questions, not errors.** A blocker carries the decision a person must
make and the options, and the run parks with the change intact.

### Visual language

Dark canvas, one elevated surface, hairline rules. Structure comes from spacing and
alignment rather than stacked cards. Colour is reserved almost entirely for status —
if something is coloured, it means something — and motion only ever marks work in
progress. Fonts are system stacks: no webfont fetch, no runtime dependency. Numbers that
change in place use tabular figures so nothing jitters as it ticks.

---

## What is mocked

| Area | Milestone 1 |
| --- | --- |
| Jira, Confluence | Scripted discovery findings recorded as `ExternalReference` rows |
| Repository, Git | No clone, no checkout, no commit — narrated only |
| Gradle, tests, artifacts | Scripted `ValidationResult` rows with realistic output |
| Coder preflight | Scripted |
| Gerrit | Patch set numbers, revisions and Change-Ids are synthetic |
| Jenkins, Sonar | Verdicts, four Sonar issues and quality-gate conditions are scripted |
| Agent execution | `MockAgentRuntime` replays a scenario, streaming lines over the step's duration |
| Integrations page | Connection states come from a seeded table; nothing is probed |
| URLs shown in the UI | Point at fictional internal hosts and are never fetched |

**Real:** the state machine, transitions, attempt and budget accounting, the hierarchical
execution record, event log and cursor, persistence, SSE, cancellation, and every screen.

---

## Adding Goose in Milestone 3

The seam already exists: `src/runtime/AgentRuntime.ts`.

```ts
export interface AgentRuntime {
  readonly id: string;
  readonly model: string;
  health(): Promise<RuntimeHealth>;
  execute(ctx: AgentStepContext): Promise<AgentStepResult>;
}
```

`AgentStepContext` gives the runtime the run, the state and child state to execute, the
attempt number, the accumulated `workingContext`, an `emit` callback for streaming log
lines, an `AbortSignal`, and a `wait` function. `AgentStepResult` returns a status, a
summary, optional effects, a context patch, and — only for the last child of a phase —
an `outcome`.

`GooseAgentRuntime` in `src/runtime/GooseAgentRuntime.ts` is a compiling placeholder that
documents the intended implementation:

1. Map `(state, childKey)` to a Goose recipe; pass `workingContext` as session context.
2. Run Goose out-of-process with JSONL output and map each line onto `ctx.emit`, so the
   existing activity feed shows real tool calls with **no UI change**.
3. Translate evidence-bearing tool results (a Gradle exit status, a Gerrit push) into
   `AgentEffect`s for the orchestrator to persist.
4. Take `status`, `summary` and `outcome` from the recipe's structured answer. `outcome`
   stays a closed vocabulary — anything unrecognised is treated as `failed`.
5. Wire `ctx.signal` to killing the Goose process group.

Registration is a one-line change in `src/runtime/index.ts`, selected by `AGENT_RUNTIME`.
Only the mock is registered today, so the orchestrator cannot reach for a process that
is not there.

**Milestone 2** is the integration layer: real Jira/Confluence readers, a Git workspace
provisioner, Gerrit publication, and Jenkins/Sonar pollers — each behind an adapter the
orchestrator owns, never called by the agent directly.

---

## Not included, deliberately

No external network calls. No analytics or telemetry: the app adds none, and Next.js's
own anonymous telemetry is switched off by `NEXT_TELEMETRY_DISABLED=1` in `.env.example`
(`npx next telemetry disable` does the same thing machine-wide). No runtime SaaS dependency. No reviewer agent — V1 stops at
`READY_FOR_HUMAN_REVIEW`, and the independent reviewer arrives later.
