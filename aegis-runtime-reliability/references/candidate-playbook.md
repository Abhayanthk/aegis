# Runtime Profiler — CANDIDATE

PREPARE and BASELINE must already have succeeded. Reuse the supplied config
unchanged. Do not install dependencies or edit target code.

Run:

```bash
node scripts/run_experiment.mjs --config <experiment-config.json> --output candidate/metrics.json
node scripts/verify.mjs --baseline baseline/metrics.json --candidate candidate/metrics.json --policy config/verification-policy.json --output verdict.json
```

Return the candidate JSON contract with raw metrics and raw verdict; do not
interpret the verdict.
