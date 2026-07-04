/**
 * Mock adapter — spins up 1 NatsMock and wires the 4 dogfood flows
 * (JetStream / KV / Object / Routing) against it. Every op appends 1
 * latency sample and 1 trace event so the fidelity harness never reads
 * as 0-sample.
 */

import { createNatsMock, type NatsMock } from '@kiwa-test/streaming';
import { createJetStreamRun, simulateRedelivery } from '../jetstream/index.js';
import { createKVRun } from '../kv/index.js';
import { createObjectRun } from '../object/index.js';
import { createRoutingRun } from '../routing/index.js';
import type {
  JetStreamObservation,
  KVObservation,
  NatsJetStreamAdapter,
  ObjectObservation,
  OrderEvent,
  RoutingObservation,
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

/** Build the mock adapter. All 4 flow runs share one NATS mock instance. */
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
        // Fetch + ack a subset — leave 1 message un-acked so we can
        // observe redelivery-on-restart behaviour.
        const consumer = await js.consumer(ORDERS_STREAM, {
          durable: 'orders-worker',
          filterSubject: 'orders.>',
        });
        const firstBatch = await consumer.fetch(events.length);
        // Ack every message except the last one.
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
        // Update the first profile to bump the revision counter.
        const first = profiles[0];
        if (first) {
          const bumped = await kv.put(first.userId, { ...first, region: `${first.region}-v2` });
          if (bumped.kind === 'updated') updates += 1;
        }
        // Delete the last profile to exercise the delete path.
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
        // 3 objects of increasing size — the smallest exercises single-
        // chunk write, the largest exercises multi-chunk classification.
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
        // Delete #2 to exercise the delete + list path.
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
        // Queue group with 3 members on a distinct `workers.jobs` subject
        // so it does not overlap with `events.*` / `events.>`. Publishing
        // 6 messages should share deliveries 2 apiece across the
        // round-robin cursor.
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

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        jetstreamPublished: metricsAgg.jetstreamPublished,
        jetstreamAcked: metricsAgg.jetstreamAcked,
        kvOperations: metricsAgg.kvOperations,
        objectBytesStored: metricsAgg.objectBytesStored,
        routingDeliveries: metricsAgg.routingDeliveries,
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
