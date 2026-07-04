/**
 * Mock adapter — spins up 1 RedpandaMock (with a colocated SchemaRegistry
 * mock) and wires the 4 dogfood flows (register / evolution / compatibility
 * modes / publish) against it. Every op appends 1 latency sample and 1 trace
 * event so the fidelity harness never reads as 0-sample.
 */

import {
  createRedpandaMock,
  type CompatibilityMode,
  type RedpandaMock,
} from '@kiwa-test/streaming';
import {
  ORDER_V1_SCHEMA_STRING,
  USER_V1_SCHEMA_STRING,
  USER_V2_BREAK_SCHEMA_STRING,
  USER_V2_SCHEMA_STRING,
} from '../schemas/index.js';
import { createProducerRun } from '../producer/index.js';
import { createRegistryRun } from '../registry/index.js';
import type {
  CompatibilityObservation,
  EvolutionObservation,
  PublishObservation,
  RedpandaSchemaRegistryAdapter,
  RegisterObservation,
  TraceEvent,
  UserPayload,
} from './interface.js';

export interface MockAdapterOptions {
  readonly clientId?: string;
}

/**
 * Build the mock adapter. All 3 baseline schemas (User v1 / User v2 /
 * Order v1) live in `src/schemas/*` so the mock and the tests use the same
 * canonical Avro strings.
 */
export function makeMockAdapter(opts: MockAdapterOptions = {}): RedpandaSchemaRegistryAdapter {
  const config = {
    clientId: opts.clientId ?? 'dogfood-redpanda-schema-registry',
  };

  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    subjectsRegistered: 0,
    recordsPublished: 0,
    compatibilityRejections: 0,
    evolutionSteps: 0,
  };

  let redpanda: RedpandaMock | null = null;

  function ensure(): RedpandaMock {
    if (redpanda) return redpanda;
    redpanda = createRedpandaMock({
      clientId: config.clientId,
      schemaRegistry: { defaultCompatibility: 'BACKWARD', subjectNamingStrategy: 'topic-name' },
    });
    return redpanda;
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'REDPANDA_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveRegister(): Promise<RegisterObservation> {
      return timed('driveRegister', async () => {
        const rp = ensure();
        const reg = createRegistryRun(rp.schemaRegistry);
        // Register 3 schemas across 2 topics — verifies subject naming +
        // multi-subject bookkeeping.
        const userV1 = await reg.register({
          topic: 'users',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        const orderV1 = await reg.register({
          topic: 'orders',
          kind: 'avro',
          schema: ORDER_V1_SCHEMA_STRING,
        });
        // Second registration on `users` — same schema, dedup returns same id.
        const userV1Dup = await reg.register({
          topic: 'users',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        const subjects = await reg.registry.listSubjects();
        const observation: RegisterObservation = {
          subjects: [...subjects].sort(),
          registeredIds: [userV1.id, orderV1.id, userV1Dup.id],
          latestVersions: {
            'users-value': userV1.version,
            'orders-value': orderV1.version,
          },
        };
        metricsAgg.subjectsRegistered += subjects.length;
        record('driveRegister', subjects.length === 2 && userV1.id === userV1Dup.id, {
          detail: {
            subjectCount: subjects.length,
            userV1: userV1.id,
            orderV1: orderV1.id,
            dedupHit: userV1.id === userV1Dup.id,
          },
        });
        return observation;
      });
    },

    async driveEvolution(): Promise<EvolutionObservation> {
      return timed('driveEvolution', async () => {
        const rp = ensure();
        const reg = createRegistryRun(rp.schemaRegistry);
        // Step 1: register v1.
        const v1 = await reg.register({
          topic: 'users-evo',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        // Step 2: register v2 (adds an optional `email` field with default null).
        // BACKWARD-compatible — the registry accepts and bumps version.
        const v2 = await reg.register({
          topic: 'users-evo',
          kind: 'avro',
          schema: USER_V2_SCHEMA_STRING,
        });
        // Step 3: try registering the BREAK variant (adds a *required* email
        // field with no default). BACKWARD-incompatible → registry rejects.
        let rejectedIncompatible = false;
        try {
          await reg.register({
            topic: 'users-evo',
            kind: 'avro',
            schema: USER_V2_BREAK_SCHEMA_STRING,
          });
        } catch {
          rejectedIncompatible = true;
        }
        metricsAgg.evolutionSteps += 2;
        const observation: EvolutionObservation = {
          subject: reg.subjectFor('users-evo', 'value'),
          v1Id: v1.id,
          v2Id: v2.id,
          compatibleV2: v2.version === v1.version + 1,
          rejectedIncompatible,
        };
        record(
          'driveEvolution',
          v2.version === v1.version + 1 && rejectedIncompatible,
          {
            detail: {
              subject: observation.subject,
              v1Version: v1.version,
              v2Version: v2.version,
              rejectedIncompatible,
            },
          },
        );
        return observation;
      });
    },

    async driveCompatibilityModes(): Promise<CompatibilityObservation> {
      return timed('driveCompatibilityModes', async () => {
        const rp = ensure();
        const reg = createRegistryRun(rp.schemaRegistry);
        // Prime the subject with v1 so subsequent compat checks have a
        // baseline to compare against.
        await reg.register({
          topic: 'users-compat',
          kind: 'avro',
          schema: USER_V1_SCHEMA_STRING,
        });
        const probes: readonly CompatibilityMode[] = ['BACKWARD', 'FORWARD', 'FULL'];
        const results: {
          readonly subject: string;
          readonly mode: CompatibilityMode;
          readonly compatible: boolean;
          readonly reasons: readonly string[];
        }[] = [];
        for (const mode of probes) {
          // eslint-disable-next-line no-await-in-loop
          await reg.setCompatibility('users-compat', mode);
          // Probe with the BREAK variant (adds required field, no default) —
          // BACKWARD / FORWARD / FULL all reject; NONE would accept but is
          // out of the 3-mode scope.
          const check = reg.checkCompatibility({
            topic: 'users-compat',
            kind: 'avro',
            schema: USER_V2_BREAK_SCHEMA_STRING,
          });
          results.push({
            subject: reg.subjectFor('users-compat', 'value'),
            mode,
            compatible: check.compatible,
            reasons: check.reasons,
          });
        }
        const observation: CompatibilityObservation = { probed: results };
        record('driveCompatibilityModes', results.every((r) => !r.compatible), {
          detail: {
            modes: probes,
            allReject: results.every((r) => !r.compatible),
          },
        });
        return observation;
      });
    },

    async drivePublish(payloads: readonly UserPayload[]): Promise<PublishObservation> {
      return timed('drivePublish', async () => {
        const rp = ensure();
        const admin = rp.admin();
        await admin.connect();
        await admin.createTopics({ topics: [{ topic: 'users-pub', numPartitions: 1 }] });
        await admin.disconnect();
        const producer = createProducerRun({ kafka: rp, registry: rp.schemaRegistry });
        await producer.connect();

        let published = 0;
        for (const payload of payloads) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await producer.publish({
              topic: 'users-pub',
              payload,
              schema: USER_V1_SCHEMA_STRING,
              kind: 'avro',
            });
            published += 1;
          } catch {
            // Producer records the compat rejection internally.
          }
        }

        // Now flip the subject to a required-only schema and try one more
        // publish — the fail-fast path kicks in.
        await rp.schemaRegistry.setCompatibility('users-pub-value', 'BACKWARD');
        try {
          await producer.publish({
            topic: 'users-pub',
            payload: payloads[0] ?? { id: 'x', displayName: 'x', region: 'us' },
            schema: USER_V2_BREAK_SCHEMA_STRING,
            kind: 'avro',
          });
          published += 1;
        } catch {
          // Expected — BACKWARD rejects the required-field addition.
        }

        await producer.disconnect();
        const rejections = producer.compatibilityRejections();
        metricsAgg.recordsPublished += published;
        metricsAgg.compatibilityRejections += rejections.length;
        const observation: PublishObservation = {
          recordsPublished: published,
          rejectedByCompatibility: rejections.length,
        };
        record('drivePublish', published === payloads.length && rejections.length === 1, {
          detail: {
            payloadCount: payloads.length,
            published,
            rejected: rejections.length,
          },
        });
        return observation;
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        record('emitFidelity', true, { detail: { mode: 'mock' } });
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        subjectsRegistered: metricsAgg.subjectsRegistered,
        recordsPublished: metricsAgg.recordsPublished,
        compatibilityRejections: metricsAgg.compatibilityRejections,
        evolutionSteps: metricsAgg.evolutionSteps,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.subjectsRegistered = 0;
      metricsAgg.recordsPublished = 0;
      metricsAgg.compatibilityRejections = 0;
      metricsAgg.evolutionSteps = 0;
      if (redpanda) redpanda.reset();
      redpanda = null;
    },
  };
}

export function sampleUserPayload(overrides: Partial<UserPayload> = {}): UserPayload {
  return {
    id: 'u-1',
    displayName: 'Alice',
    region: 'us',
    ...overrides,
  };
}
