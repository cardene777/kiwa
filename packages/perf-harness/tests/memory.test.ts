import { describe, expect, it } from 'vitest';
import { measureMemory } from '../src/index.js';

describe('measureMemory', () => {
  it('reports iteration count + delta shape', async () => {
    const result = await measureMemory({
      fn: async () => {
        // allocate a small transient object; may or may not survive GC
        const buf = Buffer.alloc(128);
        return buf.length;
      },
      iterations: 50,
    });
    expect(result.iterationCount).toBe(50);
    expect(Number.isFinite(result.heapUsedDeltaBytes)).toBe(true);
    expect(Number.isFinite(result.rssDeltaBytes)).toBe(true);
    expect(result.heapUsedDeltaPerIterationBytes).toBe(result.heapUsedDeltaBytes / 50);
  });

  it('rejects iterations < 1', async () => {
    await expect(measureMemory({ fn: () => {}, iterations: 0 })).rejects.toThrow(
      /iterations must be >= 1/,
    );
  });

  it('detects heap growth on obvious leak (arrayBuffers axis, GC-independent)', async () => {
    const leak: Buffer[] = [];
    const result = await measureMemory({
      fn: async () => {
        // intentional retained allocation via Buffer -> ArrayBuffer view
        leak.push(Buffer.alloc(10 * 1024)); // 10 KiB per call
      },
      iterations: 200,
    });
    // Retained Buffer allocations show up on arrayBuffers regardless of GC
    // exposure — heap axis can flap without --expose-gc so we assert on the
    // stable channel. 200 * 10 KiB = 2 MiB minimum retained.
    expect(result.arrayBuffersDeltaBytes).toBeGreaterThan(1024 * 1024);
    // exercise leak variable so lint/ts do not flag it as unused
    expect(leak.length).toBe(200);
  });

  it('空回しの分は計測区間に入れない (#1708)', async () => {
    // 1 回目だけ確保する対象。暖機で計測区間の外に出れば増分は 0 になる。
    // 実際の perf 測定では Node の Buffer pool がこの形で伸び、
    // 1 回きりの確保が反復数で割られて「1 回あたりの保持」 になっていた。
    const retained: Buffer[] = [];
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls === 1) retained.push(Buffer.alloc(64 * 1024));
    };

    const measured = await measureMemory({ fn, iterations: 10, warmup: 1 });

    expect(calls, '暖機 1 回 + 計測 10 回').toBe(11);
    expect(measured.iterationCount, '反復数は計測区間の回数だけを指す').toBe(10);
    expect(measured.arrayBuffersDeltaBytes).toBeLessThan(64 * 1024);
    expect(retained.length).toBe(1);
  });

  it('暖機なしだと 1 回きりの確保が保持として載る (#1708)', async () => {
    // 上の case の対照。既定 (warmup 0) では従来どおりの値になり、
    // published API の直接の呼出で挙動が変わらないことを押さえる。
    const retained: Buffer[] = [];
    let calls = 0;
    const fn = async () => {
      calls += 1;
      if (calls === 1) retained.push(Buffer.alloc(64 * 1024));
    };

    const measured = await measureMemory({ fn, iterations: 10 });

    expect(calls).toBe(10);
    expect(measured.arrayBuffersDeltaBytes).toBeGreaterThanOrEqual(64 * 1024);
    expect(retained.length).toBe(1);
  });

  it('rejects a warmup that is not a non-negative integer', async () => {
    // Infinity は空回しが終わらず、NaN は 0 回に潰れ、少数は暗黙に切り上がる。
    // published API の入口なので、解釈が分かれる値は受け取らない。
    for (const warmup of [-1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
      await expect(measureMemory({ fn: () => {}, iterations: 1, warmup })).rejects.toThrow(
        /warmup must be a non-negative integer/,
      );
    }
  });

  it('invokes globalThis.gc when it is exposed (before + after)', async () => {
    // Node is normally started without --expose-gc, so `globalThis.gc` is
    // undefined and the `gcExposed ? gcRef() : nothing` branches never fire.
    // Injecting a stub for the duration of the run closes those branches and
    // reports `gcExposed: true`.
    let gcCalls = 0;
    const originalGc = (globalThis as unknown as { gc?: () => void }).gc;
    (globalThis as unknown as { gc: () => void }).gc = () => {
      gcCalls += 1;
    };
    try {
      const result = await measureMemory({ fn: async () => {}, iterations: 1 });
      expect(result.gcExposed).toBe(true);
      // gcRef() is invoked once before the loop and once after → at least 2.
      expect(gcCalls).toBeGreaterThanOrEqual(2);
    } finally {
      if (originalGc === undefined) {
        delete (globalThis as unknown as { gc?: () => void }).gc;
      } else {
        (globalThis as unknown as { gc: () => void }).gc = originalGc;
      }
    }
  });
});
