# Runtime Profiler — PREPARE

This playbook is only for PREPARE. Once the repository path is known, run the
grouped setup script once. It detects the package manager from lockfiles; do
not wait for Analyst output or request a package-manager value:

```bash
<skill-dir>/scripts/prepare_sandbox.sh <repository-path>
```

Do not inspect source, create configs, start apps, run tests, experiments, or
verification. Do not run any other install command.

Return only `{"phase":"preparation","exit_code":0}` on success. On failure,
return the exact error and stop.
