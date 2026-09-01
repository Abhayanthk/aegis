# AEGIS — Autonomous Runtime Reliability Agent

AEGIS is an autonomous runtime-reliability agent built on [TrueForge](https://github.com/truefoundry/trueforge), an open-source agent harness. It detects, reproduces, and repairs **Node.js event-loop starvation** through a closed-loop pipeline:

```
Reproduce → Measure → Diagnose → Repair → Reproduce → Verify → Approve → PR
```

## Architecture

```
Root Agent
├── Repository Analyst   — static analysis of suspect code paths
├── Runtime Profiler     — controlled experiments via deterministic scripts
└── Performance Repairer — targeted code edits with verification guardrails
```

**Core principle**: The LLM reasons and orchestrates; deterministic scripts (`run_experiment.mjs`, `verify.mjs`) do the measuring and own the verdict. The model never invents a metric or a pass/fail decision.

## Skill: `aegis-runtime-reliability`

The skill is a self-contained directory that TrueForge clones into an isolated sandbox:

```
aegis-runtime-reliability/
├── SKILL.md                              # Lean router with state machine and guardrails
├── config/
│   └── verification-policy.json          # Gate thresholds and policy rules
├── references/
│   ├── analyst-playbook.md               # Static analysis guide for Repository Analyst
│   ├── preparation-playbook.md           # Runtime/dependency setup only
│   ├── baseline-playbook.md              # Baseline experiment only
│   ├── candidate-playbook.md             # Candidate experiment and verification only
│   ├── repairer-playbook.md              # Repair decision tree for Performance Repairer
│   ├── evidence-contract.md              # What constitutes valid evidence
│   └── verification-contract.md          # Verifier semantics and verdict handling
└── scripts/
    ├── package.json                      # ESM, autocannon dep, node >=18
    ├── run_experiment.mjs                # Measurement harness (8-step pipeline)
    └── verify.mjs                        # Deterministic verdict engine
```

## Scripts

### `run_experiment.mjs` — Measurement Harness

Reproduces event-loop starvation under controlled load:

1. Starts the target app and waits for readiness
2. Optional warmup phase
3. Starts independent health probe loop
4. Enables event-loop delay monitoring (`perf_hooks`)
5. Drives load with Autocannon
6. Stops probes cleanly
7. Runs functional tests separately
8. Writes canonical metrics JSON

```bash
node scripts/run_experiment.mjs --config experiment.json --output baseline/metrics.json
```

**Exit 0** = metrics written. **Exit non-zero** = crashed, no output (never mistaken for results).

### `verify.mjs` — Verdict Engine

Compares baseline vs candidate metrics against the verification policy:

```bash
node scripts/verify.mjs --baseline baseline/metrics.json \
                         --candidate candidate/metrics.json \
                         --policy config/verification-policy.json \
                         --output verdict.json
```

Verdicts: `VERIFIED` | `FAILED` | `RETRY` | `ESCALATE` | `INCOMPARABLE`

**Exit 0** = verifier ran (read verdict from JSON). **Exit non-zero** = verifier crashed.

## Verification Gates

| Gate | Condition | Default Threshold |
|------|-----------|-------------------|
| Event Loop p99 | candidate/baseline ratio | ≤ 0.25 (75%+ reduction) |
| Health Success Rate | absolute minimum | ≥ 0.99 |
| Health p99 | absolute maximum | ≤ 100ms |
| Target p99 | candidate/baseline ratio | ≤ 0.50 (50%+ reduction) |
| Error Rate | errors/total | ≤ 0.01 |
| Functional Tests | pass rate | = 1.0 |

Thresholds are configurable via `config/verification-policy.json`.

## Guardrails

- Reproduction is mandatory — no diagnosis from static reading alone
- Verifier owns the verdict — the model never overrides it
- Max 3 repair attempts, then escalate with evidence
- Functional regression fails the candidate regardless of latency improvement
- Human approval required before any GitHub write operation
- No automatic merge — PRs are opened for review
- All execution in sandbox only — no secrets in the sandbox

## User Decision Points

AEGIS prepares its isolated sandbox, installs required project and harness
dependencies, and derives a health-endpoint smoke check when a repository has no
test suite without interrupting the user. It asks for approval only three times:

1. After baseline metrics are captured, to continue to diagnosis.
2. After it presents the evidence-backed repair proposal, to apply that change.
3. After a VERIFIED baseline/candidate comparison, to create the branch, commit,
   and pull request.

Setup failures are reported with their exact error and stop the run; they are not
presented as approval dialogs.

## Getting Started

```bash
cd aegis-runtime-reliability/scripts
npm install
```

Then configure an experiment JSON and run:

```bash
node run_experiment.mjs --config ../examples/experiment.json --output baseline/metrics.json
```

## Qodo Code Review Evidence

### Review Scope

This PR introduces the `aegis-runtime-reliability` TrueForge skill — a complete, runnable system for detecting and repairing Node.js event-loop starvation.

### Key Design Decisions

1. **Scripts over prose**: The previous version had measurement and verification described only in markdown contracts with no runnable code. This version ships real, executable scripts (`run_experiment.mjs`, `verify.mjs`) that the agent calls — the LLM never computes metrics or verdicts.

2. **Protocol hash for comparability**: Both baseline and candidate runs produce a SHA-256 hash of the experiment configuration. The verifier refuses to compare runs with different hashes (`INCOMPARABLE` verdict).

3. **Strict exit code semantics**: `run_experiment.mjs` exits non-zero and writes NO output on failure, ensuring a crashed run can never be mistaken for results. `verify.mjs` exits 0 whenever it successfully runs (verdict is in JSON), so the agent can distinguish "verifier said FAIL" from "verifier crashed."

4. **Decision tree, not blanket rules**: The repairer playbook provides a structured decision tree (worker_threads vs chunking vs algorithmic fix vs caching vs async conversion) rather than prescribing a single approach.

5. **Evidence chain enforcement**: Every step from analysis to PR requires specific, verifiable evidence from the deterministic scripts. The evidence contract explicitly lists what is and isn't valid evidence.

### Files for Review

| File | Purpose | Lines |
|------|---------|-------|
| `SKILL.md` | Lean router — state machine, guardrails, script contracts | ~160 |
| `scripts/run_experiment.mjs` | 8-step measurement harness | ~330 |
| `scripts/verify.mjs` | Deterministic verdict engine | ~230 |
| `config/verification-policy.json` | Gate thresholds and policy rules | ~55 |
| `references/analyst-playbook.md` | Repository Analyst instructions | ~100 |
| `references/preparation-playbook.md` | PREPARE setup instructions |
| `references/baseline-playbook.md` | BASELINE experiment instructions |
| `references/candidate-playbook.md` | CANDIDATE experiment instructions |
| `references/repairer-playbook.md` | Performance Repairer decision tree | ~250 |
| `references/evidence-contract.md` | Evidence validity definitions | ~130 |
| `references/verification-contract.md` | Verifier semantics and verdicts | ~170 |

### Testing

The scripts can be validated by:
1. `node scripts/verify.mjs --help` — exits with usage (no crash)
2. Creating mock baseline/candidate JSON files and running `verify.mjs` against them
3. Syntax validation: `node --check scripts/run_experiment.mjs && node --check scripts/verify.mjs`
