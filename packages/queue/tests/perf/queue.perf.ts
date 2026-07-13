import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  setupBullMQEnv,
  setupCloudflareQueuesEnv,
  setupInngestEnv,
  setupRabbitMQEnv,
  setupSQSEnv,
} from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'queue';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/saas', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: 5 provider (BullMQ / Inngest / Cloudflare Queues / SQS / RabbitMQ) primary paths',
    async () => {
      const bullmq = await setupBullMQEnv({ queueName: 'perf-queue' });
      const inngest = await setupInngestEnv({ appId: 'perf-app' });
      const cfq = await setupCloudflareQueuesEnv({ queues: ['perf-queue'] });
      const sqs = await setupSQSEnv({ queues: [{ name: 'perf-queue' }] });
      const rabbit = await setupRabbitMQEnv();

      try {
        const result = await runPerf3Layer({
          moduleName: MODULE,
          reportPath: REPORT_PATH,
          baselinePath: BASELINE_PATH,
          ops: [
            {
              // BullMQ sandbox — queueName accessor + backend probe.
              // Real prod path = Redis connection + BullMQ Queue instantiation.
              // sandbox mock exercises the same env shape without I/O.
              name: 'bullmqEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (bullmq.queueName !== 'perf-queue') throw new Error('queueName drift');
              },
            },
            {
              // Inngest stub — appId accessor + backend probe.
              name: 'inngestEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (inngest.appId !== 'perf-app') throw new Error('appId drift');
              },
            },
            {
              // Cloudflare Queues miniflare — queue list accessor.
              name: 'cloudflareQueuesEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (!cfq.queues.includes('perf-queue')) throw new Error('queue missing');
              },
            },
            {
              // SQS stub — queue list accessor.
              name: 'sqsEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (!sqs.queues.includes('perf-queue')) throw new Error('queue missing');
              },
            },
            {
              // RabbitMQ stub — backend accessor.
              name: 'rabbitmqEnvAccessor',
              serialP95CapMs: 5,
              fn: () => {
                if (rabbit.backend !== 'stub') throw new Error('backend drift');
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
      } finally {
        await Promise.all([
          bullmq.stop(),
          inngest.stop(),
          cfq.stop(),
          sqs.stop(),
          rabbit.stop(),
        ]);
      }
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
