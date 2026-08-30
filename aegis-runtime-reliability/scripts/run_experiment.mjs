#!/usr/bin/env node

/**
 * run_experiment.mjs — Deterministic measurement harness for event-loop starvation.
 *
 * PURPOSE: Reproduce event-loop starvation under controlled load and emit
 * a canonical metrics JSON. This script is the ONLY source of measurement data;
 * the LLM must never fabricate or estimate any metric.
 *
 * USAGE:
 *   node run_experiment.mjs --config <path-to-experiment-config.json> --output <path-to-metrics.json>
 *
 * EXIT CODES:
 *   0 — Experiment completed successfully; metrics JSON written.
 *   1 — Experiment failed to run (startup, load, or probe error). NO metrics written.
 *       A crashed run MUST NEVER be mistaken for results.
 *
 * INVARIANT: Identical config inputs yield the same protocol_hash so that
 * baseline and candidate runs are always comparable.
 */

import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { parseArgs } from 'node:util';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    config: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
  strict: true,
});

if (!args.config || !args.output) {
  console.error('Usage: node run_experiment.mjs --config <config.json> --output <metrics.json>');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load and validate experiment configuration
// ---------------------------------------------------------------------------

/** @typedef {Object} ExperimentConfig
 * @property {string}   start_command      - Shell command to start the target app.
 * @property {string}   target_endpoint    - Full URL of the endpoint under test (e.g. http://localhost:3000/api/heavy).
 * @property {Object}   [request_payload]  - Optional JSON body sent with each request.
 * @property {string}   [request_method]   - HTTP method (default: GET).
 * @property {number}   duration_seconds   - How long Autocannon drives load (default 20).
 * @property {number}   connections        - Concurrent connections for Autocannon (default 50).
 * @property {number}   [rate]             - Requests/sec cap (0 = unlimited, default).
 * @property {number}   [pipelining]       - Autocannon pipelining factor (default 1).
 * @property {string}   health_probe_path  - Full URL of the health/liveness endpoint.
 * @property {number}   health_probe_interval_ms - Interval (ms) between health probes (default 500).
 * @property {string}   [functional_test_command] - Shell command to run functional tests AFTER load. When omitted, the harness runs a health-endpoint smoke check.
 * @property {number}   [warmup_seconds]   - Optional warmup duration before measurement (default 3).
 * @property {number}   [startup_timeout_ms] - Max ms to wait for target readiness (default 30000).
 * @property {number}   [event_loop_resolution_ms] - ELD monitoring resolution (default 20).
 * @property {Object}   [protocol]         - Extra protocol metadata folded into the hash.
 */

let config;
try {
  config = JSON.parse(readFileSync(resolve(args.config), 'utf-8'));
} catch (err) {
  console.error(`FATAL: Cannot read config file: ${err.message}`);
  process.exit(1);
}

const REQUIRED_FIELDS = [
  'start_command', 'target_endpoint', 'duration_seconds',
  'connections', 'health_probe_path', 'health_probe_interval_ms',
];
for (const field of REQUIRED_FIELDS) {
  if (config[field] === undefined || config[field] === null) {
    console.error(`FATAL: Missing required config field: "${field}"`);
    process.exit(1);
  }
}

function isNoOpFunctionalCommand(command) {
  const normalized = String(command)
    .replace(/(^|\s)#.*$/gm, '$1')
    .trim()
    .replace(/\s+/g, ' ');
  if (normalized === '') return true;

  const commands = normalized.split(/\s*(?:;|&&|\|\|)\s*/).filter(Boolean);
  return commands.length > 0 && commands.every((part) =>
    part === ':' ||
    part === 'true' ||
    part === 'exit' ||
    part === 'exit 0' ||
    /^(?:echo|printf)\b/.test(part),
  );
}

if (config.functional_test_command !== undefined &&
    (typeof config.functional_test_command !== 'string' ||
      isNoOpFunctionalCommand(config.functional_test_command))) {
  console.error(
    'FATAL: functional_test_command must run a real test suite or meaningful repo-local smoke check; no-op commands are invalid.',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Compute deterministic protocol hash
// ---------------------------------------------------------------------------

function computeProtocolHash(cfg) {
  const canonical = JSON.stringify({
    target_endpoint: cfg.target_endpoint,
    request_payload: cfg.request_payload ?? null,
    request_method: (cfg.request_method ?? 'GET').toUpperCase(),
    duration_seconds: cfg.duration_seconds,
    connections: cfg.connections ?? 50,
    rate: cfg.rate ?? 0,
    pipelining: cfg.pipelining ?? 1,
    health_probe_path: cfg.health_probe_path,
    health_probe_interval_ms: cfg.health_probe_interval_ms ?? 500,
    event_loop_resolution_ms: cfg.event_loop_resolution_ms ?? 20,
    protocol: cfg.protocol ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

const protocolHash = computeProtocolHash(config);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Spawn a child process and return a handle with a kill method. */
function startProcess(command) {
  const child = spawn('sh', ['-c', command], {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  child.stderr.on('data', (d) => { stderr += d.toString(); });
  return { child, getStdout: () => stdout, getStderr: () => stderr };
}

/** Wait for a URL to respond with 2xx. */
async function waitForReady(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch { /* not ready yet */ }
    await sleep(500);
  }
  return false;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run a shell command and return { exitCode, stdout, stderr }. */
function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn('sh', ['-c', command], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
    child.on('error', () => resolve({ exitCode: 1, stdout, stderr }));
  });
}

// ---------------------------------------------------------------------------
// Health probe — independent loop using global fetch
// ---------------------------------------------------------------------------

function createHealthProbe(url, intervalMs) {
  const results = [];
  let running = true;
  let timer;

  async function probe() {
    if (!running) return;
    const start = performance.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const elapsed = performance.now() - start;
      results.push({ ok: res.ok && res.status < 400, elapsed, timeout: false });
    } catch (err) {
      const elapsed = performance.now() - start;
      const isTimeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      results.push({ ok: false, elapsed, timeout: isTimeout });
    }
    if (running) timer = setTimeout(probe, intervalMs);
  }

  return {
    start() { probe(); },
    stop() { running = false; clearTimeout(timer); },
    getResults() { return results; },
  };
}

function summarizeHealthResults(results) {
  if (results.length === 0) {
    return { success_rate: 0, timeout_rate: 0, p50_ms: 0, p95_ms: 0, p99_ms: 0 };
  }
  const successes = results.filter((r) => r.ok).length;
  const timeouts = results.filter((r) => r.timeout).length;
  const latencies = results.map((r) => r.elapsed).sort((a, b) => a - b);
  return {
    success_rate: round(successes / results.length, 4),
    timeout_rate: round(timeouts / results.length, 4),
    p50_ms: round(percentile(latencies, 50), 2),
    p95_ms: round(percentile(latencies, 95), 2),
    p99_ms: round(percentile(latencies, 99), 2),
  };
}

function percentile(sorted, pct) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((pct / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function round(n, decimals) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// ---------------------------------------------------------------------------
// Autocannon load driver
// ---------------------------------------------------------------------------

async function driveLoad(cfg) {
  // Dynamic import of autocannon (ESM-compatible)
  const require = createRequire(import.meta.url);
  const autocannon = require('autocannon');

  const opts = {
    url: cfg.target_endpoint,
    duration: cfg.duration_seconds ?? 20,
    connections: cfg.connections ?? 50,
    pipelining: cfg.pipelining ?? 1,
    ...(cfg.rate ? { overallRate: cfg.rate } : {}),
    ...(cfg.request_method && cfg.request_method.toUpperCase() !== 'GET'
      ? { method: cfg.request_method.toUpperCase() }
      : {}),
    ...(cfg.request_payload
      ? {
          body: JSON.stringify(cfg.request_payload),
          headers: { 'content-type': 'application/json' },
        }
      : {}),
  };

  return new Promise((resolve, reject) => {
    const instance = autocannon(opts, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    // Don't print autocannon's default output
    autocannon.track(instance, { renderProgressBar: false });
  });
}

function summarizeAutocannonResult(result) {
  const totalRequests = result.requests?.total ?? 0;
  const totalErrors = (result.errors ?? 0) +
    (result.non2xx ?? 0) +
    (result.timeouts ?? 0);

  return {
    req_per_sec: round(result.requests?.average ?? 0, 2),
    errors: totalErrors,
    p50_ms: round(result.latency?.p50 ?? 0, 2),
    p95_ms: round(result.latency?.p95 ?? 0, 2),
    p99_ms: round(result.latency?.p99 ?? 0, 2),
    _total_requests: totalRequests,
  };
}

// ---------------------------------------------------------------------------
// Functional test runner
// ---------------------------------------------------------------------------

async function runFunctionalTests(command) {
  const { exitCode, stdout, stderr } = await runCommand(command);

  // Try to parse structured output (TAP, Jest JSON, or simple counts)
  let passed = 0;
  let failed = 0;

  // Attempt to parse Jest-style JSON output
  try {
    const jsonMatch = stdout.match(/\{[\s\S]*"numPassedTests"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      passed = parsed.numPassedTests ?? 0;
      failed = parsed.numFailedTests ?? 0;
      return { passed, failed };
    }
  } catch { /* not Jest JSON */ }

  // Attempt to parse TAP-style output
  const tapPassed = (stdout.match(/^ok /gm) || []).length;
  const tapFailed = (stdout.match(/^not ok /gm) || []).length;
  if (tapPassed + tapFailed > 0) {
    return { passed: tapPassed, failed: tapFailed };
  }

  // Fallback: treat exit code as signal
  if (exitCode === 0) {
    // Count test lines or default to 1 passed
    const testLines = (stdout.match(/✓|PASS|pass/gi) || []).length;
    passed = Math.max(testLines, 1);
    failed = 0;
  } else {
    // Some tests failed
    const failLines = (stdout.match(/✗|FAIL|fail/gi) || []).length;
    const passLines = (stdout.match(/✓|PASS|pass/gi) || []).length;
    passed = passLines;
    failed = Math.max(failLines, 1);
  }

  return { passed, failed };
}

/** Run the documented fallback when the repository has no functional test suite. */
async function runHealthSmokeCheck(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return response.ok ? { passed: 1, failed: 0 } : { passed: 0, failed: 1 };
  } catch {
    return { passed: 0, failed: 1 };
  }
}

// ---------------------------------------------------------------------------
// Main experiment orchestration
// ---------------------------------------------------------------------------

async function main() {
  const outputPath = resolve(args.output);
  const startupTimeout = config.startup_timeout_ms ?? 30_000;
  let targetProcess = null;

  try {
    // -----------------------------------------------------------------------
    // 1. Start the target app
    // -----------------------------------------------------------------------
    console.log(`[experiment] Starting target app: ${config.start_command}`);
    targetProcess = startProcess(config.start_command);

    console.log(`[experiment] Waiting for readiness at ${config.health_probe_path} (timeout: ${startupTimeout}ms)...`);
    const ready = await waitForReady(config.health_probe_path, startupTimeout);
    if (!ready) {
      console.error('FATAL: Target app did not become ready within timeout.');
      console.error(`STDERR: ${targetProcess.getStderr()}`);
      process.exit(1);
    }
    console.log('[experiment] Target app is ready.');

    // -----------------------------------------------------------------------
    // 2. Optional warmup
    // -----------------------------------------------------------------------
    if (config.warmup_seconds && config.warmup_seconds > 0) {
      console.log(`[experiment] Warming up for ${config.warmup_seconds}s...`);
      await sleep(config.warmup_seconds * 1000);
    }

    // -----------------------------------------------------------------------
    // 3. Start independent health probe loop
    // -----------------------------------------------------------------------
    const healthProbe = createHealthProbe(
      config.health_probe_path,
      config.health_probe_interval_ms,
    );
    healthProbe.start();
    console.log('[experiment] Health probe started.');

    // -----------------------------------------------------------------------
    // 4. Start event-loop delay monitoring
    // -----------------------------------------------------------------------
    const eldResolution = config.event_loop_resolution_ms ?? 20;
    const eld = monitorEventLoopDelay({ resolution: eldResolution });
    eld.enable();
    console.log(`[experiment] Event-loop delay monitoring enabled (resolution: ${eldResolution}ms).`);

    // -----------------------------------------------------------------------
    // 5. Drive load with Autocannon
    // -----------------------------------------------------------------------
    console.log(`[experiment] Driving load for ${config.duration_seconds}s (${config.connections} connections)...`);
    const autocannonResult = await driveLoad(config);
    console.log('[experiment] Load phase complete.');

    // -----------------------------------------------------------------------
    // 6. Stop load and probe cleanly
    // -----------------------------------------------------------------------
    eld.disable();
    healthProbe.stop();
    console.log('[experiment] Probes stopped.');

    // Capture event-loop histogram
    const eventLoopMetrics = {
      p50_ms: round(eld.percentile(50) / 1e6, 2),  // ns → ms
      p95_ms: round(eld.percentile(95) / 1e6, 2),
      p99_ms: round(eld.percentile(99) / 1e6, 2),
      max_ms: round(eld.max / 1e6, 2),
    };

    // -----------------------------------------------------------------------
    // 7. Run functional tests SEPARATELY (outside the load path)
    // -----------------------------------------------------------------------
    const hasFunctionalCommand = typeof config.functional_test_command === 'string';
    console.log(hasFunctionalCommand
      ? `[experiment] Running functional tests: ${config.functional_test_command}`
      : `[experiment] Running health smoke check: ${config.health_probe_path}`);
    const functionalResult = hasFunctionalCommand
      ? await runFunctionalTests(config.functional_test_command)
      : await runHealthSmokeCheck(config.health_probe_path);
    console.log(`[experiment] Functional tests: ${functionalResult.passed} passed, ${functionalResult.failed} failed.`);

    // -----------------------------------------------------------------------
    // 8. Assemble and write metrics JSON
    // -----------------------------------------------------------------------
    const targetSummary = summarizeAutocannonResult(autocannonResult);
    const healthSummary = summarizeHealthResults(healthProbe.getResults());

    const metrics = {
      protocol_hash: protocolHash,
      event_loop: eventLoopMetrics,
      health: healthSummary,
      target: {
        req_per_sec: targetSummary.req_per_sec,
        errors: targetSummary.errors,
        total_requests: targetSummary._total_requests,
        p50_ms: targetSummary.p50_ms,
        p95_ms: targetSummary.p95_ms,
        p99_ms: targetSummary.p99_ms,
      },
      functional: functionalResult,
    };

    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(metrics, null, 2) + '\n', 'utf-8');
    console.log(`[experiment] Metrics written to ${outputPath}`);
    console.log(JSON.stringify(metrics, null, 2));

    // Clean up target
    killProcess(targetProcess);
    process.exit(0);

  } catch (err) {
    console.error(`FATAL: Experiment failed — ${err.message}`);
    console.error(err.stack);
    if (targetProcess) killProcess(targetProcess);
    // Exit non-zero and write NOTHING — a crashed run must never be mistaken for results
    process.exit(1);
  }
}

function killProcess(proc) {
  try {
    // Kill the entire process group
    process.kill(-proc.child.pid, 'SIGTERM');
  } catch {
    try { proc.child.kill('SIGTERM'); } catch { /* already dead */ }
  }
}

main();
