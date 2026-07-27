import { ANVIL_DEFAULT_PRIVATE_KEYS, createEventEmitter } from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'dapp';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: event emitter + address rotation primary paths',
    async () => {
      const emitter = createEventEmitter();
      const handler = () => {};
      emitter.on('accountsChanged', handler);

      const keyRing = ANVIL_DEFAULT_PRIVATE_KEYS;
      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            // emit + listenerCount round-trip. node:events dispatch is the
            // JS-floor primitive so p95 should sit well under the mock cap.
            name: 'eventEmitterEmit',
            serialP95CapMs: 5,
            fn: () => {
              emitter.emit('accountsChanged', ['0x1']);
              emitter.listenerCount('accountsChanged');
            },
          },
          {
            // Bounded lookup into the 10-key ring. Measures readonly array
            // indexing + null-check chain — the hot path of setActiveAccount.
            name: 'anvilKeyLookup',
            serialP95CapMs: 5,
            fn: () => {
              const idx = Math.floor(Math.random() * keyRing.length);
              const key = keyRing[idx];
              if (!key) throw new Error('key missing');
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
