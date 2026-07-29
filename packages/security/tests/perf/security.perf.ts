import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCspHeader, validateNonce } from '../../src/index.js';

const MODULE = 'security';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: CSP header build + nonce validation primary paths',
    async () => {
      const nonceOk = 'abc123def456ghi789jkl012'; // 24 char base64url (>= 22 required)
      const cspHeader = buildCspHeader({
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", `'nonce-${nonceOk}'`],
        },
      });
      const nonceInHeader = cspHeader.header;

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'buildCspHeader',
            fn: () => {
              buildCspHeader({
                directives: {
                  'default-src': ["'self'"],
                  'script-src': ["'self'", `'nonce-${nonceOk}'`, 'https://cdn.example.com'],
                  'style-src': ["'self'", "'unsafe-inline'"],
                  'connect-src': ["'self'", 'https://api.example.com'],
                  'img-src': ["'self'", 'data:', 'https:'],
                  'font-src': ["'self'", 'https://fonts.example.com'],
                  'frame-ancestors': ["'none'"],
                  'base-uri': ["'self'"],
                  'form-action': ["'self'"],
                },
              });
            },
            serialP95CapMs: 5,
          },
          {
            name: 'validateNonce',
            fn: () => {
              validateNonce(nonceOk);
              // avoid unused warning
              void nonceInHeader;
            },
            serialP95CapMs: 5,
          },
        ],
      });

      // gate 通過を assert (fail-fast)、 baseline seed 時 (initial run) は soft check
      // で reference 生成、 2 回目以降で regression fail-fast。
      expect(result.outcomes.length).toBeGreaterThan(0);
      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      // 個別 assert は soft なので、suite の成否は allPassed で決める。
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
