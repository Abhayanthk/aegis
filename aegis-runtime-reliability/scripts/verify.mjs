#!/usr/bin/env node

/**
 * verify.mjs — Deterministic verdict engine (source of truth).
 *
 * PURPOSE: Compare baseline vs candidate metrics against the verification
 * policy and emit an unambiguous verdict. This script contains NO randomness
 * and NO model inference — it is pure computation.
 *
 * USAGE:
 *   node verify.mjs --baseline <baseline/metrics.json> \
 *                    --candidate <candidate/metrics.json> \
 *                    --policy <config/verification-policy.json> \
 *                    --output <verdict.json>
 *
 * EXIT CODES:
 *   0 — Verifier ran successfully. The verdict (VERIFIED | FAILED | RETRY | ESCALATE)
 *       is in the output JSON. The agent MUST read the verdict field.
 *   1 — Verifier itself crashed (bad inputs, missing files, script error).
 *       This is distinct from a FAILED verdict.
 *
 * VERDICTS:
 *   VERIFIED     — All required gates pass. The candidate is better.
 *   FAILED       — One or more required gates failed. The repair did not work.
 *   RETRY        — Metrics suggest a transient issue; re-run the experiment.
 *   ESCALATE     — Protocol mismatch or other structural problem; human needed.
 *   INCOMPARABLE — Baseline and candidate used different protocols.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { parseArgs } from 'node:util';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    baseline:  { type: 'string', short: 'b' },
    candidate: { type: 'string', short: 'c' },
    policy:    { type: 'string', short: 'p' },
    output:    { type: 'string', short: 'o', default: 'verdict.json' },
  },
  strict: true,
});

if (!args.baseline || !args.candidate || !args.policy) {
  console.error(
    'Usage: node verify.mjs --baseline <path> --candidate <path> --policy <path> [--output <path>]'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Load inputs
// ---------------------------------------------------------------------------

function loadJSON(path, label) {
  try {
    return JSON.parse(readFileSync(resolve(path), 'utf-8'));
  } catch (err) {
    console.error(`FATAL: Cannot load ${label} from ${path}: ${err.message}`);
    process.exit(1);
  }
}

const baseline  = loadJSON(args.baseline, 'baseline metrics');
const candidate = loadJSON(args.candidate, 'candidate metrics');
const policy    = loadJSON(args.policy, 'verification policy');

// ---------------------------------------------------------------------------
// Protocol hash check
// ---------------------------------------------------------------------------

if (policy.rules?.same_protocol_hash_required && baseline.protocol_hash !== candidate.protocol_hash) {
  const verdict = {
    verdict: 'INCOMPARABLE',
    gates: {},
    deltas: {},
    reasons: [
      `Protocol hash mismatch: baseline="${baseline.protocol_hash}" vs candidate="${candidate.protocol_hash}". ` +
      'Baseline and candidate must use identical experiment configurations to be comparable.'
    ],
  };
  writeVerdict(verdict);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Gate evaluation helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj, path) {
  return path.split('.').reduce((o, key) => o?.[key], obj);
}

function round(n, decimals = 4) {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

// ---------------------------------------------------------------------------
// Evaluate each gate from policy
// ---------------------------------------------------------------------------

const gateResults = {};
const deltas = {};
const reasons = [];
let allRequiredPass = true;
let hasRetrySignal = false;

for (const [gateName, gateDef] of Object.entries(policy.gates)) {
  const baselineValue  = getNestedValue(baseline, gateDef.metric_path);
  const candidateValue = getNestedValue(candidate, gateDef.metric_path);

  if (baselineValue === undefined || baselineValue === null) {
    gateResults[gateName] = { pass: false, value: null, threshold: gateDef.threshold, error: 'missing_baseline_metric' };
    if (gateDef.required) {
      allRequiredPass = false;
      reasons.push(`${gateName}: Baseline metric "${gateDef.metric_path}" is missing.`);
    }
    continue;
  }
  if (candidateValue === undefined || candidateValue === null) {
    gateResults[gateName] = { pass: false, value: null, threshold: gateDef.threshold, error: 'missing_candidate_metric' };
    if (gateDef.required) {
      allRequiredPass = false;
      reasons.push(`${gateName}: Candidate metric "${gateDef.metric_path}" is missing.`);
    }
    continue;
  }

  let pass = false;
  let computedValue = null;

  switch (gateDef.mode) {
    case 'ratio_candidate_over_baseline': {
      // candidate / baseline must be <= threshold
      computedValue = baselineValue === 0 ? (candidateValue === 0 ? 0 : Infinity) : round(candidateValue / baselineValue);
      pass = computedValue <= gateDef.threshold;
      deltas[gateName + '_ms'] = { baseline: baselineValue, candidate: candidateValue };
      gateResults[gateName] = { pass, ratio: computedValue, threshold: gateDef.threshold };
      break;
    }

    case 'absolute_min': {
      // candidate value must be >= threshold
      computedValue = candidateValue;
      pass = candidateValue >= gateDef.threshold;
      deltas[gateName] = { baseline: baselineValue, candidate: candidateValue };
      gateResults[gateName] = { pass, value: computedValue, threshold: gateDef.threshold };
      break;
    }

    case 'absolute_max': {
      // candidate value must be <= threshold
      computedValue = candidateValue;
      pass = candidateValue <= gateDef.threshold;
      deltas[gateName] = { baseline: baselineValue, candidate: candidateValue };
      gateResults[gateName] = { pass, value: computedValue, threshold: gateDef.threshold };
      break;
    }

    case 'error_rate': {
      // Compute error rate from candidate target metrics
      const candidateErrors = candidateValue;
      const baselineErrors = baselineValue;
      // Use total_requests from the metrics output (set by run_experiment.mjs)
      const candidateTotal = candidate.target?.total_requests;
      let errorRate;
      if (candidateTotal && candidateTotal > 0) {
        errorRate = round(candidateErrors / candidateTotal);
      } else {
        // Fallback: estimate from req_per_sec if total not available
        // This is less accurate but better than treating any error as 100%
        const estimatedTotal = candidate.target?.req_per_sec
          ? Math.round(candidate.target.req_per_sec * 30) // assume 30s default
          : 0;
        if (estimatedTotal > 0) {
          errorRate = round(candidateErrors / estimatedTotal);
        } else {
          // Last resort: if we can't compute a rate, any errors = fail
          errorRate = candidateErrors > 0 ? 1.0 : 0;
        }
      }
      computedValue = errorRate;
      pass = errorRate <= gateDef.threshold;
      deltas[gateName] = { baseline: baselineErrors, candidate: candidateErrors, error_rate: errorRate };
      gateResults[gateName] = { pass, error_rate: errorRate, threshold: gateDef.threshold };
      break;
    }

    case 'functional_all_pass': {
      // passed / (passed + failed) must == 1.0
      const total = (candidate.functional?.passed ?? 0) + (candidate.functional?.failed ?? 0);
      const passRate = total > 0 ? round(candidateValue / total) : 0;
      computedValue = passRate;
      pass = passRate >= gateDef.threshold;
      deltas[gateName] = {
        baseline: { passed: baseline.functional?.passed, failed: baseline.functional?.failed },
        candidate: { passed: candidate.functional?.passed, failed: candidate.functional?.failed },
        pass_rate: passRate,
      };
      gateResults[gateName] = { pass, pass_rate: passRate, threshold: gateDef.threshold };
      break;
    }

    default: {
      gateResults[gateName] = { pass: false, error: `unknown_mode: ${gateDef.mode}`, threshold: gateDef.threshold };
      if (gateDef.required) {
        allRequiredPass = false;
        reasons.push(`${gateName}: Unknown gate evaluation mode "${gateDef.mode}".`);
      }
      continue;
    }
  }

  if (!pass && gateDef.required) {
    allRequiredPass = false;
    reasons.push(formatFailureReason(gateName, gateDef, gateResults[gateName], deltas));
  }
}

// ---------------------------------------------------------------------------
// Determine final verdict
// ---------------------------------------------------------------------------

let verdict;
if (allRequiredPass) {
  verdict = 'VERIFIED';
} else {
  // Check for retry signals: if only health/target gates failed marginally,
  // it might be a transient infrastructure issue
  const failedGates = Object.entries(gateResults).filter(([_, g]) => !g.pass);
  const isTransient = failedGates.every(([name, g]) => {
    // Health timeouts or slight misses could be transient
    if (name.startsWith('health_') && g.value !== undefined) {
      const margin = Math.abs((g.value - (g.threshold ?? 0)) / (g.threshold || 1));
      return margin < 0.1; // within 10% of threshold
    }
    return false;
  });

  if (isTransient && failedGates.length > 0) {
    verdict = 'RETRY';
  } else {
    verdict = 'FAILED';
  }
}

// ---------------------------------------------------------------------------
// Format and output
// ---------------------------------------------------------------------------

function formatFailureReason(gateName, gateDef, result, deltas) {
  const parts = [`Gate "${gateName}" FAILED:`];
  parts.push(`  Description: ${gateDef.description}`);

  if (result.ratio !== undefined) {
    parts.push(`  Ratio: ${result.ratio} (threshold: ≤${result.threshold})`);
  }
  if (result.value !== undefined) {
    parts.push(`  Value: ${result.value} (threshold: ${gateDef.mode === 'absolute_min' ? '≥' : '≤'}${result.threshold})`);
  }
  if (result.error_rate !== undefined) {
    parts.push(`  Error rate: ${result.error_rate} (threshold: ≤${result.threshold})`);
  }
  if (result.pass_rate !== undefined) {
    parts.push(`  Pass rate: ${result.pass_rate} (threshold: ≥${result.threshold})`);
  }

  const delta = deltas[gateName] || deltas[gateName + '_ms'];
  if (delta) {
    parts.push(`  Baseline: ${JSON.stringify(delta.baseline)}`);
    parts.push(`  Candidate: ${JSON.stringify(delta.candidate)}`);
  }

  return parts.join('\n');
}

const verdictOutput = {
  verdict,
  gates: gateResults,
  deltas,
  reasons: verdict === 'VERIFIED' ? [] : reasons,
};

function writeVerdict(v) {
  const outputPath = resolve(args.output);
  mkdirSync(dirname(outputPath), { recursive: true });
  const json = JSON.stringify(v, null, 2) + '\n';
  writeFileSync(outputPath, json, 'utf-8');
  // Also print to stdout so the agent can read it directly
  console.log(json);
}

writeVerdict(verdictOutput);
process.exit(0);
