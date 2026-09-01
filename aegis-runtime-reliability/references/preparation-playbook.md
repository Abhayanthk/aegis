# Runtime Profiler — PREPARE

This playbook is only for PREPARE. The task prompt must provide an absolute
repository path and an absolute Analyst-report artifact path. Wait for that
artifact, read `repository_context.package_manager`, and run the grouped setup
script once. Poll for at most 120 seconds; if the artifact is still absent,
return `SETUP_FAILED: Analyst report artifact not available` and stop. Do not
infer or invent the manager:

```bash
<skill-dir>/scripts/prepare_sandbox.sh <repository-path> <package-manager>
```

Do not inspect source, create configs, start apps, run tests, experiments, or
verification. Do not run any other install command.

The setup script owns Node bootstrap. It tries an existing Node >=18, NVM, fnm,
an official Node binary downloaded into the sandbox, and finally apt when
available. Do not ask the user to install anything. If all fallbacks fail,
return the script's complete `SETUP_FAILED` output, including every
`SETUP_ATTEMPT_FAILED` command, exit status, and captured diagnostics.

Return only this JSON on success:

```json
{
  "phase": "preparation",
  "exit_code": 0
}
```

On failure, return the exact command error and stop.
