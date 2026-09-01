# Runtime Profiler — BASELINE

PREPARE must already have succeeded. In this fresh shell, source the durable
runtime artifact from the repository working directory. The task prompt must
provide absolute values for `<repository-path>`, `<skill-dir>`, and every
artifact path. Always establish the repository working directory before any
relative application command:

```bash
cd <repository-path>
source <skill-dir>/.aegis-node-env
```

Then verify `<skill-dir>/.aegis-prepared`, `node --version`, and `npm --version`.
If either artifact is missing, stop. Do not install dependencies.

## Build the experiment config

Create `experiment-config.json` from the Analyst report. These six fields are
required by `run_experiment.mjs`:

```json
{
  "start_command": "<command to start the target app>",
  "target_endpoint": "<full URL of the suspect endpoint>",
  "duration_seconds": 20,
  "connections": 50,
  "health_probe_path": "<full URL of the reported health endpoint>",
  "health_probe_interval_ms": 500
}
```

The following optional fields may be included; these are the harness defaults:

```json
{
  "request_method": "GET",
  "request_payload": { "...": "..." },
  "rate": 0,
  "pipelining": 1,
  "warmup_seconds": 3,
  "startup_timeout_ms": 30000,
  "event_loop_resolution_ms": 20,
  "functional_test_command": "<real repository test command>"
}
```

`target_endpoint` must be the suspect endpoint identified by the Analyst, and
`health_probe_path` must be the lightweight endpoint reported by the Analyst;
never guess a path such as `/healthz`. Prefer a read-only suspect endpoint. If
the suspected path requires a body, use the smallest payload that reliably
triggers it and set the matching HTTP method (for example `POST`).

If the Analyst reports no test suite (`test_command: null`), omit
`functional_test_command`; the harness then performs its health-endpoint smoke
check and records `repo_smoke`. If present, it must run a real test suite or
meaningful repository-local smoke check. `true`, `:`, `exit 0`, empty, echo-only,
and printf-only commands are invalid and will be rejected.

Do not invent endpoints, payloads, defaults, metrics, or pass/fail decisions.
Then, still from `<repository-path>`, run the harness with absolute paths:

```bash
node <skill-dir>/scripts/run_experiment.mjs \
  --config <absolute experiment-config.json> \
  --output <absolute baseline/metrics.json>
```

Do not edit target code or interpret results. If `run_experiment.mjs` exits
non-zero, stop immediately. Do not invoke `verify.mjs`, synthesize metrics, or
describe the run as a performance result. Return the exact command, exit code,
stdout, and stderr as an execution blocker. No metrics file is valid unless the
harness exits 0. On exit 0, return exactly this JSON shape, substituting the
actual values and the complete raw metrics object:

```json
{
  "phase": "baseline",
  "exit_code": 0,
  "functional_evidence_type": "test_suite|repo_smoke",
  "metrics_path": "<absolute path to written metrics.json>",
  "config_path": "<absolute path to experiment-config.json>",
  "metrics": { "...raw metrics.json contents..." }
}
```
