/**
 * measureMemory — capture heap deltas around a target function.
 *
 * Real production concerns include memory growth per call. A p95 of 5ms is
 * useless if every call leaks 100KB of retained heap. This helper wraps a
 * target function with a global.gc() + process.memoryUsage() bracket so
 * tests can assert on `heapUsedDelta` / `rssUsedDelta` per call.
 *
 * Requires Node to be launched with `--expose-gc` for stable readings.
 * When GC is not exposed we fall back to a delta without forced GC — the
 * numbers are noisier but the trend still catches egregious leaks.
 */
export interface MemorySample {
  iterationCount: number;
  heapUsedDeltaBytes: number;
  heapUsedDeltaPerIterationBytes: number;
  rssDeltaBytes: number;
  externalDeltaBytes: number;
  arrayBuffersDeltaBytes: number;
  gcExposed: boolean;
}

export interface MemoryInput {
  fn: () => Promise<unknown> | unknown;
  iterations: number;
}

export async function measureMemory(input: MemoryInput): Promise<MemorySample> {
  if (input.iterations < 1) {
    throw new Error(`measureMemory: iterations must be >= 1, got ${input.iterations}`);
  }

  const gcRef = (globalThis as { gc?: () => void }).gc;
  const gcExposed = typeof gcRef === 'function';

  if (gcExposed) gcRef!();
  const before = process.memoryUsage();

  for (let index = 0; index < input.iterations; index += 1) {
    await input.fn();
  }

  if (gcExposed) gcRef!();
  const after = process.memoryUsage();

  const heapUsedDelta = after.heapUsed - before.heapUsed;
  return {
    iterationCount: input.iterations,
    heapUsedDeltaBytes: heapUsedDelta,
    heapUsedDeltaPerIterationBytes: heapUsedDelta / input.iterations,
    rssDeltaBytes: after.rss - before.rss,
    externalDeltaBytes: after.external - before.external,
    arrayBuffersDeltaBytes: after.arrayBuffers - before.arrayBuffers,
    gcExposed,
  };
}
