# Runtime Profiler — PREPARE

This playbook is only for PREPARE. The task prompt must provide an absolute
repository path and an absolute Analyst-report artifact path. Wait for that
artifact, read `repository_context.package_manager`, and run the grouped setup
script once. Do not infer or invent the manager:

```bash
<skill-dir>/scripts/prepare_sandbox.sh <repository-path> <package-manager>
```

Do not inspect source, create configs, start apps, run tests, experiments, or
verification. Do not run any other install command.

Return only this JSON on success:

```json
{
  "phase": "preparation",
  "exit_code": 0
}
```

On failure, return the exact command error and stop.
