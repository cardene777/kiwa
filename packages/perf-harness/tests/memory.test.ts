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

  /**
   * #1719 — 空回しは固定回数なので、 反復数に応じて伸びる Buffer pool までは吸えない。
   * 区間を分けて手前に伸びを引き受けさせ、 最後の区間の増分を判定に使う。
   */
  describe('区間分割 (#1719)', () => {
    it('反復数に応じて伸びる確保は最後の区間から消える', async () => {
      // 呼出回数が増えるほど段階的に確保する対象。 実際の Buffer pool と同じ形で、
      // 空回しを固定回数にしても反復数を増やせばまた伸びる。
      const retained: Buffer[] = [];
      let calls = 0;
      const fn = () => {
        calls += 1;
        // 10 回目までは 8KB ずつ確保し、 それ以降は確保しない = 飽和する。
        if (calls <= 10) retained.push(Buffer.alloc(8 * 1024));
      };

      const measured = await measureMemory({ fn, iterations: 10, windows: 2 });

      expect(calls, '2 区間 × 10 反復').toBe(20);
      expect(measured.windowCount).toBe(2);
      expect(measured.arrayBuffersDeltaByWindowBytes).toHaveLength(2);
      // 手前の区間が伸びを引き受け、 最後の区間には残らない。
      expect(measured.arrayBuffersDeltaByWindowBytes[0]).toBeGreaterThanOrEqual(80 * 1024);
      expect(measured.arrayBuffersDeltaBytes).toBeLessThan(8 * 1024);
      // 代表値は最後の区間と一致する。
      expect(measured.arrayBuffersDeltaBytes).toBe(measured.arrayBuffersDeltaByWindowBytes[1]);
      expect(retained.length).toBe(10);
    });

    it('1 区間だけだと同じ確保が判定値に載る', async () => {
      // 上の case の対照。 区間を分けない従来の形では飽和ぶんが代表値に残る。
      const retained: Buffer[] = [];
      let calls = 0;
      const fn = () => {
        calls += 1;
        if (calls <= 10) retained.push(Buffer.alloc(8 * 1024));
      };

      const measured = await measureMemory({ fn, iterations: 10 });

      expect(calls).toBe(10);
      expect(measured.windowCount).toBe(1);
      expect(measured.arrayBuffersDeltaBytes).toBeGreaterThanOrEqual(80 * 1024);
      expect(retained.length).toBe(10);
    });

    it('反復ごとに保持する op は区間を分けても検知できる', async () => {
      // 飽和と本物の保持を取り違えないことの確認。 どの区間でも同じ量が出る。
      const leak: Buffer[] = [];
      const measured = await measureMemory({
        fn: () => {
          leak.push(Buffer.alloc(10 * 1024));
        },
        iterations: 50,
        windows: 2,
      });

      expect(measured.arrayBuffersDeltaBytes).toBeGreaterThan(400 * 1024);
      for (const delta of measured.arrayBuffersDeltaByWindowBytes) {
        expect(delta).toBeGreaterThan(400 * 1024);
      }
      expect(leak.length).toBe(100);
    });

    it('総呼出数に区間の数が反映される', async () => {
      let calls = 0;
      const measured = await measureMemory({
        fn: () => {
          calls += 1;
        },
        iterations: 5,
        warmup: 3,
        windows: 3,
      });

      // 空回し 3 + 5 反復 × 3 区間 = 18。
      expect(calls).toBe(18);
      expect(measured.warmupCount).toBe(3);
      expect(measured.iterationCount, '反復数は 1 区間ぶんを指す').toBe(5);
      expect(measured.windowCount).toBe(3);
      expect(measured.totalCallCount).toBe(18);
      expect(measured.arrayBuffersDeltaByWindowBytes).toHaveLength(3);
    });

    it('既定は 1 区間で、published API の直接の呼出は挙動が変わらない', async () => {
      let calls = 0;
      const measured = await measureMemory({
        fn: () => {
          calls += 1;
        },
        iterations: 7,
      });

      expect(calls).toBe(7);
      expect(measured.windowCount).toBe(1);
      expect(measured.totalCallCount).toBe(7);
      expect(measured.arrayBuffersDeltaByWindowBytes).toHaveLength(1);
      expect(measured.arrayBuffersDeltaBytes).toBe(measured.arrayBuffersDeltaByWindowBytes[0]);
    });

    it('区間の数が 1 以上の整数でなければ落とす', async () => {
      // 0 と少数は区間の数として意味を持たず、Infinity は終わらない。
      for (const windows of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, 1.5]) {
        await expect(measureMemory({ fn: () => {}, iterations: 1, windows })).rejects.toThrow(
          /windows must be an integer >= 1/,
        );
      }
    });

    it('区間ごとに GC を呼ぶ', async () => {
      // 区間の境目で GC を挟まないと、 手前の区間の一時使用が次の区間の
      // 開始時点に残り、 増分が負に振れる。
      let gcCalls = 0;
      const originalGc = (globalThis as unknown as { gc?: () => void }).gc;
      (globalThis as unknown as { gc: () => void }).gc = () => {
        gcCalls += 1;
      };
      try {
        const measured = await measureMemory({ fn: () => {}, iterations: 1, windows: 3 });
        expect(measured.gcExposed).toBe(true);
        // 区間ごとに前後 1 回ずつ = 3 区間で 6 回。
        expect(gcCalls).toBeGreaterThanOrEqual(6);
      } finally {
        if (originalGc === undefined) {
          delete (globalThis as unknown as { gc?: () => void }).gc;
        } else {
          (globalThis as unknown as { gc: () => void }).gc = originalGc;
        }
      }
    });
  });

  /**
   * #1730 — 空回しは測定区間の外で `fn` を呼ぶため、 副作用や件数依存を持つ op では
   * 同じ `iterations` でも空回しの有無で測っているものが変わる。 実際に何回呼んだかを
   * 記録に残し、 report から読めるようにする。
   */
  describe('総呼出数の記録 (#1730)', () => {
    it('空回しの回数と総呼出数を記録する', async () => {
      let calls = 0;
      const result = await measureMemory({
        fn: () => {
          calls += 1;
        },
        iterations: 5,
        warmup: 3,
      });
      // 実際に呼ばれた回数と記録が食い違うと、 report の値が証跡にならない。
      expect(calls).toBe(8);
      expect(result.warmupCount).toBe(3);
      expect(result.iterationCount).toBe(5);
      expect(result.totalCallCount).toBe(8);
    });

    it('空回しなしでは総呼出数が反復数と一致する', async () => {
      let calls = 0;
      const result = await measureMemory({
        fn: () => {
          calls += 1;
        },
        iterations: 4,
      });
      expect(calls).toBe(4);
      expect(result.warmupCount).toBe(0);
      expect(result.totalCallCount).toBe(4);
    });

    it('同じ反復数でも空回しの有無で総呼出数が変わる', async () => {
      const fn = () => {};
      const without = await measureMemory({ fn, iterations: 10 });
      const withWarmup = await measureMemory({ fn, iterations: 10, warmup: 4 });
      // 反復数だけを見ると同じ測定に見えるが、 副作用を持つ op では
      // 4 回ぶん進んだ状態を測っている。
      expect(without.iterationCount).toBe(withWarmup.iterationCount);
      expect(without.totalCallCount).toBe(10);
      expect(withWarmup.totalCallCount).toBe(14);
    });
  });
});
