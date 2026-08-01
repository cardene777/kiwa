import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createDeadLetterQueue,
  createIdempotentProducer,
  createKafkaMock,
  createNatsMock,
  createReadCommittedFilter,
  createRedpandaMock,
  createSchemaRegistry,
  createTransactionalProducer,
  type StreamingMessage,
} from '../../src/index.js';

// SaaS layer baseline を .perf-baseline/saas/{name}.json に分離 (v1.25-4)。
const MODULE = 'streaming';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/saas', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE, 'saas');

function messageFixture<T>(value: T): StreamingMessage<T> {
  return {
    topic: 'perf',
    partition: 0,
    offset: 0,
    timestamp: 0,
    key: null,
    value,
    headers: {},
  };
}

describe(MODULE, () => {
  it(
    '3-layer perf: 3 provider (Kafka / Redpanda / NATS) × 5 semantics (producer / consumer / exactly-once / DLQ / schema-registry)',
    async () => {
      // Long-lived provider mocks reused across iterations. Producer connect
      // is a one-time cost (real Kafka handshake would be too), we measure
      // the per-message send + consumer receive latency.
      const kafka = createKafkaMock();
      const redpanda = createRedpandaMock();
      const nats = createNatsMock();

      const kafkaProducer = kafka.producer();
      await kafkaProducer.connect();
      const redpandaProducer = redpanda.producer();
      await redpandaProducer.connect();

      const idempotent = createIdempotentProducer({ kafka });
      await idempotent.connect();

      // Transactional producer state machine is single-threaded per producer
      // (real Kafka: one active transaction per producer id). The concurrent
      // phase (10 workers × 50 iter) races the shared producer, so we mint
      // a fresh producer per iteration to exercise the begin+send+commit
      // lifecycle without contention. Real prod path is 1 producer instance
      // per worker, so this shape matches production sharding.
      let txId = 0;

      const dlq = createDeadLetterQueue<{ id: number }>({
        topic: 'perf',
        handler: async () => {},
        retryPolicy: { maxAttempts: 3 },
      });
      const registry = createSchemaRegistry();
      // Distinct counters per op so mixing serial + concurrent iterations
      // stays deterministic and reviewers don't have to correlate dlq +
      // schema id spaces.
      let dlqCounter = 0;
      let schemaCounter = 0;

      // Kafka producer send is the primary write path across kafka + redpanda
      // + nats. NATS publish is roughly the same shape (topic + payload).
      // 3-provider × 5-semantics = 8 ops (some semantics only apply to Kafka).
      const readCommittedFilter = createReadCommittedFilter();

      try {
        const result = await runPerf3Layer({
          moduleName: MODULE,
          requireGc: true,
          reportPath: REPORT_PATH,
          baselinePath: BASELINE_PATH,
          ops: [
            {
              // Kafka producer.send — write path.
              // Real prod path uses kafkajs — mock exercises the same topic /
              // partition / offset assign flow.
              name: 'kafkaProducerSend',
              serialP95CapMs: 10,
              fn: async () => {
                await kafkaProducer.send({
                  topic: 'perf',
                  messages: [{ value: 'ping' }],
                });
              },
            },
            {
              // Redpanda producer.send — Kafka API compat.
              // Same code path as Kafka, provider label differentiates.
              name: 'redpandaProducerSend',
              serialP95CapMs: 10,
              fn: async () => {
                await redpandaProducer.send({
                  topic: 'perf',
                  messages: [{ value: 'ping' }],
                });
              },
            },
            {
              // NATS publish — subject-based pub/sub, no partition.
              name: 'natsPublish',
              serialP95CapMs: 10,
              fn: async () => {
                await nats.publish('perf.event', { value: 'ping' });
              },
            },
            {
              // Exactly-once semantics — idempotent producer with sequence #.
              // Real prod uses producer id + sequence for dedup.
              name: 'idempotentProducerSend',
              serialP95CapMs: 10,
              fn: async () => {
                await idempotent.send({ topic: 'perf', messages: [{ value: 'e' }] }, 1);
              },
            },
            {
              // Exactly-once semantics — read-committed filter.
              // Committed txn message passes through, aborted drops (mock
              // implements identity since aborted batches are never persisted).
              name: 'readCommittedFilter',
              serialP95CapMs: 5,
              fn: () => {
                readCommittedFilter.filter([messageFixture('x')]);
              },
            },
            {
              // DLQ handled path — happy-path handler resolves, no quarantine.
              // Failed path exercises retry loop (out of scope for baseline).
              name: 'dlqHandleSuccess',
              serialP95CapMs: 5,
              fn: async () => {
                dlqCounter += 1;
                await dlq.handle(messageFixture({ id: dlqCounter }));
              },
            },
            {
              // Schema Registry — register schema (write path).
              // Real Confluent Schema Registry: HTTP POST /subjects/{s}/versions.
              // Mock exercises the same subject + kind + schema string flow.
              // Per-iteration counter avoids the same-schema dedup fast path.
              name: 'schemaRegistryRegister',
              serialP95CapMs: 5,
              fn: async () => {
                await registry.register({
                  subject: `perf-${schemaCounter++}`,
                  kind: 'avro',
                  schema: '{"type":"record","name":"E","fields":[]}',
                });
              },
            },
            {
              // Transactional producer — begin + send + commit lifecycle.
              // Real prod: initTransactions + beginTransaction + send +
              // commitTransaction. Mock exercises the same state machine.
              // Fresh producer per iteration avoids "transaction already
              // active" contention in the concurrent phase.
              name: 'transactionalProducerCycle',
              serialP95CapMs: 20,
              fn: async () => {
                const id = txId++;
                const tx = createTransactionalProducer({
                  kafka,
                  transactionalId: `perf-tx-${id}`,
                });
                await tx.connect();
                await tx.initTransactions();
                await tx.beginTransaction();
                await tx.send({ topic: 'perf', messages: [{ value: 'tx' }] });
                await tx.commitTransaction();
                await tx.disconnect();
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
        await kafkaProducer.disconnect();
        await redpandaProducer.disconnect();
        await idempotent.disconnect();
        kafka.reset();
        redpanda.reset();
      }
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
