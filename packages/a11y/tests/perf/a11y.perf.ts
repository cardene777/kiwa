/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { reportViolations, runAxe } from '../../src/index.js';

const MODULE = 'a11y';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

// Small labelled fixture (WCAG pass) — measures axe walk overhead on 誤検知なし。
const CLEAN_MARKUP = `<button type="button" aria-label="open">Open</button>
  <label>Name<input type="text" /></label>
  <a href="#main">Skip to main</a>`;

// Larger fixture with intentional violation (unlabeled button) — measures axe
// walk with violation collection path。
const DIRTY_MARKUP = `<button type="button"></button>
  <img src="a.png" />
  <input type="text" />
  <div>${'<span>row</span>'.repeat(20)}</div>`;

/**
 * concurrent worker が同じ document.body を race で書き換えると
 * `document.getElementById('root')` が null になって axe が throw する。
 * 各 iteration で unique な root div を append + axe に context として渡し、
 * 終わったら detach する経路にすることで、 concurrent 4 worker × 5 iteration の
 * layer でも race せず measure できる。
 */
function withScope(markup: string): Element {
  const root = document.createElement('div');
  root.innerHTML = markup;
  document.body.appendChild(root);
  return root;
}

function cleanup(root: Element): void {
  root.remove();
}

/**
 * axe-core は global singleton で 1 run のみを同時実行できる (`Axe is already
 * running` throw 経路)。 measureConcurrent は N worker を Promise.all で起動
 * するため、 axe run を serial に待たせる mutex が必要。 待機時間込みの wall
 * clock は「実プロダクションで N client が同時 axe を呼んだ時の per-call
 * latency」 の正しい proxy になるため、 mutex overhead も measure に含めて
 * baseline に持たせる。
 */
let axeChain: Promise<unknown> = Promise.resolve();
async function serializeAxe<T>(op: () => Promise<T>): Promise<T> {
  const previous = axeChain;
  let release!: () => void;
  axeChain = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    await previous;
    return await op();
  } finally {
    release();
  }
}

describe(MODULE, () => {
  it(
    '3-layer perf: axe-core walk primary paths (WCAG scan p95)',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        // axe walk + reportViolations は React render 相当のコストがあるため、
        // ui pattern と同様に iteration / concurrency を落とす。 issue 記載どおり
        // 「iteration 少なめ (10-30) で run time 優先」 に沿う。
        serialIterations: 20,
        serialWarmup: 3,
        concurrency: 4,
        iterationsPerWorker: 5,
        memoryIterations: 20,
        ops: [
          {
            // primary axe walk = jsdom root scan + rules exec + result build
            name: 'runAxeClean',
            serialP95CapMs: 400,
            fn: () =>
              serializeAxe(async () => {
                const root = withScope(CLEAN_MARKUP);
                try {
                  await runAxe({ context: root });
                } finally {
                  cleanup(root);
                }
              }),
          },
          {
            // violation path = axe walk + report build + impact ranking
            name: 'runAxeDirtyReport',
            regressionGateWaived: 'p10 の実行間の振れ幅が 22-24% で閾値 20% を超える (#1718)',
            serialP95CapMs: 400,
            fn: () =>
              serializeAxe(async () => {
                const root = withScope(DIRTY_MARKUP);
                try {
                  const results = await runAxe({ context: root });
                  reportViolations(results, { maxImpact: 'moderate' });
                } finally {
                  cleanup(root);
                }
              }),
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
    240_000,
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
