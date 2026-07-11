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
