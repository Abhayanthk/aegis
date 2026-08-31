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
2. **Profiler preparation:** perform only the single grouped runtime and
   dependency setup after the Analyst supplies the package manager. This lane
   must not inspect application behavior, create experiment config, start the
   target, run tests, run experiments, or interpret results.

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
3. The Profiler runs one idempotent environment-preparation phase for the
   isolated sandbox. In that phase, detect Node/npm, provision Node.js >=18
   only when absent, install the AEGIS harness dependencies, and install the
   target repository dependencies once the Analyst has identified the package
   manager. Group all missing setup work into this single phase. Reuse the
   prepared runtime and installed dependency trees for every later phase;
   never reinstall, refresh, or repeat a successful install. Never ask the
   user to approve this sandbox-only setup. If setup fails, report the exact
   error and stop. Only after this lane succeeds may the BASELINE profiler
   create the experiment config, run the target, and run tests.
4. Wait for BOTH subagents to complete. DO NOT analyze the repository yourself. Extract the Analyst's structured JSON report verbatim. Then delegate to the Profiler (Baseline phase) and pass the raw JSON into its prompt so it can create the experiment config.
5. Run one baseline. Only after the baseline succeeds, present the required
   evidence and wait for explicit human approval before any target-code edit.

---

## State Machine

Every engagement follows this sequence. Do NOT skip steps.

```
IDLE
 │
 ├─► ANALYZE ──→ Delegate to Repository Analyst
 │               Read repo, find entry points, and identify suspect bottlenecks.
 │
 └─► PREPARE ──→ Delegate to Runtime Profiler (Preparation phase)
                 Set up sandbox and perform the one grouped runtime, harness,
                 and target-dependency installation.
                 Do not run experiments. MUST succeed before proceeding.

 (Wait for BOTH ANALYZE and PREPARE to complete)
 │
 ▼
 (EXTRACT Analyst JSON Report: Do NOT analyze the repo yourself!)
 │
 ▼
BASELINE ──→ Delegate to Runtime Profiler (Baseline phase)
 │           Create config, run load test, and generate baseline metrics.
 │           MUST succeed (exit 0) before proceeding.
 ▼
DIAGNOSE ──→ Interpret baseline metrics to confirm the server is suffering from starvation.
 │           Instruct the Repairer to apply Batched Fixes for ALL suspect bottlenecks found by the Analyst.
 ▼
REPAIR REVIEW ──→ Present the proposed code change and ask to apply it
 │                Use the `ask_question` tool to get explicit human approval before any code edit
 ▼
REPAIR ──→ Delegate to Performance Repairer (max 3 attempts)
 │         Use Analyst output and Baseline metrics to apply the best repair pattern.
 │         Generate minimal code diff.
 ▼
CANDIDATE ──→ Delegate to Runtime Profiler (Candidate phase)
 │            Re-run the exact same experiment against the edited code.
 │            verify.mjs compares candidate vs baseline.
 │          │
 │          ├─ VERIFIED → Proceed to PR REVIEW
 │          ├─ FAILED   → Loop back to REPAIR (max 3 attempts). If 3 attempts fail, ESCALATE.
 │          ├─ RETRY    → Re-run experiment (transient issue)
 │          ├─ INCOMPARABLE → Fix protocol mismatch, re-run
 │          └─ ESCALATE → Stop, report evidence to human
 ▼
PR REVIEW ──→ Present all findings to the user (Root Agent)
              Show the Analyst bottlenecks, Baseline metrics, code diff, and Candidate metrics.
              Use the `ask_question` tool to ask exactly: "Do you want to raise a PR, retry the repair, or reject?"
```


### Repair approval gate

After automatic diagnosis and before a target-code edit, present the root cause,
the exact files/functions to change, and the expected behavior preserved by the
repair. You MUST propose fixing ALL bottlenecks identified by the Analyst (Batched Fixes). You MUST use the `ask_question` tool to ask for approval to apply these repairs and run the candidate experiment. Do not edit code before approval.

### Pull request approval gate

Only after `verify.mjs` returns `VERIFIED` (or the user accepts a failed but improved candidate), present the baseline and candidate values side by side with the verifier's raw verdict. You MUST use the `ask_question` tool to ask whether to create the branch, commit, and pull request. Do not make GitHub writes before approval.

**CRITICAL RULE FOR QUESTIONS:** The Root Agent MUST NOT ask any questions other than the REPAIR REVIEW (accept/reject/retry) and the PR REVIEW (accept/reject). Do not ask for approval to provision the isolated sandbox, install project or
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
| Runtime Profiler PREPARE | `references/preparation-playbook.md`       |
| Runtime Profiler BASELINE | `references/baseline-playbook.md`        |
| Runtime Profiler CANDIDATE | `references/candidate-playbook.md`      |
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
You are the Runtime Profiler in the PREPARE phase. Before any work, read
{skill_dir}/references/preparation-playbook.md in full. Your only job is to install
and validate the runtime and dependency trees. Do not inspect application code,
create an experiment config, start the target app, run tests, run an experiment,
or interpret metrics. After the Analyst report supplies the repository path and
package manager, run exactly:
`{skill_dir}/scripts/prepare_sandbox.sh <repository-path> <package-manager>`.
Do not run separate install commands before or after it. Do not run the target
application or create an experiment config. Return only the required
preparation-phase JSON result. If setup fails, report the exact error without
asking the user.
```

**Runtime Profiler baseline**

```text
You are the Runtime Profiler for the BASELINE phase. Before any work, read
{skill_dir}/references/baseline-playbook.md in full.

You have zero memory of the prior conversation. You must use:
Analyst Report: <INSERT RAW JSON OR ABSOLUTE PATH TO FILE>
Repository Path: <ABSOLUTE PATH TO REPO>

CREATE the experiment config and write it to: <ABSOLUTE PATH>/experiment-config.json
Use the dependency trees prepared by the grouped setup phase. Do not run an
install command in BASELINE; if the preparation marker is missing or invalid,
stop and report that setup failure.
Then run the baseline experiment. Return the baseline phase JSON result. Do not interpret
the verdict, alter target code, or replace a missing test command with a no-op.
If the playbook cannot be read, stop and report that blocker.
```

**Runtime Profiler candidate**

```text
You are the Runtime Profiler for the CANDIDATE phase. Before any work, read
{skill_dir}/references/candidate-playbook.md in full.

You have zero memory of the prior conversation. You must use:
Analyst Report: <INSERT RAW JSON OR ABSOLUTE PATH TO FILE>
Baseline Metrics: <INSERT RAW JSON OR ABSOLUTE PATH TO baseline/metrics.json>
Experiment Config: <ABSOLUTE PATH TO experiment-config.json>

REUSE the supplied experiment config file (do NOT create a new one). Run the
candidate experiment, and then run the verification script. Return the candidate phase JSON
result. Do not interpret the verdict or alter target code. If the playbook
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
