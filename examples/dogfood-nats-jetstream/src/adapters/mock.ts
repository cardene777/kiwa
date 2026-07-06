/**
 * Mock adapter — spins up 1 NatsMock and wires the 9 dogfood flows (5 v1
 * + 4 v2) against it. Every op appends 1 latency sample and 1 trace event
 * so the fidelity harness never reads as 0-sample.
 *
 * v2 (v1.31-4) adds a durable-consumer walk + KV revision history + Object
 * Store chunk boundary + testcontainers probe placeholders. The durable
 * consumer + KV revision + Object chunking flows are backed by the shared
 * streaming v0.3 semantics (`createNatsJetStreamDurable` +
 * `createNatsKvObject`) rather than the base NatsMock's JetStream / KV /
 * Object surfaces — those cover the coarse-grained v1 patterns, the v0.3
 * semantics cover the fine-grained retry / revision / chunk behaviour the
 * v2 axes assert against.
 */

import { createNatsMock, type NatsMock } from '@kiwa-test/streaming';
import { createJetStreamRun, simulateRedelivery } from '../jetstream/index.js';
import { driveDurableConsumer } from '../jetstream/durable.js';
import { createKVRun } from '../kv/index.js';
import { driveKvRevision as driveKvRevisionFlow } from '../kv/revision.js';
import { createObjectRun } from '../object/index.js';
import { driveObjectChunking as driveObjectChunkingFlow } from '../object/chunking.js';
import { createRoutingRun } from '../routing/index.js';
import type {
  JetStreamDurableObservation,
  JetStreamObservation,
  KvRevisionObservation,
  KVObservation,
  NatsJetStreamAdapter,
  ObjectChunkingObservation,
  ObjectObservation,
  OrderEvent,
  RoutingObservation,
  TestcontainersProbeObservation,
  TraceEvent,
  UserProfile,
} from './interface.js';

export interface MockAdapterOptions {
  readonly clientName?: string;
}

const ORDERS_STREAM = 'ORDERS';
const ORDERS_SUBJECTS = ['orders.>'];
const KV_BUCKET = 'user-profiles';
const OBJECT_BUCKET = 'invoices';

/** Deterministic mock endpoints exposed by `driveTestcontainersProbe`. */
export const MOCK_NATS_URL = 'nats://nats-mock:4222';
export const NATS_IMAGE_DEFAULT = 'nats:2.10.20-alpine';

/** Build the mock adapter. All 4 v1 flow runs share one NATS mock instance. */
export function makeMockAdapter(opts: MockAdapterOptions = {}): NatsJetStreamAdapter {
  const config = {
    clientName: opts.clientName ?? 'dogfood-nats-jetstream',
  };

  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    jetstreamPublished: 0,
    jetstreamAcked: 0,
    kvOperations: 0,
    objectBytesStored: 0,
    routingDeliveries: 0,
    durableDeliveries: 0,
    durableQuarantined: 0,
    kvRevisionsWritten: 0,
    objectChunksWritten: 0,
    testcontainersProbes: 0,
  };

  let nats: NatsMock | null = null;

  function ensure(): NatsMock {
    if (nats) return nats;
    nats = createNatsMock({ name: config.clientName, servers: ['nats://mock:4222'] });
    return nats;
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
        errorKind: 'NATS_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveJetStream(events: readonly OrderEvent[]): Promise<JetStreamObservation> {
      return timed('driveJetStream', async () => {
        const client = ensure();
        const js = createJetStreamRun({ nats: client });
        await js.addStream({
          name: ORDERS_STREAM,
          subjects: ORDERS_SUBJECTS,
          retention: 'limits',
        });
        const publishedSeqs: number[] = [];
        for (const event of events) {
          // eslint-disable-next-line no-await-in-loop
          const ack = await js.publish(`orders.${event.currency.toLowerCase()}`, event);
          publishedSeqs.push(ack.seq);
        }
        const consumer = await js.consumer(ORDERS_STREAM, {
          durable: 'orders-worker',
          filterSubject: 'orders.>',
        });
        const firstBatch = await consumer.fetch(events.length);
        for (let i = 0; i < firstBatch.length - 1; i += 1) {
          const msg = firstBatch[i];
          if (msg) consumer.ack(msg);
        }
        const redelivered = await simulateRedelivery({
          nats: client,
          streamName: ORDERS_STREAM,
          durable: 'orders-worker',
          filterSubject: 'orders.>',
          batchSize: events.length,
          onRedelivered: () => undefined,
        });
        metricsAgg.jetstreamPublished += publishedSeqs.length;
        metricsAgg.jetstreamAcked += js.ackedCount();
        const observation: JetStreamObservation = {
          stream: ORDERS_STREAM,
          publishedSeqs,
          consumedCount: firstBatch.length,
          ackedCount: js.ackedCount(),
          redeliveredCount: redelivered.length,
          filterSubject: 'orders.>',
        };
        record(
          'driveJetStream',
          publishedSeqs.length === events.length &&
            observation.ackedCount === events.length - 1 &&
            observation.redeliveredCount === events.length,
          {
            detail: {
              stream: ORDERS_STREAM,
              published: publishedSeqs.length,
              consumed: firstBatch.length,
              acked: observation.ackedCount,
              redelivered: observation.redeliveredCount,
            },
          },
        );
        return observation;
      });
    },

    async driveKV(profiles: readonly UserProfile[]): Promise<KVObservation> {
      return timed('driveKV', async () => {
        const client = ensure();
        const kv = createKVRun({ nats: client, bucket: KV_BUCKET });
        let puts = 0;
        let updates = 0;
        for (const profile of profiles) {
          // eslint-disable-next-line no-await-in-loop
          const result = await kv.put(profile.userId, profile);
          if (result.kind === 'created') puts += 1;
          else updates += 1;
        }
        const first = profiles[0];
        if (first) {
          const bumped = await kv.put(first.userId, { ...first, region: `${first.region}-v2` });
          if (bumped.kind === 'updated') updates += 1;
        }
        const last = profiles[profiles.length - 1];
        if (last && profiles.length > 1) await kv.delete(last.userId);
        const finalKeys = await kv.keys();
        metricsAgg.kvOperations += puts + updates + kv.deletesCount();
        const observation: KVObservation = {
          bucket: KV_BUCKET,
          puts,
          updates,
          deletes: kv.deletesCount(),
          lastRevision: kv.lastRevision(),
          finalKeys: [...finalKeys].sort(),
        };
        record(
          'driveKV',
          observation.puts === profiles.length &&
            observation.updates >= 1 &&
            (profiles.length <= 1 || observation.deletes === 1) &&
            observation.lastRevision >= profiles.length + 1,
          {
            detail: {
              bucket: KV_BUCKET,
              puts,
              updates,
              deletes: observation.deletes,
              lastRevision: observation.lastRevision,
            },
          },
        );
        return observation;
      });
    },

    async driveObject(): Promise<ObjectObservation> {
      return timed('driveObject', async () => {
        const client = ensure();
        const obj = createObjectRun({ nats: client, bucket: OBJECT_BUCKET });
        const put1 = await obj.put({
          name: 'invoice-1.pdf',
          data: 'small-invoice-body',
          chunkSize: 32,
        });
        const put2 = await obj.put({
          name: 'invoice-2.pdf',
          data: 'medium-invoice-body-with-more-payload',
          chunkSize: 16,
        });
        const bigBytes = new Uint8Array(1024);
        for (let i = 0; i < bigBytes.length; i += 1) bigBytes[i] = i % 251;
        const put3 = await obj.put({
          name: 'invoice-3.bin',
          data: bigBytes,
          chunkSize: 128,
        });
        await obj.delete('invoice-2.pdf');
        const listing = await obj.list();
        metricsAgg.objectBytesStored += obj.totalBytesStored();
        const observation: ObjectObservation = {
          bucket: OBJECT_BUCKET,
          objectsPut: 3,
          totalBytesStored: obj.totalBytesStored(),
          digests: [put1.info.digest, put2.info.digest, put3.info.digest],
          deletedNames: ['invoice-2.pdf'],
        };
        record(
          'driveObject',
          listing.length === 2 && new Set(observation.digests).size === 3,
          {
            detail: {
              bucket: OBJECT_BUCKET,
              objectsPut: observation.objectsPut,
              listingCount: listing.length,
              digestsUnique: new Set(observation.digests).size,
            },
          },
        );
        return observation;
      });
    },

    async driveRouting(): Promise<RoutingObservation> {
      return timed('driveRouting', async () => {
        const client = ensure();
        const routing = createRoutingRun({ nats: client });
        let literal = 0;
        let wildcard = 0;
        let catchAll = 0;
        let queue = 0;
        routing.subscribe({
          label: 'literal',
          subject: 'events.audit',
          handler: async () => {
            literal += 1;
          },
        });
        routing.subscribe({
          label: 'wildcard',
          subject: 'events.*',
          handler: async () => {
            wildcard += 1;
          },
        });
        routing.subscribe({
          label: 'catchall',
          subject: 'events.>',
          handler: async () => {
            catchAll += 1;
          },
        });
        for (const idx of [0, 1, 2]) {
          routing.subscribe({
            label: `queue-${idx}`,
            subject: 'workers.jobs',
            queue: 'workers',
            handler: async () => {
              queue += 1;
            },
          });
        }
        await routing.publish('events.audit', { at: 1, type: 'signin' });
        await routing.publish('events.signup', { at: 2, type: 'signup' });
        await routing.publish('events.audit.write', { at: 3, type: 'write' });
        for (let i = 0; i < 6; i += 1) {
          // eslint-disable-next-line no-await-in-loop
          await routing.publish('workers.jobs', { id: i });
        }
        const observation: RoutingObservation = {
          literalDeliveries: literal,
          wildcardDeliveries: wildcard,
          catchAllDeliveries: catchAll,
          queueGroupDeliveries: queue,
          queueGroupSize: routing.queueGroupSizes()['workers.jobs::workers'] ?? 0,
        };
        metricsAgg.routingDeliveries +=
          observation.literalDeliveries +
          observation.wildcardDeliveries +
          observation.catchAllDeliveries +
          observation.queueGroupDeliveries;
        record(
          'driveRouting',
          observation.literalDeliveries === 1 &&
            observation.wildcardDeliveries === 2 &&
            observation.catchAllDeliveries === 3 &&
            observation.queueGroupDeliveries === 6 &&
            observation.queueGroupSize === 3,
          {
            detail: {
              literal: observation.literalDeliveries,
              wildcard: observation.wildcardDeliveries,
              catchAll: observation.catchAllDeliveries,
              queue: observation.queueGroupDeliveries,
              queueSize: observation.queueGroupSize,
            },
          },
        );
        return observation;
      });
    },

    async emitFidelity(): Promise<void> {
      return timed('emitFidelity', async () => {
        record('emitFidelity', true, { detail: { mode: 'mock' } });
      });
    },

    // -------------------------------------------------------------------------
    // v2 ops — durable consumer + KV revision + Object chunking + testcontainers
    // probe.
    // -------------------------------------------------------------------------

    async driveJetStreamDurable(): Promise<JetStreamDurableObservation> {
      return timed('driveJetStreamDurable', async () => {
        const result = driveDurableConsumer();
        metricsAgg.durableDeliveries += result.deliveries;
        metricsAgg.durableQuarantined += result.quarantined;
        const observation: JetStreamDurableObservation = {
          durableName: result.durable.config.durableName,
          published: result.published,
          deliveries: result.deliveries,
          acked: result.acked,
          backoffRedeliveries: result.backoffRedeliveries,
          ackWaitSweeps: result.ackWaitSweeps,
          quarantined: result.quarantined,
          ackFloor: result.ackFloor,
          backoffScheduleMs: result.backoffScheduleMs,
        };
        record(
          'driveJetStreamDurable',
          observation.published === 4 &&
            observation.deliveries >= observation.published &&
            observation.backoffRedeliveries >= 1 &&
            observation.quarantined >= 1,
          {
            detail: {
              durable: observation.durableName,
              published: observation.published,
              deliveries: observation.deliveries,
              acked: observation.acked,
              backoffRedeliveries: observation.backoffRedeliveries,
              ackWaitSweeps: observation.ackWaitSweeps,
              quarantined: observation.quarantined,
            },
          },
        );
        return observation;
      });
    },

    async driveKvRevision(): Promise<KvRevisionObservation> {
      return timed('driveKvRevision', async () => {
        const result = await driveKvRevisionFlow();
        metricsAgg.kvRevisionsWritten += result.revisions.length;
        const observation: KvRevisionObservation = {
          bucket: result.bucket,
          key: result.key,
          historyDepth: result.historyDepth,
          revisions: result.revisions,
          deleteTombstoneObserved: result.deleteTombstoneObserved,
          watchEventCount: result.watchEventCount,
        };
        record(
          'driveKvRevision',
          observation.revisions.length === 5 &&
            observation.deleteTombstoneObserved &&
            observation.watchEventCount === observation.revisions.length,
          {
            detail: {
              bucket: observation.bucket,
              revisions: observation.revisions.length,
              tombstone: observation.deleteTombstoneObserved,
              watchEventCount: observation.watchEventCount,
            },
          },
        );
        return observation;
      });
    },

    async driveObjectChunking(): Promise<ObjectChunkingObservation> {
      return timed('driveObjectChunking', async () => {
        const result = driveObjectChunkingFlow();
        metricsAgg.objectChunksWritten += result.record.chunks.length;
        const observation: ObjectChunkingObservation = {
          bucket: result.bucket,
          name: result.name,
          chunkSizeBytes: result.chunkSizeBytes,
          originalSize: result.originalSize,
          chunkCount: result.record.chunks.length,
          chunkDigests: result.chunkDigests,
          compression: result.compression,
          reassembledMatches: result.reassembledMatches,
        };
        record(
          'driveObjectChunking',
          observation.chunkCount >= 4 &&
            observation.reassembledMatches &&
            observation.compression === 'lz4',
          {
            detail: {
              bucket: observation.bucket,
              chunkCount: observation.chunkCount,
              compression: observation.compression,
              reassembledMatches: observation.reassembledMatches,
            },
          },
        );
        return observation;
      });
    },

    async driveTestcontainersProbe(): Promise<TestcontainersProbeObservation> {
      return timed('driveTestcontainersProbe', async () => {
        metricsAgg.testcontainersProbes += 1;
        const observation: TestcontainersProbeObservation = {
          natsUrl: MOCK_NATS_URL,
          natsImage: NATS_IMAGE_DEFAULT,
          reachable: true,
        };
        record('driveTestcontainersProbe', true, {
          detail: {
            natsUrl: observation.natsUrl,
            natsImage: observation.natsImage,
            reachable: observation.reachable,
          },
        });
        return observation;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        jetstreamPublished: metricsAgg.jetstreamPublished,
        jetstreamAcked: metricsAgg.jetstreamAcked,
        kvOperations: metricsAgg.kvOperations,
        objectBytesStored: metricsAgg.objectBytesStored,
        routingDeliveries: metricsAgg.routingDeliveries,
        durableDeliveries: metricsAgg.durableDeliveries,
        durableQuarantined: metricsAgg.durableQuarantined,
        kvRevisionsWritten: metricsAgg.kvRevisionsWritten,
        objectChunksWritten: metricsAgg.objectChunksWritten,
        testcontainersProbes: metricsAgg.testcontainersProbes,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.jetstreamPublished = 0;
      metricsAgg.jetstreamAcked = 0;
      metricsAgg.kvOperations = 0;
      metricsAgg.objectBytesStored = 0;
      metricsAgg.routingDeliveries = 0;
      metricsAgg.durableDeliveries = 0;
      metricsAgg.durableQuarantined = 0;
      metricsAgg.kvRevisionsWritten = 0;
      metricsAgg.objectChunksWritten = 0;
      metricsAgg.testcontainersProbes = 0;
      if (nats) nats.reset();
      nats = null;
    },
  };
}

export function sampleOrderEvent(overrides: Partial<OrderEvent> = {}): OrderEvent {
  return {
    orderId: 'o-1',
    userId: 'u-1',
    total: 100,
    currency: 'USD',
    ...overrides,
  };
}

export function sampleUserProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: 'u-1',
    displayName: 'Alice',
    region: 'us',
    ...overrides,
  };
}
