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
  /**
   * 計測区間の前に空回しする回数 (default 0)。
   *
   * 初回の呼出には 1 回きりの確保が混ざる。 Node の Buffer は 8KB の pool 単位で
   * 伸びるため、 fs を触る対象では最初の数回で pool がまとめて確保され、
   * それを反復数で割った値が「1 回あたりの保持」 として報告される。
   * 実測では暖機 3 回で 15 反復の arrayBuffers 増分が 24576B から 0B になった。
   *
   * 既定を 0 にしているのは、 published API の直接の呼出で挙動を変えないため。
   * kiwa 内部の 3 層測定は `memoryWarmup` で明示的に渡す。
   */
  warmup?: number;
}

export async function measureMemory(input: MemoryInput): Promise<MemorySample> {
  if (input.iterations < 1) {
    throw new Error(`measureMemory: iterations must be >= 1, got ${input.iterations}`);
  }
  // `Infinity` は空回しが終わらず、`NaN` は 0 回に潰れ、少数は暗黙に切り上がる。
  // published API の入口なので、解釈が分かれる値は受け取らずに落とす。
  const warmup = input.warmup ?? 0;
  if (!Number.isSafeInteger(warmup) || warmup < 0) {
    throw new Error(`measureMemory: warmup must be a non-negative integer, got ${warmup}`);
  }

  const gcRef = (globalThis as { gc?: () => void }).gc;
  const gcExposed = typeof gcRef === 'function';

  for (let index = 0; index < warmup; index += 1) {
    await input.fn();
  }

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
