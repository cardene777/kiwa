import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createWebhookVerifier,
  verifyWebhookSignature,
  parseWebhookPayload,
} from '../../src/index.js';
import { createHmac } from 'node:crypto';

const MODULE = 'webhook';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: verify + signature + parse primary paths',
    async () => {
      const secret = 'whsec_test';
      const payload = JSON.stringify({ type: 'payment_intent.succeeded', id: 'evt_1', created: 1, data: { object: { id: 'pi_1' } } });
      const signature = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
      const verifier = createWebhookVerifier({ provider: 'github', secret });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'verifyIncoming',
            serialP95CapMs: 5,
            fn: async () => {
              verifier.verify({ payload, signature });
            },
          },
          {
            name: 'verifyWebhookSignature',
            serialP95CapMs: 5,
            fn: async () => {
              verifyWebhookSignature(payload, signature, secret, 'github');
            },
          },
          {
            name: 'parseWebhookPayload',
            serialP95CapMs: 5,
            fn: async () => {
              parseWebhookPayload({ provider: 'stripe', raw: { type: 'payment_intent.succeeded', id: 'evt_1', created: 1, data: { object: { id: 'pi_1' } } } });
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
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms',
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
    'allocation baseline: 小 object 100 回生成の max latency < 5ms',
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
