import { buildMeasureResult } from './measure.js';
import type { MeasureResult } from './types.js';

/**
 * measureConcurrent — drive `fn` under a fixed concurrency load and record
 * per-call latency.
 *
 * Real production traffic is not serial. A p95 that looks fine at
 * `iterations = 200, concurrency = 1` (the default `measure`) can collapse
 * once N clients hit the same code path at once because contention on the
 * shared engine / recorder / queue kicks in.
 *
 * This helper spawns `concurrency` parallel workers, each of which loops
 * `iterationsPerWorker` times. Total sample count = concurrency ×
 * iterationsPerWorker. Every sample is a wall-clock per-call latency (from
 * `process.hrtime.bigint()` around each `fn()` invocation).
 *
 * Returned {@link MeasureResult} has the same shape as `measure` so
 * downstream regression / gate / report code does not need to branch.
 *
 * @param input.name identifier for the report
 * @param input.fn the async unit to exercise
 * @param input.concurrency number of parallel workers (must be >= 1)
 * @param input.iterationsPerWorker per-worker loop count (must be >= 1)
 * @param input.warmup discarded warmup iterations per worker (default 0)
 */
export interface ConcurrentInput {
  name: string;
  fn: () => Promise<unknown> | unknown;
  concurrency: number;
  iterationsPerWorker: number;
  warmup?: number;
}

export async function measureConcurrent(input: ConcurrentInput): Promise<MeasureResult> {
  if (input.concurrency < 1) {
    throw new Error(`measureConcurrent: concurrency must be >= 1, got ${input.concurrency}`);
  }
  if (input.iterationsPerWorker < 1) {
    throw new Error(
      `measureConcurrent: iterationsPerWorker must be >= 1, got ${input.iterationsPerWorker}`,
    );
  }
  const warmup = input.warmup ?? 0;
  if (warmup < 0) {
    throw new Error(`measureConcurrent: warmup must be >= 0, got ${warmup}`);
  }

  const worker = async (): Promise<number[]> => {
    for (let index = 0; index < warmup; index += 1) {
      await input.fn();
    }
    const local: number[] = [];
    for (let index = 0; index < input.iterationsPerWorker; index += 1) {
      const start = process.hrtime.bigint();
      await input.fn();
      const end = process.hrtime.bigint();
      local.push(Number(end - start) / 1_000_000);
    }
    return local;
  };

  const workers = Array.from({ length: input.concurrency }, () => worker());
  const perWorkerSamples = await Promise.all(workers);
  const samples = perWorkerSamples.flat();
  const totalIterations = input.concurrency * input.iterationsPerWorker;
  return buildMeasureResult(input.name, totalIterations, warmup * input.concurrency, samples);
}
