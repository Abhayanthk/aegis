# Runtime Profiler — BASELINE

PREPARE must already have succeeded. Verify `<skill-dir>/.aegis-prepared`; if
missing, stop. Do not install dependencies.

Create `experiment-config.json` from the Analyst report, then run:

```bash
node scripts/run_experiment.mjs --config experiment-config.json --output baseline/metrics.json
```

Do not edit target code or interpret results. Return the baseline JSON contract
with raw metrics.
