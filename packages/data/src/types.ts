import type { TestEnvBase, TestMode } from '@kiwa-test/spec';

export interface QueueMessage<T = unknown> {
  id: string;
  body: T;
  receivedCount: number;
  /** Optional dedup key for idempotency tests */
  dedupKey?: string;
}

export interface QueueAckHandle {
  ack: () => void;
  nack: () => void;
}

export type QueueHandler<T> = (
  message: QueueMessage<T>,
  ack: QueueAckHandle,
) => void | Promise<void>;

export interface QueueClient<T = unknown> {
  send: (body: T, opts?: { dedupKey?: string }) => string;
  receive: () => QueueMessage<T> | null;
  /** Subscribe a handler that processes every send + retries until ack */
  consume: (handler: QueueHandler<T>) => () => void;
  size: () => number;
  dlqSize: () => number;
  drainDlq: () => QueueMessage<T>[];
}

export interface SetupQueueEnvOptions<T = unknown> {
  mode: Extract<TestMode, 'mock' | 'live'>;
  /** Maximum receive count before a message is sent to the dead letter queue */
  maxReceiveCount?: number;
  /** Optional initial messages */
  seed?: T[];
}

export interface QueueTestEnv<T = unknown> extends TestEnvBase<'mock' | 'live'> {
  client: QueueClient<T>;
}

export interface CronEntry {
  id: string;
  intervalMs: number;
  lastRunMs: number;
  fn: () => void | Promise<void>;
}

export interface FakeClock {
  nowMs: () => number;
  advanceMs: (ms: number) => Promise<void>;
  schedule: (intervalMs: number, fn: () => void | Promise<void>) => string;
  unschedule: (id: string) => void;
  pendingEntries: () => CronEntry[];
}
