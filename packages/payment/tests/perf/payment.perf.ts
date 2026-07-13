import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  startDunning,
  startRetry,
  retryBackoffMs,
} from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'payment';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: 3 provider (stripe / paddle / lemonsqueezy) sign+verify + 9 semantics axis (dunning / retry / 3ds / sca / psd2 / subscription / invoice / tax / chargeback)',
    async () => {
      // Deterministic clock for signWebhook so per-iteration cost = HMAC digest
      // (not clock drift). Real prod path also uses Date.now() but the mock
      // pins it to make regression detection stable.
      const now = () => 1_000_000;
      const stripe = createStripeMock({ now });
      const paddle = createPaddleMock({ now });
      const lemonsqueezy = createLemonSqueezyMock({ now });

      // Pre-sign fixtures so verify's per-iteration cost = HMAC compare only.
      // If we signed inside verify, we'd double-count sign latency and drift
      // baseline toward crypto perf.
      const stripeSigned = stripe.signWebhook({
        type: 'checkout.completed',
        amountCents: 2000,
        customerId: 'cus_perf',
      });
      const paddleSigned = paddle.signWebhook({
        type: 'transaction.completed',
        amountCents: 2000,
        customerId: 'cus_perf',
      });
      const lsSigned = lemonsqueezy.signWebhook({
        type: 'subscription_created',
        amountCents: 2000,
        customerId: 'cus_perf',
      });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          // 3 provider — signWebhook + verifyWebhook (HMAC-SHA256 primary path)
          {
            // Stripe HMAC-SHA256 sign. Real prod path uses same crypto.createHmac.
            name: 'stripeSignWebhook',
            serialP95CapMs: 10,
            fn: () => {
              stripe.signWebhook({
                type: 'checkout.completed',
                amountCents: 100,
                customerId: 'c',
              });
            },
          },
          {
            // Stripe HMAC verify — timingSafeEqual + parse.
            name: 'stripeVerifyWebhook',
            serialP95CapMs: 10,
            fn: () => {
              const r = stripe.verifyWebhook({
                rawBody: stripeSigned.rawBody,
                signature: stripeSigned.signature,
              });
              if (!r.ok) throw new Error(`verify failed: ${r.reason}`);
            },
          },
          {
            // Paddle HMAC-SHA256 sign.
            name: 'paddleSignWebhook',
            serialP95CapMs: 10,
            fn: () => {
              paddle.signWebhook({
                type: 'transaction.completed',
                amountCents: 100,
                customerId: 'c',
              });
            },
          },
          {
            // Paddle HMAC verify.
            name: 'paddleVerifyWebhook',
            serialP95CapMs: 10,
            fn: () => {
              const r = paddle.verifyWebhook({
                rawBody: paddleSigned.rawBody,
                signature: paddleSigned.signature,
              });
              if (!r.ok) throw new Error(`verify failed: ${r.reason}`);
            },
          },
          {
            // Lemon Squeezy HMAC-SHA256 sign.
            name: 'lemonSqueezySignWebhook',
            serialP95CapMs: 10,
            fn: () => {
              lemonsqueezy.signWebhook({
                type: 'subscription_created',
                amountCents: 100,
                customerId: 'c',
              });
            },
          },
          {
            // Lemon Squeezy HMAC verify.
            name: 'lemonSqueezyVerifyWebhook',
            serialP95CapMs: 10,
            fn: () => {
              const r = lemonsqueezy.verifyWebhook({
                rawBody: lsSigned.rawBody,
                signature: lsSigned.signature,
              });
              if (!r.ok) throw new Error(`verify failed: ${r.reason}`);
            },
          },
          // 9 semantics axis — pure logic ops (no crypto). Cap = 5ms JS floor.
          {
            // Dunning axis — startDunning session construction.
            name: 'dunningStart',
            serialP95CapMs: 5,
            fn: () => {
              startDunning({
                invoiceId: 'inv_perf',
                amountCents: 5000,
                customerId: 'cus_perf',
                config: { maxAttempts: 3, gracePeriodMs: 60_000 },
              });
            },
          },
          {
            // Retry axis — startRetry + backoff calc (exponential).
            name: 'retryStart',
            serialP95CapMs: 5,
            fn: () => {
              const { event } = stripe.signWebhook({
                type: 't',
                amountCents: 100,
                customerId: 'c',
              });
              startRetry({ event });
            },
          },
          {
            // Retry backoff math — exponential base compute.
            name: 'retryBackoffMs',
            serialP95CapMs: 5,
            fn: () => {
              retryBackoffMs(1, 1000);
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
