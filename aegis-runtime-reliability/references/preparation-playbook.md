# Runtime Profiler — PREPARE

This playbook is only for PREPARE. Run the grouped setup script once:

```bash
<skill-dir>/scripts/prepare_sandbox.sh <repository-path> <package-manager>
```

Do not inspect source, create configs, start apps, run tests, experiments, or
verification. Do not run any other install command.

Return only `{"phase":"preparation","exit_code":0}` on success. On failure,
return the exact error and stop.
