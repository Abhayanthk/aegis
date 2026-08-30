# Repair Patterns — Code Examples

These patterns are referenced by the Repairer's decision tree in `repairer-playbook.md`.
Read this file only when you need a concrete code example for a specific pattern.

---

## Pattern 1: Worker Threads

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

## Pattern 2: Cooperative Chunking

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

## Pattern 3: Algorithmic Fix

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

## Pattern 4: Caching

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

## Pattern 5: Async Conversion

**When**: Synchronous Node.js APIs are used in the request path.

```javascript
// BEFORE
const data = fs.readFileSync('large-file.json', 'utf-8');

// AFTER
const data = await fs.promises.readFile('large-file.json', 'utf-8');
```
