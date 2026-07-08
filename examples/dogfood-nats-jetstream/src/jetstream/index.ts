/**
 * JetStream flow — persistent stream + durable consumer + ack + redelivery.
 *
 * Wraps `@kiwa/streaming`'s NATS mock JetStream store. The dogfood
 * models the 4 building blocks a real nats.js JetStream client exposes:
 *
 * 1. Stream declaration — one stream owns 1+ subjects with a retention
 *    policy (default `limits`).
 * 2. Publish — every publish returns a monotonically increasing seq
 *    within the stream.
 * 3. Durable consumer — pulls messages in batches; per-consumer bookkeeping
 *    tracks delivered / ack floor. A durable consumer survives across
 *    `fetch` cycles because state is stored on the stream side.
 * 4. Ack + redelivery — un-acked messages remain "delivered but pending";
 *    the flow re-fetches them via a fresh consumer to simulate the
 *    redelivery-on-restart path.
 */

import type {
  JetStreamConfig,
  JetStreamConsumer,
  JetStreamPublishAck,
  JetStreamStore,
  NatsMock,
  StreamingMessage,
} from '@kiwa/streaming';

export interface JetStreamRun {
  readonly addStream: (config: JetStreamConfig) => Promise<void>;
  readonly publish: <T>(subject: string, data: T) => Promise<JetStreamPublishAck>;
  readonly consumer: (
    streamName: string,
    input: { readonly durable: string; readonly filterSubject?: string },
  ) => Promise<JetStreamConsumer>;
  readonly listStreams: () => readonly string[];
  readonly getStreamMessages: (streamName: string) => readonly StreamingMessage[];
  readonly ackedCount: () => number;
  readonly resetCounters: () => void;
}

export interface CreateJetStreamRunInput {
  readonly nats: NatsMock;
}

/**
 * Build the JetStream run bound to a NATS mock. The run keeps two counters
 * — ack + redelivery — so the adapter's observations can assert against
 * them without introspecting the mock internals.
 */
export function createJetStreamRun(input: CreateJetStreamRunInput): JetStreamRun {
  const js: JetStreamStore = input.nats.jetstream();
  let acked = 0;

  return {
    async addStream(config: JetStreamConfig): Promise<void> {
      await js.addStream(config);
    },
    async publish<T>(subject: string, data: T): Promise<JetStreamPublishAck> {
      return js.publish<T>(subject, data);
    },
    async consumer(
      streamName: string,
      config: { readonly durable: string; readonly filterSubject?: string },
    ): Promise<JetStreamConsumer> {
      const inner = await js.consumer(streamName, {
        durable: config.durable,
        ackPolicy: 'explicit',
        ...(config.filterSubject !== undefined ? { filterSubject: config.filterSubject } : {}),
      });
      // Track ack + rebuild on redelivery. The mock does not model the
      // real ack timer, so redelivery is simulated by creating a fresh
      // consumer over the same stream — see `driveJetStream` in the adapter.
      return {
        durable: inner.durable,
        async fetch(batch: number): Promise<StreamingMessage[]> {
          const messages = await inner.fetch(batch);
          return messages;
        },
        ack(message: StreamingMessage): void {
          inner.ack(message);
          acked += 1;
        },
        info() {
          return inner.info();
        },
      };
    },
    listStreams: () => js.listStreams(),
    getStreamMessages: (name: string) => js.getStreamMessages(name),
    ackedCount: () => acked,
    resetCounters(): void {
      acked = 0;
    },
  };
}

/**
 * Simulate a redelivery by fetching the un-acked messages from a fresh
 * consumer bound to the same stream + durable name. Increments the run's
 * redelivered counter by the size of the batch.
 */
export async function simulateRedelivery(input: {
  readonly nats: NatsMock;
  readonly streamName: string;
  readonly durable: string;
  readonly filterSubject?: string;
  readonly onRedelivered: (count: number) => void;
  readonly batchSize: number;
}): Promise<StreamingMessage[]> {
  const js = input.nats.jetstream();
  const fresh = await js.consumer(input.streamName, {
    durable: `${input.durable}-redelivery`,
    ackPolicy: 'explicit',
    ...(input.filterSubject !== undefined ? { filterSubject: input.filterSubject } : {}),
  });
  const messages = await fresh.fetch(input.batchSize);
  input.onRedelivered(messages.length);
  return messages;
}
