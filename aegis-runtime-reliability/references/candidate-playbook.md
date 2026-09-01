# Runtime Profiler — CANDIDATE

PREPARE and BASELINE must already have succeeded. In this fresh shell, source
the durable runtime artifact from the repository working directory. The task
prompt must provide absolute values for `<repository-path>`, `<skill-dir>`, and
the Analyst, baseline, config, candidate, and verdict artifact paths. Always
establish the repository working directory before invoking Node:

```bash
cd <repository-path>
source <skill-dir>/.aegis-node-env
```

Verify `<skill-dir>/.aegis-prepared` exists, then reuse the supplied config
unchanged. If either artifact is missing, stop. Do not install dependencies or
edit target code.

Run:

```bash
node <skill-dir>/scripts/run_experiment.mjs \
  --config <absolute experiment-config.json> \
  --output <absolute candidate/metrics.json>
```

If `run_experiment.mjs` exits non-zero, stop immediately. Do not invoke
`verify.mjs`, synthesize metrics or a verdict, or classify the failure as a
performance `FAILED` result. Return the exact command, exit code, stdout, and
stderr as an execution blocker.

Only after `run_experiment.mjs` exits 0, still from `<repository-path>`, run:

```bash
node <skill-dir>/scripts/verify.mjs \
  --baseline <absolute baseline/metrics.json> \
  --candidate <absolute candidate/metrics.json> \
  --policy <skill-dir>/config/verification-policy.json \
  --output <absolute verdict.json>
```

Return exactly this JSON shape, substituting the actual values and the complete
raw metrics and verdict objects; do not interpret the verdict:

```json
{
  "phase": "candidate",
  "exit_code": 0,
  "functional_evidence_type": "test_suite|repo_smoke",
  "metrics_path": "<absolute path to written candidate metrics.json>",
  "config_path": "<absolute path to experiment-config.json>",
  "verdict_path": "<absolute path to verdict.json>",
  "metrics": { "...raw metrics.json contents..." },
  "verdict": { "...raw verdict.json contents..." }
}
```
