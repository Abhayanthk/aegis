# Verification Contract

## Purpose

This document defines the exact semantics of `scripts/verify.mjs` — how it
evaluates gates, what each verdict means, and how the agent must respond to
each verdict.

---

## Verifier Authority

> **`verify.mjs` is the sole source of truth for pass/fail decisions.**
>
> The LLM must never override, reinterpret, or skip the verifier. If the
> verifier says FAILED, the candidate failed. If it says VERIFIED, the
> candidate passed. No exceptions.

---

## Gate Evaluation Modes

Each gate in `config/verification-policy.json` specifies a `mode` that
determines how the verifier evaluates it:

### `ratio_candidate_over_baseline`

Computes: `candidate_value / baseline_value`

Passes when: `ratio <= threshold`

Example: event_loop_p99 with threshold 0.25 means the candidate's p99 must
be at most 25% of the baseline's p99 (a 75%+ reduction).

### `absolute_min`

Computes: `candidate_value`

Passes when: `candidate_value >= threshold`

Example: health_success_rate with threshold 0.99 means the health probe
must succeed at least 99% of the time.

### `absolute_max`

Computes: `candidate_value`

Passes when: `candidate_value <= threshold`

Example: health_p99 with threshold 100 means the health probe p99 latency
must be at most 100ms.

### `error_rate`

Computes: `candidate_errors / total_requests`

Passes when: `error_rate <= threshold`

Example: target_error_rate with threshold 0.01 means at most 1% of requests
can fail.

### `functional_all_pass`

Computes: `passed / (passed + failed)`

Passes when: `pass_rate >= threshold`

This is a strict gate — any functional test failure rejects the candidate,
even if all latency improvements are dramatic.

---

## Verdict Semantics

### VERIFIED

**Meaning**: All required gates passed. The candidate is measurably better
than the baseline across every dimension.

**Agent action**: Proceed to the APPROVE state. Present the full verdict
(including deltas) to the human for review before committing.

### FAILED

**Meaning**: One or more required gates did not pass. The repair was
insufficient or counterproductive.

**Agent action**: Read the `reasons` array and `deltas` to understand what
failed and by how much. Pass this information to the Performance Repairer
for the next attempt. Track attempt count — max 3.

### RETRY

**Meaning**: The failure appears transient (e.g., health probe marginally
missed threshold). Re-running the experiment may produce different results.

**Agent action**: Re-run the candidate experiment with the same config.
Do not re-run the baseline. If RETRY persists after 2 re-runs, treat as
FAILED.

### ESCALATE

**Meaning**: A structural problem prevents automated resolution.

**Agent action**: Stop all automated repair. Present the full evidence
chain to the human:
- Baseline metrics
- All candidate attempts
- All verdicts
- Analysis of the structural problem

### INCOMPARABLE

**Meaning**: Baseline and candidate used different experiment protocols
(different `protocol_hash`). The comparison is invalid.

**Agent action**: This is a configuration error. Ensure both experiments
use the exact same config file and re-run. Do NOT attempt to compare
metrics from different protocols.

---

## Protocol Hash Guarantee

The `protocol_hash` is a SHA-256 hash of the canonicalized experiment
configuration:

```
SHA256(JSON.stringify({
  target_endpoint,
  request_payload,
  request_method,
  duration_seconds,
  connections,
  rate,
  health_probe_path,
  health_probe_interval_ms,
  protocol
}))
```

If `same_protocol_hash_required = true` in the policy (which it is by default),
the verifier will not compare metrics with different protocol hashes. This
prevents accidental comparison of experiments run under different conditions.

---

## Threshold Configuration

All thresholds live in `config/verification-policy.json`. They are NOT
hard-coded in prompts, SKILL.md, or the scripts themselves.

Current defaults:

| Gate | Mode | Threshold | Meaning |
|------|------|-----------|---------|
| event_loop_p99 | ratio | ≤ 0.25 | 75%+ reduction in event-loop p99 |
| health_success_rate | absolute_min | ≥ 0.99 | 99%+ health probe success |
| health_p99 | absolute_max | ≤ 100ms | Health probe stays responsive |
| target_p99 | ratio | ≤ 0.50 | 50%+ reduction in target p99 |
| target_error_rate | error_rate | ≤ 0.01 | <1% error rate |
| functional_pass_rate | functional | ≥ 1.0 | 100% functional test pass |
| functional_zero_failures | absolute_max | ≤ 0 | Zero test failures |

To adjust thresholds for a specific engagement, edit the policy file BEFORE
running experiments. Do not change thresholds mid-engagement.

---

## Failure Analysis Template

When a verdict is FAILED, the agent should structure its analysis as:

```
## Verification Result: FAILED

### Failed Gates
- event_loop_p99: ratio 0.85 (threshold ≤0.25)
  Baseline: 4217ms → Candidate: 3584ms (15% improvement, need 75%+)

### Passing Gates
- health_success_rate: 0.997 (threshold ≥0.99) ✓
- functional_pass_rate: 1.0 ✓

### Diagnosis
The cooperative chunking approach reduced latency by 15%, but the threshold
requires at least 75% reduction. The computation is too heavy for chunking
alone — recommend escalating to worker_threads.

### Next Attempt Plan
Switch from cooperative chunking to worker_threads for the fibonacci
computation in src/routes/compute.js:42-87.

### Attempt: 2 of 3
```
