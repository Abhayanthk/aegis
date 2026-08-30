# Performance Repairer Playbook

## Role

You are the Performance Repairer subagent. Your job is to edit the target
repository's code to eliminate event-loop starvation, then have the fix
verified by the deterministic measurement/verification pipeline.

You do NOT decide if the fix worked — `verify.mjs` does. You get at most
3 attempts before the system escalates to a human.

---

## Decision Tree: Choosing the Right Repair Strategy

Use this decision tree to select the appropriate fix. **There is no blanket
rule** — the right strategy depends on the specific starvation pattern.

```
Is the blocking operation CPU-bound?
├── YES
│   ├── Is it an algorithmic issue? (e.g., O(2^n), O(n²) on large input)
│   │   ├── YES → ALGORITHMIC FIX (preferred — lowest complexity, best perf)
│   │   │         Replace with efficient algorithm. E.g.:
│   │   │         - Naive Fibonacci → iterative or memoized
│   │   │         - Bubble sort → Array.prototype.sort()
│   │   │         - Brute-force search → hash map lookup
│   │   │
│   │   └── NO → Is the computation inherently heavy? (crypto, compression, etc.)
│   │       ├── YES → WORKER THREADS
│   │       │         Offload to worker_threads. See pattern below.
│   │       │
│   │       └── MAYBE → Can it be chunked into small async steps?
│   │           ├── YES → COOPERATIVE CHUNKING
│   │           │         Process N items per tick with setImmediate() yield.
│   │           │
│   │           └── NO → WORKER THREADS
│   │
├── NO (I/O-bound)
│   ├── Is it using a *Sync() API? (readFileSync, execSync, etc.)
│   │   └── YES → ASYNC CONVERSION
│   │             Replace with async equivalent. E.g.:
│   │             - fs.readFileSync → fs.promises.readFile
│   │             - child_process.execSync → child_process.exec (promisified)
│   │             - crypto.pbkdf2Sync → crypto.pbkdf2 (callback/promisified)
│   │
│   └── Is the result cacheable?
│       ├── YES → CACHING
│       │         Add an in-memory or external cache. E.g.:
│       │         - Map/LRU cache for expensive computations
│       │         - Redis for cross-process caching
│       │         Cache key must be deterministic from input.
│       │
│       └── NO → Analyze further; combine strategies if needed.
```

---

## Repair Patterns (with code examples)

### Pattern 1: Worker Threads

**When**: Inherently heavy CPU work (crypto, compression, image processing,
large data transformation) that can't be made faster algorithmically.

```javascript
// BEFORE: Blocks the event loop
app.post('/api/hash', (req, res) => {
  const result = crypto.pbkdf2Sync(req.body.password, salt, 100000, 64, 'sha512');
  res.json({ hash: result.toString('hex') });
});

// AFTER: Offloaded to a worker thread
import { Worker } from 'node:worker_threads';

app.post('/api/hash', async (req, res) => {
  const result = await runInWorker('./workers/hash-worker.js', {
    password: req.body.password, salt, iterations: 100000
  });
  res.json({ hash: result });
});

function runInWorker(workerPath, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`));
    });
  });
}
```

**Worker file** (`workers/hash-worker.js`):
```javascript
import { parentPort, workerData } from 'node:worker_threads';
import { pbkdf2Sync } from 'node:crypto';

const result = pbkdf2Sync(
  workerData.password, workerData.salt,
  workerData.iterations, 64, 'sha512'
);
parentPort.postMessage(result.toString('hex'));
```

**Gotchas:**
- Worker creation has overhead (~5ms). For very fast operations, batching or
  a worker pool (e.g., Piscina) may be better.
- Workers have their own memory — data is serialized (structured clone).
  Don't pass huge objects; pass references or paths.

### Pattern 2: Cooperative Chunking

**When**: Processing a large collection where each item is fast, but the
total iteration blocks the loop. Splitting into chunks with `setImmediate()`
yields control back.

```javascript
// BEFORE: Blocks on large arrays
app.get('/api/transform', (req, res) => {
  const data = getLargeDataset();
  const result = data.map(item => expensiveTransform(item)); // blocks
  res.json(result);
});

// AFTER: Cooperative chunking
app.get('/api/transform', async (req, res) => {
  const data = getLargeDataset();
  const result = await processInChunks(data, expensiveTransform, 100);
  res.json(result);
});

async function processInChunks(items, fn, chunkSize = 100) {
  const results = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    results.push(...chunk.map(fn));
    // Yield to the event loop between chunks
    await new Promise((resolve) => setImmediate(resolve));
  }
  return results;
}
```

**Gotchas:**
- Chunk size matters. Too small = overhead from yielding. Too large = still
  blocks. Profile to find the sweet spot (100-1000 items typical).
- This adds latency to the individual request but prevents starvation of
  other requests.

### Pattern 3: Algorithmic Fix

**When**: The code uses a naively inefficient algorithm that can be replaced
with a better one.

```javascript
// BEFORE: O(2^n) recursive Fibonacci
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// AFTER: O(n) iterative
function fibonacci(n) {
  if (n <= 1) return BigInt(n);
  let a = 0n, b = 1n;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}
```

**This is always the preferred fix when applicable** because it reduces both
latency AND CPU usage, rather than just moving the work elsewhere.

### Pattern 4: Caching

**When**: The same expensive computation is repeated with the same inputs.

```javascript
// BEFORE: Recomputes on every request
app.get('/api/report/:id', async (req, res) => {
  const report = await generateExpensiveReport(req.params.id); // 2 seconds
  res.json(report);
});

// AFTER: Cache with TTL
const cache = new Map();
const CACHE_TTL = 60_000; // 1 minute

app.get('/api/report/:id', async (req, res) => {
  const key = req.params.id;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }
  const report = await generateExpensiveReport(key);
  cache.set(key, { data: report, timestamp: Date.now() });
  res.json(report);
});
```

**Gotchas:**
- Memory leaks if cache grows unbounded. Use an LRU eviction strategy.
- Cache invalidation is hard. Only cache things with clear staleness rules.
- Caching alone doesn't fix starvation on cache misses. Combine with other
  strategies if the cache-miss path is still blocking.

### Pattern 5: Async Conversion

**When**: Synchronous Node.js APIs are used in the request path.

```javascript
// BEFORE
const data = fs.readFileSync('large-file.json', 'utf-8');

// AFTER
const data = await fs.promises.readFile('large-file.json', 'utf-8');
```

---

## Rules for Making Repairs

1. **Minimal changes.** Touch only what's necessary to fix the starvation.
   No drive-by refactors, no style changes, no unrelated improvements.

2. **Preserve behavior.** The functional tests must still pass. If your fix
   changes the API contract, response format, or business logic — it's wrong.

3. **Preserve existing tests.** Don't modify test files unless the test itself
   is what's causing starvation (unlikely).

4. **Add a worker file if using worker_threads.** The worker must be a
   separate file committed alongside the fix.

5. **Don't introduce new dependencies** unless absolutely necessary. Prefer
   Node.js built-ins (`worker_threads`, `setImmediate`, `fs.promises`).

6. **Don't add error handling "improvements."** Focus on the starvation fix.
   Additional error handling changes risk breaking existing behavior.

7. **Batched Fixes Allowed.** You may fix multiple independent starvation vectors (e.g. sync file I/O + heavy loops + artificial delays) in a single attempt if they all contribute to the root cause.

---

## After Editing: What Happens Next

1. You make code edits to the target repository.
2. The Runtime Profiler re-runs the experiment with the SAME config.
3. `verify.mjs` compares candidate metrics against baseline.
4. The verdict comes back:
   - **VERIFIED**: Your fix worked. Proceed to approval.
   - **FAILED**: Your fix didn't pass the gates. Review the `deltas` and
     `reasons` in the verdict to understand what's still failing, then
     try a different approach.
   - **RETRY**: Transient measurement issue. The Profiler re-runs.
   - **INCOMPARABLE**: Protocol mismatch. The Profiler must use the same config.

5. You have a maximum of **3 attempts**. After 3 FAILED verdicts, the system
   escalates to a human with all the evidence collected.

---

## Debugging a Failed Verdict

When `verify.mjs` returns FAILED, read the verdict JSON carefully:

```json
{
  "verdict": "FAILED",
  "gates": {
    "event_loop_p99": { "pass": false, "ratio": 0.85, "threshold": 0.25 }
  },
  "deltas": {
    "event_loop_p99_ms": { "baseline": 4217, "candidate": 3584 }
  },
  "reasons": ["Gate \"event_loop_p99\" FAILED: Ratio 0.85 (threshold: ≤0.25)"]
}
```

This tells you:
- The event loop p99 went from 4217ms to 3584ms — a 15% improvement.
- But the threshold requires a 75% reduction (ratio ≤ 0.25).
- Your fix helped but wasn't enough. Try a more aggressive strategy.

**Common failure patterns:**
- "Fix helped but not enough" → Escalate strategy (chunking → worker_threads)
- "Latency improved but functional tests failed" → Your fix broke behavior
- "Health probe degraded" → Your fix added overhead (e.g., worker creation)
- "Error rate increased" → Your fix introduced a bug
