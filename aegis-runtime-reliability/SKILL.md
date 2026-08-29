---
name: aegis-runtime-reliability
description: >
  Detects, reproduces, and repairs Node.js event-loop starvation in a target
  repository. Runs a closed loop of reproduce, measure, diagnose, repair,
  verify, and PR. Use this skill when a Node.js service shows high tail
  latency, blocked event loop, or health-check timeouts under load.
---

# AEGIS Runtime Reliability — Event-Loop Starvation

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
├── Repository Analyst   — static analysis, find starvation suspects
├── Runtime Profiler     — run experiments, collect metrics
└── Performance Repairer — edit code, re-verify
```

**MCP**: GitHub is the ONLY MCP server. Use read tools freely; write tools
(branch, commit, PR) require human approval.

**Execution**: All code runs in the Daytona sandbox. Never execute repo code
outside the sandbox. Never put secrets in the sandbox.

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
DIAGNOSE ──→ Interpret baseline metrics to identify root cause
 │            Read the JSON output — never fabricate numbers
 ▼
REPAIR ──→ Delegate to Performance Repairer (max 3 attempts)
 │          Repairer edits code, then Profiler re-runs experiment
 │          verify.mjs compares candidate vs baseline
 │          │
 │          ├─ VERIFIED → proceed to APPROVE
 │          ├─ FAILED   → Repairer tries again (up to max_repair_attempts)
 │          ├─ RETRY    → Re-run experiment (transient issue)
 │          ├─ INCOMPARABLE → Fix protocol mismatch, re-run
 │          └─ ESCALATE → Stop, report evidence to human
 ▼
APPROVE ──→ Present verdict + evidence to human for approval
 │           human_approval_required_before_github_write = true
 ▼
PR ──→ Commit changes and open a pull request
       automatic_merge = false
```

---

## Delegation Playbooks

Each subagent has a detailed playbook in `references/`. Read the relevant
playbook before delegating.

| Subagent             | Playbook                                     |
|----------------------|----------------------------------------------|
| Repository Analyst   | `references/analyst-playbook.md`             |
| Runtime Profiler     | `references/profiler-playbook.md`            |
| Performance Repairer | `references/repairer-playbook.md`            |

Evidence and verification contracts are in:
- `references/evidence-contract.md`
- `references/verification-contract.md`

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

---

## Experiment Configuration

Create an experiment config JSON matching this schema before running:

```json
{
  "start_command": "node server.js",
  "target_endpoint": "http://localhost:3000/api/heavy-computation",
  "request_method": "POST",
  "request_payload": { "size": 10000 },
  "duration_seconds": 30,
  "connections": 50,
  "rate": 0,
  "health_probe_path": "http://localhost:3000/health",
  "health_probe_interval_ms": 200,
  "functional_test_command": "node --test test/",
  "warmup_seconds": 5,
  "startup_timeout_ms": 30000
}
```

Use the SAME config file for both baseline and candidate runs.

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
