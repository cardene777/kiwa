/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createStripeMock } from '../../src/index.js';

const MODULE = 'payment-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('payment app scenario perf (real workload)', () => {
  it('3-layer perf: webhook verify cycle / handler dispatch / bulk sign', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'webhook_verify_cycle (10x sign + verify)',
          fn: () => {
            const stripe = createStripeMock({ secret: 'test-secret' });
            for (let i = 0; i < 10; i++) {
              const { rawBody, signature } = stripe.signWebhook({ type: 't', amountCents: i, customerId: 'c' });
              const result = stripe.verifyWebhook({ rawBody, signature });
              if (!result.ok) throw new Error('verify failed');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'handler_dispatch (3 handler + emit 10 events)',
          fn: async () => {
            const stripe = createStripeMock({ secret: 's' });
            let count = 0;
            stripe.onWebhook(() => { count += 1; });
            stripe.onWebhook(() => { count += 1; });
            stripe.onWebhook(() => { count += 1; });
            for (let i = 0; i < 10; i++) {
              const { event } = stripe.signWebhook({ type: `t-${i}`, amountCents: i, customerId: 'c' });
              await stripe.emit(event);
            }
            if (count !== 30) throw new Error(`unexpected handler count: ${count}`);
          },
          serialP95CapMs: 100,
        },
        {
          name: 'bulk_sign (20 signWebhook rapid)',
          fn: () => {
            const stripe = createStripeMock({ secret: 's' });
            for (let i = 0; i < 20; i++) {
              stripe.signWebhook({ type: `t-${i}`, amountCents: i * 100, customerId: 'c' });
            }
          },
          serialP95CapMs: 50,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
