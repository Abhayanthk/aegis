# Evidence Contract

## Purpose

Every claim made by AEGIS must be backed by concrete, verifiable evidence from
the deterministic scripts. This contract defines what constitutes valid evidence
at each stage of the pipeline.

---

## Evidence Types

### 1. Baseline Metrics (from `run_experiment.mjs`)

The baseline captures the target application's behavior BEFORE any repair.

**Required fields:**
```json
{
  "protocol_hash": "<sha256 — proves identical test protocol>",
  "event_loop": {
    "p50_ms": "<median event-loop delay>",
    "p95_ms": "<95th percentile>",
    "p99_ms": "<99th percentile — primary starvation indicator>",
    "max_ms": "<maximum observed delay>"
  },
  "health": {
    "success_rate": "<fraction of successful health probes>",
    "timeout_rate": "<fraction of timed-out probes>",
    "p50_ms": "<median health probe latency>",
    "p95_ms": "<95th percentile>",
    "p99_ms": "<99th percentile>"
  },
  "target": {
    "req_per_sec": "<throughput under load>",
    "errors": "<total error count>",
    "p50_ms": "<median target latency>",
    "p95_ms": "<95th percentile>",
    "p99_ms": "<99th percentile>"
  },
  "functional": {
    "passed": "<number of tests that passed>",
    "failed": "<number of tests that failed>"
  }
}
```

**What constitutes valid baseline evidence:**
- Exit code 0 from `run_experiment.mjs`
- All metric fields present and numeric
- `event_loop.p99_ms` significantly above normal (>50ms suggests starvation)
- Health probe data showing degradation under load
- Functional tests passing from the Analyst-reported test suite, or a documented
  repo-local smoke check that exercises meaningful application behavior

### 2. Candidate Metrics (from `run_experiment.mjs`)

Same schema as baseline, captured AFTER the repair.

**What constitutes valid candidate evidence:**
- Same `protocol_hash` as baseline (identical test protocol)
- Exit code 0 from `run_experiment.mjs`
- All metric fields present and numeric

### 3. Verification Verdict (from `verify.mjs`)

The deterministic comparison of baseline vs candidate.

**Required fields:**
```json
{
  "verdict": "VERIFIED | FAILED | RETRY | ESCALATE | INCOMPARABLE",
  "gates": {
    "<gate_name>": {
      "pass": true,
      "ratio|value|error_rate|pass_rate": "<computed value>",
      "threshold": "<policy threshold>"
    }
  },
  "deltas": {
    "<metric_name>": {
      "baseline": "<baseline value>",
      "candidate": "<candidate value>"
    }
  },
  "reasons": ["<human-readable failure reason per failed gate>"]
}
```

### 4. Static Analysis Findings (from Repository Analyst)

```json
{
  "suspects": [
    {
      "file": "<path>",
      "line_range": [start, end],
      "pattern": "<starvation pattern>",
      "confidence": "high|medium|low",
      "description": "<what and why>"
    }
  ]
}
```

---

## Evidence Chain Requirements

For the root agent to approve a PR, the following evidence chain must be complete:

| Step | Evidence Required | Source |
|------|-------------------|--------|
| 1. Analysis | Static analysis findings with specific file/line citations | Repository Analyst |
| 2. Reproduction | Baseline metrics showing event-loop starvation | `run_experiment.mjs` exit 0 |
| 3. Diagnosis | Root cause explanation citing specific metrics | Root agent interpretation of baseline |
| 4. Repair | Code diff showing minimal, targeted changes | Performance Repairer |
| 5. Verification | Candidate metrics + VERIFIED verdict | `run_experiment.mjs` + `verify.mjs` |
| 6. PR approval | Human approval to create the branch, commit, and PR | Human via MCP |

**A missing link in this chain means the PR cannot be opened.**

The root agent also requires human approval after baseline capture and after it
presents the proposed repair, before it edits target code. Sandbox setup,
dependency installation, and automatic health-endpoint smoke checks are
operational steps, not approval checkpoints.

---

## What Is NOT Valid Evidence

- ❌ "The event loop latency is likely around 4000ms" (fabricated number)
- ❌ "Based on code inspection, this fix should improve performance by 75%" (speculation)
- ❌ "The fix looks correct" (opinion without measurement)
- ❌ Metrics from a crashed experiment (exit non-zero)
- ❌ Metrics where `protocol_hash` differs between baseline and candidate
- ❌ A FAILED verdict presented as success
- ❌ Partial metrics (missing any required field)
- ❌ A no-op functional command such as `exit 0`, `true`, `:`, an empty command,
  or an output-only command presented as passing tests

---

## Escalation Evidence

When escalating after 3 failed attempts, present:

1. Baseline metrics
2. All candidate metrics (up to 3 attempts)
3. All verdicts with failure reasons
4. All code diffs attempted
5. Analysis of why each attempt failed
6. Recommendation for human intervention
