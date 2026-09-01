# Runtime Profiler — CANDIDATE

PREPARE and BASELINE must already have succeeded. In this fresh shell, source
the durable runtime artifact before invoking Node:

```bash
source <skill-dir>/.aegis-node-env
```

Verify `<skill-dir>/.aegis-prepared` exists, then reuse the supplied config
unchanged. If either artifact is missing, stop. Do not install dependencies or
edit target code.

Run:

```bash
node scripts/run_experiment.mjs --config <experiment-config.json> --output candidate/metrics.json
node scripts/verify.mjs --baseline baseline/metrics.json --candidate candidate/metrics.json --policy config/verification-policy.json --output verdict.json
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
