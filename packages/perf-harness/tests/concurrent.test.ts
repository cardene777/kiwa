import { describe, expect, it } from 'vitest';
import { measureConcurrent } from '../src/index.js';

describe('measureConcurrent', () => {
  it('collects samples from all workers', async () => {
    const result = await measureConcurrent({
      name: 'noop',
      fn: async () => {
        // trivial async unit
      },
      concurrency: 4,
      iterationsPerWorker: 25,
      warmup: 1,
    });
    expect(result.samples).toHaveLength(100);
    expect(result.iterations).toBe(100);
    expect(result.warmup).toBe(4); // per-worker warmup * concurrency
  });

  it('rejects concurrency < 1', async () => {
    await expect(
      measureConcurrent({ name: 'x', fn: () => {}, concurrency: 0, iterationsPerWorker: 1 }),
    ).rejects.toThrow(/concurrency must be >= 1/);
  });

  it('rejects iterationsPerWorker < 1', async () => {
    await expect(
      measureConcurrent({ name: 'x', fn: () => {}, concurrency: 1, iterationsPerWorker: 0 }),
    ).rejects.toThrow(/iterationsPerWorker must be >= 1/);
  });

  it('surfaces contention — slower with high concurrency on shared mutex', async () => {
    // shared counter guarded by an async mutex to simulate contention
    let lock = Promise.resolve();
    let counter = 0;
    const contended = async () => {
      const prior = lock;
      let release: () => void = () => {};
      lock = new Promise<void>((resolve) => {
        release = resolve;
      });
      await prior;
      counter += 1;
      release();
    };

    const serial = await measureConcurrent({
      name: 'contended-serial',
      fn: contended,
      concurrency: 1,
      iterationsPerWorker: 50,
    });
    counter = 0;
    lock = Promise.resolve();
    const parallel = await measureConcurrent({
      name: 'contended-parallel',
      fn: contended,
      concurrency: 10,
      iterationsPerWorker: 50,
    });
    // parallel mean should be >= serial mean under a mutex (queueing latency)
    expect(parallel.mean).toBeGreaterThanOrEqual(serial.mean);
  });
});
