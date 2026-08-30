---
name: aegis-runtime-reliability
description: >
  Detects, reproduces, and repairs Node.js event-loop starvation in a target
  repository. Runs a closed loop of reproduce, measure, diagnose, repair, and
  verify. Use this skill when a Node.js service shows high tail
  latency, blocked event loop, or health-check timeouts under load.
---

# AEGIS Runtime Reliability — Event-Loop Starvation

## Success condition

A reproduction requires all three signals under the same load: elevated
event-loop delay, degraded independent health traffic, and poor target-endpoint
latency. The candidate is accepted only when `verify.mjs` returns `VERIFIED`.

## Guiding Principle

**The LLM reasons and orchestrates; deterministic scripts do the measuring and
own the verdict.** You must NEVER invent a metric, estimate a latency, or
decide pass/fail yourself. Every measurement comes from `run_experiment.mjs`.
Every verdict comes from `verify.mjs`. Your job is to read their output and
act on it.

---

## Architecture

```
Root Agent (you)
├── Repository Analyst — static analysis and experiment inputs
├── Runtime Profiler — harness configuration and raw measurements
└── Performance Repairer — the smallest evidence-backed code change
```

### Delegation is an execution requirement

Use real subagent tasks when the runtime exposes subagent delegation. Create
only the task needed for the current phase and give it only its matching
playbook plus the required artifacts. Do not say a role was delegated unless a
subagent task was actually created.

At the start, launch these independent lanes in parallel:

1. **Repository Analyst:** inspect the repository without running application
   code; return suspects, entry point, health endpoint, package manager, and
   actual test command.
2. **Profiler preparation:** inspect only the AEGIS harness dependency state
   and wait for the Analyst's endpoint details before creating the config.

The baseline run waits for the Analyst's result. Candidate measurement waits for
the Repairer. Never run two load experiments concurrently. If the runtime has no
subagent mechanism, preserve the same lanes with parallel read-only tool calls;
do not pretend that sequential work is parallel.

### Subagent context handoff is explicit

Subagents do **not** inherit the root agent's loaded skill, decisions, or
playbooks. Before creating a subagent task, resolve this skill directory to an
absolute path and include all of the following in that subagent's prompt:

1. its role and current phase;
2. the absolute path to its exact playbook, with an instruction to read it in
   full before doing any work;
3. the allowed inputs and allowed side effects for that phase;
4. the required output schema or artifact paths; and
5. an instruction to stop and report a blocker if the playbook cannot be read.

Do not substitute a remembered summary for the playbook. Do not give a
subagent a relative `references/...` path. The root agent remains responsible
for reading the relevant playbook before delegation and for validating the
returned artifact against its contract.

**MCP**: GitHub read tools are allowed. GitHub writes (branch, commit, PR)
require explicit human approval.

**Execution**: All code runs in the Daytona sandbox. Never execute repo code
outside the sandbox. Never put secrets in the sandbox.

### Required startup checklist

1. Resolve the skill directory and playbook paths to absolute paths.
2. Start the Repository Analyst and the Profiler preparation lanes in parallel.
3. The Profiler runs the environment preflight and automatically prepares the
   isolated sandbox: install a supported Node.js runtime when needed, then
   install target and harness dependencies once using their lockfiles. Never
   ask the user to approve this sandbox-only setup. If setup fails, report the
   exact error and stop because a baseline cannot be produced.
4. Wait for the Analyst's structured report, then select the target endpoint,
   health endpoint, payload, package manager, and real functional command.
5. Run one baseline. Only after the baseline succeeds, present the required
   evidence and wait for explicit human approval before any target-code edit.

---

## State Machine

Every engagement follows this sequence. Do NOT skip steps.

```
IDLE
 │
 ▼
ANALYZE ──→ Read repo, identify suspect code paths
 │
 ▼
REPRODUCE ──→ Run baseline experiment (scripts/run_experiment.mjs)
│            MUST succeed (exit 0) before proceeding
│            If exit != 0: fix config and retry, do NOT guess metrics
 ▼
BASELINE REVIEW ──→ Present baseline evidence and ask to continue to diagnosis
 │                  Wait for explicit human approval before diagnosis
 │                  If declined: stop and retain the baseline evidence
 ▼
DIAGNOSE ──→ Interpret approved baseline metrics to identify root cause
 │            Produce the smallest evidence-backed repair proposal
 ▼
REPAIR REVIEW ──→ Present the proposed code change and ask to apply it
 │                 Wait for explicit human approval before any code edit
 ▼
REPAIR ──→ Delegate to Performance Repairer (max 3 attempts)
 │          Repairer edits code, then Profiler re-runs experiment
 │          verify.mjs compares candidate vs baseline
 │          │
 │          ├─ VERIFIED → Ask human: "The candidate passed verification. Do you want to try and repair further?"
 │          │             (Yes → loop back to REPAIR, No → proceed to PR REVIEW)
 │          ├─ FAILED   → Ask human: "The candidate failed verification but may have improved. Is this valuation good enough?"
 │          │             (Yes → loop back to REPAIR for more fixes, No → proceed to PR REVIEW)
 │          ├─ RETRY    → Re-run experiment (transient issue)
 │          ├─ INCOMPARABLE → Fix protocol mismatch, re-run
 │          └─ ESCALATE → Stop, report evidence to human
 ▼
PR REVIEW ──→ Present baseline/candidate comparison and VERIFIED verdict
 │            Ask approval to create the branch, commit, and pull request
 │            human_approval_required_before_github_write = true
 ▼
PR ──→ Commit changes and open a pull request
       automatic_merge = false
```

### Baseline approval gate

After a successful baseline and before diagnosis, report the harness values
that establish the baseline: event-loop p99, health success rate and p99,
target p99, target error count, and functional-test result. Then ask exactly
what action to take, for example:

> Baseline captured: event-loop p99 is `<value> ms`; health is `<success>%`
> successful with p99 `<value> ms`; target p99 is `<value> ms`; functional
> tests are `<passed>` passed and `<failed>` failed. Should I continue to
> diagnose the cause and prepare the smallest repair proposal?

Do not diagnose in detail, delegate the Repairer, edit target code, or run a
candidate experiment until the human explicitly approves.

### Repair approval gate

After approved diagnosis and before a target-code edit, present the root cause,
the exact files/functions to change, and the expected behavior preserved by the
repair. Ask for approval to apply that specific repair and run the candidate
experiment. Do not edit code before approval. This is the second user decision.

### Pull request approval gate

Only after `verify.mjs` returns `VERIFIED`, present the baseline and candidate
values side by side with the verifier's raw verdict. Ask whether to create the
branch, commit, and pull request. Do not make GitHub writes before approval.
This is the third and final user decision.

### User interaction policy

Ask for a user decision at exactly these three workflow checkpoints:

1. baseline captured: continue to diagnosis;
2. repair proposal ready: apply the proposed code change; and
3. candidate verified (or partially improved): loop for more fixes or create the pull request.

Do not ask for approval to provision the isolated sandbox, install project or
harness dependencies, choose a smoke check, or retry a bounded setup step. On a
blocking setup or measurement failure, report the exact error and stop without
turning it into an approval question.

---

## Delegation Playbooks

Each subagent has a detailed playbook in `references/`. Read the relevant
playbook before delegating that role. Do not load all playbooks into every role.

| Subagent             | Playbook                                     |
|----------------------|----------------------------------------------|
| Repository Analyst   | `references/analyst-playbook.md`             |
| Runtime Profiler     | `references/profiler-playbook.md`            |
| Performance Repairer | `references/repairer-playbook.md`            |

Evidence and verification contracts are in:
- `references/evidence-contract.md`
- `references/verification-contract.md`

### Required prompt shape

Replace `{skill_dir}` with this skill's resolved absolute directory before
creating the task. These prompts are minimum handoff content, not optional
examples.

**Repository Analyst**

```text
You are the Repository Analyst for the ANALYZE phase. Before any work, read
{skill_dir}/references/analyst-playbook.md in full. Perform static analysis
only: do not execute repository code. Return only the JSON contract required by
that playbook, including package_manager and the actual test_command (or null
when none exists). If the playbook cannot be read, stop and report that blocker.
```

**Runtime Profiler preparation**

```text
You are the Runtime Profiler in the preparation phase. Before any work, read
{skill_dir}/references/profiler-playbook.md in full. Run only the documented
Node/npm preflight and automatic sandbox setup. You may provision Node >=18 and
install target and local harness dependencies inside the sandbox; do not modify
the host or install global packages. Do not run the target application or create
an experiment config until the Analyst artifact is supplied. Return the required
raw JSON result. If setup fails, report the error without asking the user.
```

**Runtime Profiler experiment**

```text
You are the Runtime Profiler for the supplied baseline or candidate phase.
Before any work, read {skill_dir}/references/profiler-playbook.md in full. Use
the supplied Analyst artifact and the same saved config for both runs. Run only
the AEGIS harness and verifier; return their raw JSON outputs. Do not interpret
the verdict, alter target code, or replace a missing test command with a no-op.
If the playbook cannot be read, stop and report that blocker.
```

**Performance Repairer**

```text
You are the Performance Repairer for an approved REPAIR phase. Before any work,
read {skill_dir}/references/repairer-playbook.md in full. You may edit only the
target repository files needed for the supplied evidence-backed suspect. Return
the minimal diff summary and affected tests; do not run or claim a verification
verdict. If the playbook cannot be read, stop and report that blocker.
```

---

## Script Contracts (MUST follow exactly)

### `scripts/run_experiment.mjs`

```
node scripts/run_experiment.mjs --config <experiment-config.json> --output <metrics.json>
```

- **Exit 0**: Experiment completed. Metrics JSON written to `--output` path.
- **Exit non-zero**: Experiment crashed. NO metrics file written.
  **You must not proceed as if results exist.**
- **Metrics schema**: `{ protocol_hash, event_loop, health, target, functional }`
- **Protocol hash**: Deterministic — same inputs always produce the same hash.
  Baseline and candidate MUST use the same experiment config to be comparable.

### Server lifecycle is owned by the harness

`run_experiment.mjs` starts the target process, waits for readiness, captures
its output, and terminates its process group on success or failure. Therefore:

- Put the foreground start command in `start_command`; never append `&`, use
  `nohup`, redirect output, or start the service in a separate tool call.
- Never run raw `autocannon` for baseline or candidate evidence. The harness
  already drives it and records the compatible metrics.
- Do not use `timeout` around a server command: a healthy server is meant to
  keep running, and the harness is responsible for stopping it.
- Do not install `autocannon` globally or inspect/kill processes as normal
  workflow. Investigate a port conflict only after the harness reports one.

This avoids the common cancellation where a background process retains the
interactive tool's stdout/stderr pipes and the tool never reaches completion.

### `scripts/verify.mjs`

```
node scripts/verify.mjs --baseline <baseline/metrics.json> \
                         --candidate <candidate/metrics.json> \
                         --policy config/verification-policy.json \
                         --output <verdict.json>
```

- **Exit 0**: Verifier ran successfully. Read the `verdict` field in the JSON.
- **Exit non-zero**: Verifier itself crashed (script error, missing file).
  This is NOT the same as a FAILED verdict.
- **Verdict values**: `VERIFIED | FAILED | RETRY | ESCALATE | INCOMPARABLE`
- **You must route on the verdict field, not on the exit code.**

---

## Guardrails (NON-NEGOTIABLE)

1. **Reproduction is mandatory.** Never diagnose from static reading alone.
   You must have a successful baseline experiment before attempting repair.

2. **Verifier owns the verdict.** Never override, reinterpret, or skip
   `verify.mjs`. If it says FAILED, the candidate failed — period.

3. **Never fabricate a measurement.** If `run_experiment.mjs` crashes,
   fix the config and re-run. Do not invent metrics.

4. **Functional regression fails the candidate.** Even if latency improved
   dramatically, a single functional test failure means the candidate is
   rejected.

5. **Max 3 repair attempts, then escalate.** After 3 failed attempts,
   stop and present all evidence to the human. Do not keep trying.

6. **Sandbox only.** Execute repository code only in the Daytona sandbox.
   Never run it on the host. Never put secrets in the sandbox.

7. **Separate reads from writes.** Use GitHub read tools freely. Use
   write tools (branch, commit, PR) only after human approval.

8. **No auto-merge.** `automatic_merge = false` in policy. PRs are
   opened for human review.

9. **Narrowly scoped changes.** Each repair should touch the minimum
   code necessary. No drive-by refactors.

10. **Every change is evidence-backed.** Every claim must cite the
    specific metrics from the experiment output.

11. **Minimize exploratory tool use.** Batch independent reads, use `rg` to
    locate code and package metadata, and inspect the exact files returned.
    Do not repeatedly re-read files, re-install dependencies, or probe the same
    endpoint manually after the harness has produced evidence.

12. **One bounded diagnosis loop.** Build the config once from the Analyst's
    report; on a harness failure, make one config/environment correction per
    retry and report the concrete error. After two setup failures, escalate
    rather than cycling through guesses.

13. **No unverified completion claim.** State `VERIFIED` only after the
    candidate metrics and verdict JSON both exist. Report raw values, not
    informal benchmark summaries, to the user.

14. **Three user decisions only.** Ask only after baseline capture, after an
    evidence-backed repair proposal, and after a VERIFIED comparison before a
    pull request. Setup, dependency installation, smoke-test selection, and
    bounded retries are automatic sandbox operations.

15. **No fake functional pass.** `functional_test_command` must execute the
    repository's real test suite or the harness's meaningful health smoke
    check. Never use `exit 0`, `true`, `:`, an empty command, or output-only
    commands. When no suite exists, omit `functional_test_command`; the harness
    automatically probes the Analyst-reported health endpoint and fails on a
    non-2xx response. Do not ask the user to choose this fallback.

16. **Sandbox setup is automatic and contained.** Provision Node >=18 with the
    sandbox-supported mechanism (use `nvm` when available), and install only
    lockfile-respecting target and local harness dependencies. Never use `sudo`,
    modify the host, or install global packages. A setup failure is reported as
    a blocker, not presented as a user choice.

---

## Load profile — concrete defaults (configurable inputs, IDENTICAL for baseline and candidate)

The Runtime Profiler supplies these; document these defaults in run_experiment.mjs:
- Autocannon: connections (virtual users) = 50, duration = 20s, pipelining = 1
- Warmup: 3s before measurement starts
- Independent health probe: one GET to the Analyst-reported health endpoint
  (normally `/health`) every 500ms for the full duration
- Event-loop sampling resolution: 20ms

These are INPUTS, not hard-coded constants — but baseline and candidate MUST use
the exact same values. That identity is precisely what protocol_hash captures. If
a target needs heavier load to starve, raise connections; NEVER change the numbers
between baseline and candidate, or the comparison is invalid.

Create an experiment config JSON matching this schema before running:

```json
{
  "start_command": "node server.js",
  "target_endpoint": "http://localhost:3000/api/heavy-computation",
  "request_method": "POST",
  "request_payload": { "size": 10000 },
  "duration_seconds": 20,
  "connections": 50,
  "rate": 0,
  "pipelining": 1,
  "health_probe_path": "http://localhost:3000/health",
  "health_probe_interval_ms": 500,
  "functional_test_command": "node --test test/",
  "warmup_seconds": 3,
  "startup_timeout_ms": 30000,
  "event_loop_resolution_ms": 20
}
```

Use the SAME config file for both baseline and candidate runs.

Select `target_endpoint` from the Analyst's highest-confidence, externally
reachable suspect. Prefer a read-only endpoint when it exercises the failure;
otherwise use the smallest payload that reliably triggers the suspect path.
Set `health_probe_path` to the independent lightweight endpoint reported by the
Analyst, not a guessed `/healthz` route. Set `functional_test_command` to the
reported real test command. If the repository has no suite, omit
`functional_test_command`; the harness runs the documented health smoke check
against the Analyst-reported endpoint. A no-op command is invalid and the
harness rejects it.

For a nested target repository, keep the process foregrounded in the config,
for example: `"start_command": "cd nodetest && node src/server.js"`. The
harness invokes that command and cleans it up; do not execute this command
yourself first.

---

## Quick Reference: Verification Policy

Thresholds are in `config/verification-policy.json` (configurable, not
hard-coded). Current defaults:

| Gate               | Condition                           | Threshold |
|--------------------|-------------------------------------|-----------|
| event_loop_p99     | candidate.p99 / baseline.p99        | ≤ 0.25    |
| health_success     | success_rate during load             | ≥ 0.99    |
| health_p99         | health probe p99 response time       | ≤ 100 ms  |
| target_p99         | candidate.p99 / baseline.p99        | ≤ 0.50    |
| target_error_rate  | errors / total requests              | ≤ 0.01    |
| functional_pass    | pass_rate                            | = 1.0     |
| functional_zero_fail | failed count                       | = 0       |
