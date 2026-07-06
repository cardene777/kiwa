// Cross-provider exactly-once semantics — transactional producer + read
// committed filter + isolation level, unified across Kafka / Redpanda / NATS.
//
// The existing `../exactly-once.ts` covers the Kafka-shaped API; this module
// layers a provider-agnostic wrapper so tests can drive the same 3-step
// (begin → send → commit) flow through any of the 3 provider mocks. The
// isolation level captures the guarantee a downstream consumer expects to
// observe.

import type { StreamingMessage, StreamingProvider } from '../types.js';

export const EXACTLY_ONCE_SEMANTICS_SYMBOL = Symbol.for(
  'kiwa.streaming.semantics.exactly-once',
);

export type IsolationLevel = 'read-uncommitted' | 'read-committed';

export interface ExactlyOnceConfig {
  readonly provider: StreamingProvider;
  readonly transactionalId: string;
  readonly isolationLevel?: IsolationLevel;
}

export interface PendingRecord<TValue = unknown> {
  readonly topic: string;
  readonly value: TValue;
  readonly key: string | null;
}

export type TxnState = 'idle' | 'active' | 'committed' | 'aborted';

export interface ExactlyOnceSemantics<TValue = unknown> {
  readonly [EXACTLY_ONCE_SEMANTICS_SYMBOL]: true;
  readonly config: Required<ExactlyOnceConfig>;

  begin(): void;
  send(record: PendingRecord<TValue>): void;
  commit(): readonly StreamingMessage<TValue>[];
  abort(): void;
  state(): TxnState;

  /** Filter a stream according to the configured isolation level. */
  filter(messages: readonly StreamingMessage<TValue>[]): readonly StreamingMessage<TValue>[];

  reset(): void;
}

/**
 * Create the cross-provider exactly-once semantics wrapper. Records enqueued
 * between `begin()` and `commit()` become part of an atomic batch — nothing
 * lands until commit succeeds. `abort()` discards the batch, and a
 * `read-committed` filter excludes any message tagged with an aborted batch id
 * (delivered as a header `x-kiwa-txn-aborted: true`).
 */
export function createExactlyOnceSemantics<TValue = unknown>(
  config: ExactlyOnceConfig,
): ExactlyOnceSemantics<TValue> {
  const cfg: Required<ExactlyOnceConfig> = {
    provider: config.provider,
    transactionalId: config.transactionalId,
    isolationLevel: config.isolationLevel ?? 'read-committed',
  };
  let state: TxnState = 'idle';
  let pending: PendingRecord<TValue>[] = [];
  const abortedBatchIds = new Set<string>();
  let batchSeq = 0;
  let batchId = '';

  const semantics: ExactlyOnceSemantics<TValue> = {
    [EXACTLY_ONCE_SEMANTICS_SYMBOL]: true,
    config: cfg,
    begin(): void {
      if (state === 'active') {
        throw new Error(
          `exactly-once (${cfg.provider}): begin without commit/abort of previous txn`,
        );
      }
      state = 'active';
      batchSeq += 1;
      batchId = `${cfg.transactionalId}::${batchSeq}`;
      pending = [];
    },
    send(record: PendingRecord<TValue>): void {
      if (state !== 'active') {
        throw new Error(`exactly-once (${cfg.provider}): send without active transaction`);
      }
      pending.push(record);
    },
    commit(): readonly StreamingMessage<TValue>[] {
      if (state !== 'active') {
        throw new Error(`exactly-once (${cfg.provider}): commit without active transaction`);
      }
      const emitted: StreamingMessage<TValue>[] = [];
      for (let i = 0; i < pending.length; i += 1) {
        const record = pending[i];
        if (!record) continue;
        emitted.push({
          topic: record.topic,
          partition: 0,
          offset: i,
          timestamp: Date.now(),
          key: record.key,
          value: record.value,
          headers: { 'x-kiwa-txn-id': batchId },
        });
      }
      pending = [];
      state = 'committed';
      return emitted;
    },
    abort(): void {
      if (state !== 'active') {
        throw new Error(`exactly-once (${cfg.provider}): abort without active transaction`);
      }
      abortedBatchIds.add(batchId);
      pending = [];
      state = 'aborted';
    },
    state(): TxnState {
      return state;
    },
    filter(messages): readonly StreamingMessage<TValue>[] {
      if (cfg.isolationLevel === 'read-uncommitted') return messages;
      return messages.filter((m) => {
        const txnId = m.headers['x-kiwa-txn-id'];
        if (!txnId) return true;
        return !abortedBatchIds.has(txnId);
      });
    },
    reset(): void {
      state = 'idle';
      pending = [];
      abortedBatchIds.clear();
      batchSeq = 0;
      batchId = '';
    },
  };
  return semantics;
}

/** Type guard: recognize an ExactlyOnceSemantics wrapper. */
export function isExactlyOnceSemantics(value: unknown): value is ExactlyOnceSemantics<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [EXACTLY_ONCE_SEMANTICS_SYMBOL]?: true })[EXACTLY_ONCE_SEMANTICS_SYMBOL] === true
  );
}
