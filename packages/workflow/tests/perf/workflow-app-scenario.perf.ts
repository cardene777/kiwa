/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createWorkflowClient,
  defineWorkflow,
  retryStep,
  eventDrivenTrigger,
  emitEvent,
} from '../../src/index.js';

const MODULE = 'workflow-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('workflow app scenario perf (real workload)', () => {
  it('3-layer perf: multi_step_workflow / event_trigger_batch / retry_error_handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'multi_step_workflow (10 execute across 4 providers, 3-step order-fulfillment)',
          fn: async () => {
            const providers = ['temporal', 'inngest', 'trigger', 'aws-sfn'] as const;
            for (let i = 0; i < 10; i++) {
              const client = createWorkflowClient({ provider: providers[i % 4] });
              const wf = defineWorkflow('order-fulfillment', [
                { name: 'validate', run: (ctx) => ({ orderId: ctx.input.orderId, validated: true }) },
                { name: 'charge', run: (ctx) => ({ ...ctx.previous, chargeId: `ch-${i}` }) },
                { name: 'notify', run: (ctx) => ({ ...ctx.previous, notified: true }) },
              ]);
              client.register(wf);
              await client.execute('order-fulfillment', { orderId: `o-${i}` });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'event_trigger_batch (5 event emits with 2 registered workflows each)',
          fn: async () => {
            const client = createWorkflowClient({ provider: 'inngest' });
            const wfA = defineWorkflow('sendWelcome', [{ name: 'send', run: () => ({ sent: true }) }]);
            const wfB = defineWorkflow('grantCredits', [{ name: 'grant', run: () => ({ credits: 100 }) }]);
            eventDrivenTrigger(client, 'user.signup', wfA);
            eventDrivenTrigger(client, 'user.signup', wfB);
            for (let i = 0; i < 5; i++) {
              await emitEvent(client, { name: 'user.signup', payload: { userId: `u-${i}` }, emittedAt: i });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'retry_error_handling (5 fail-then-succeed with backoff)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              let attempts = 0;
              await retryStep(
                async () => {
                  attempts += 1;
                  if (attempts < 3) throw new Error('transient');
                  return { ok: true };
                },
                { maxAttempts: 3, baseDelayMs: 1, sleep: async () => { /* no sleep in perf */ } },
              );
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'retry_recovery (5 flaky async retry to success)',
          fn: async () => {
            const mod = await import('../../src/index.js');
            const wr = mod.withRetry;
            let ctr = 0;
            const wrapped = wr(async () => {
              ctr += 1;
              if (ctr % 3 !== 0) throw new Error('flake');
              return 'ok';
            }, { maxAttempts: 3 });
            for (let i = 0; i < 5; i += 1) {
              await wrapped().catch(() => null);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'concurrent_batch (5 batches of 4 items with error isolation)',
          fn: async () => {
            const mod = await import('../../src/index.js');
            const bo = mod.batchOperate;
            for (let i = 0; i < 5; i += 1) {
              await bo(
                [{ name: 'a', input: 1 }, { name: 'b', input: 2 }, { name: 'c', input: 3 }, { name: 'd', input: 4 }],
                async (item) => (item.input as number) * 2,
              );
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
