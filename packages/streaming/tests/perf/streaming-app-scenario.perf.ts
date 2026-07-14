/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createKafkaMock } from '../../src/index.js';

const MODULE = 'streaming-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('streaming app scenario perf (real workload)', () => {
  it('3-layer perf: event pipeline / high-throughput producer / consumer subscribe', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 15,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 3,
      memoryIterations: 15,
      ops: [
        {
          name: 'event_pipeline (producer + 20 send + admin listTopics)',
          fn: async () => {
            const kafka = createKafkaMock();
            const producer = kafka.producer();
            await producer.connect();
            for (let i = 0; i < 20; i++) await producer.send({ topic: 'evt', messages: [{ value: `e-${i}` }] });
            const admin = kafka.admin();
            await admin.connect();
            await admin.listTopics();
            await admin.disconnect();
            await producer.disconnect();
          },
          serialP95CapMs: 100,
        },
        {
          name: 'high_throughput_producer (50 sendBatch record)',
          fn: async () => {
            const kafka = createKafkaMock();
            const producer = kafka.producer();
            await producer.connect();
            const records = Array.from({ length: 50 }, (_, i) => ({ topic: 'ht', messages: [{ value: `m-${i}` }] }));
            await producer.sendBatch(records);
            await producer.disconnect();
          },
          serialP95CapMs: 100,
        },
        {
          name: 'consumer_subscribe_multi_topic (5 topic subscribe)',
          fn: async () => {
            const kafka = createKafkaMock();
            const consumer = kafka.consumer({ groupId: `g-${Math.random()}` });
            await consumer.connect();
            const topics = Array.from({ length: 5 }, (_, i) => `topic-${i}`);
            await consumer.subscribe({ topics });
            await consumer.disconnect();
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
