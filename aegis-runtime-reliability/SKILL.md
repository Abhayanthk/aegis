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
├── Runtime Profiler — harness configuration, experiment config, and raw measurements
└── Performance Repairer — evidence-backed code changes
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

Subagents have ZERO inherited memory and cannot "see previous output". Before
creating a subagent task, resolve this skill directory to an absolute path and
include all of the following in that subagent's prompt:

1. its role and current phase;
2. the absolute path to its exact playbook, with an instruction to read it in
   full before doing any work;
3. the absolute paths to any required artifact files (or the raw JSON embedded
   directly in the prompt). **NEVER say "see previous output"**.
4. the allowed inputs and allowed side effects for that phase;
5. the required output schema or artifact paths; and
6. an instruction to stop and report a blocker if the playbook cannot be read.

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
4. Wait for the Analyst's structured report, then the Profiler creates the
   experiment config using the Analyst's endpoint details. The **Profiler owns
   the experiment config**; config schema and load profile defaults are in
   `references/profiler-playbook.md`.
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

Evidence and verification contracts are root-agent-only references (not loaded
by subagents):
- `references/evidence-contract.md` — what constitutes valid evidence
- `references/verification-contract.md` — how `verify.mjs` evaluates gates

Verification thresholds are in `config/verification-policy.json`. Do not
hard-code thresholds in prompts; the verifier reads them at runtime.

### Required prompt shape

Replace `{skill_dir}` with this skill's resolved absolute directory before
creating the task. These prompts are minimum handoff content, not optional
examples.

**Repository Analyst**

```text
You are the Repository Analyst for the ANALYZE phase. Before any work, read
{skill_dir}/references/analyst-playbook.md in full.

You have zero memory of the prior conversation.
Repository Path: <ABSOLUTE PATH TO REPO>

Perform static analysis only: do not execute repository code. Return only the
JSON contract required by that playbook, including package_manager and the actual
test_command (or null when none exists). If the playbook cannot be read, stop and
report that blocker.
```

**Runtime Profiler preparation**

```text
You are the Runtime Profiler in the preparation phase. Before any work, read
{skill_dir}/references/profiler-playbook.md in full. Run only the documented
Node/npm preflight and automatic sandbox setup. You may provision Node >=18 and
install target and local harness dependencies inside the sandbox; do not modify
the host or install global packages. Do not run the target application or create
an experiment config. Return the required preparation phase JSON result. If setup
fails, report the error without asking the user.
```

**Runtime Profiler baseline**

```text
You are the Runtime Profiler for the BASELINE phase. Before any work, read
{skill_dir}/references/profiler-playbook.md in full.

You have zero memory of the prior conversation. You must use:
Analyst Report: <INSERT RAW JSON OR ABSOLUTE PATH TO FILE>
Repository Path: <ABSOLUTE PATH TO REPO>

CREATE the experiment config and write it to: <ABSOLUTE PATH>/experiment-config.json
Then run the baseline experiment. Return the raw JSON output. Do not interpret
the verdict, alter target code, or replace a missing test command with a no-op.
If the playbook cannot be read, stop and report that blocker.
```

**Runtime Profiler candidate**

```text
You are the Runtime Profiler for the CANDIDATE phase. Before any work, read
{skill_dir}/references/profiler-playbook.md in full.

You have zero memory of the prior conversation. You must use:
Analyst Report: <INSERT RAW JSON OR ABSOLUTE PATH TO FILE>
Baseline Metrics: <INSERT RAW JSON OR ABSOLUTE PATH TO baseline/metrics.json>
Experiment Config: <ABSOLUTE PATH TO experiment-config.json>

REUSE the supplied experiment config file (do NOT create a new one). Run the
candidate experiment, and then run the verification script. Return the raw JSON
outputs. Do not interpret the verdict or alter target code. If the playbook
cannot be read, stop and report that blocker.
```

**Performance Repairer**

```text
You are the Performance Repairer for an approved REPAIR phase. Before any work,
read {skill_dir}/references/repairer-playbook.md in full.

You have zero memory of the prior conversation. You must act ONLY on the following evidence:
Repository Path: <ABSOLUTE PATH TO REPO>
Analyst Report: <INSERT RAW JSON OR ABSOLUTE PATH TO FILE>
Baseline Metrics: <INSERT RAW JSON OR ABSOLUTE PATH TO baseline/metrics.json>
Verification Verdict (if this is a retry): <INSERT RAW JSON OR ABSOLUTE PATH TO verdict.json>

You may edit only the target repository files needed for the supplied evidence-backed suspect. Return
the required JSON output summarizing your changes; do not run or claim a verification
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

1. **Verifier owns the verdict.** Never override, reinterpret, or skip
   `verify.mjs`. If it says FAILED, the candidate failed — period.

2. **Never fabricate a measurement.** If `run_experiment.mjs` crashes,
   fix the config and re-run. Do not invent metrics.

3. **Sandbox only.** Execute repository code only in the Daytona sandbox.
   Never run it on the host. Never put secrets in the sandbox.

4. **Functional regression fails the candidate.** Even if latency improved
   dramatically, a single functional test failure means the candidate is
   rejected.

5. **Max 3 repair attempts, then escalate.** After 3 failed attempts,
   stop and present all evidence to the human. Do not keep trying.

6. **Narrowly scoped changes.** Each repair should touch the minimum
   code necessary. No drive-by refactors.

7. **Every change is evidence-backed.** Every claim must cite the
   specific metrics from the experiment output.

8. **Minimize exploratory tool use.** Batch independent reads, use `rg` to
   locate code and package metadata, and inspect the exact files returned.
   Do not repeatedly re-read files, re-install dependencies, or probe the same
   endpoint manually after the harness has produced evidence.

9. **One bounded diagnosis loop.** Build the config once from the Analyst's
   report; on a harness failure, make one config/environment correction per
   retry and report the concrete error. After two setup failures, escalate
   rather than cycling through guesses.

10. **No unverified completion claim.** State `VERIFIED` only after the
    candidate metrics and verdict JSON both exist. Report raw values, not
    informal benchmark summaries, to the user.
