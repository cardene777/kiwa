/**
 * Redis Streams consumer — receives CDC events (already ordered by LSN),
 * processes them at-least-once, tracks per-consumer group offsets, and
 * emits an `ack` back to the outbox so the delivery invariant advances.
 *
 * The mock does not talk to a real Redis — it emulates the XADD / XREADGROUP
 * / XACK flow with an in-memory ordered queue so tests can inspect
 * backpressure, duplicate delivery, and consumer group offset commits
 * deterministically.
 */

import type { CdcEvent } from '@kiwa-lab/orm';

export interface StreamsMessage {
  readonly messageId: string;
  readonly event: CdcEvent;
  readonly attempts: number;
}

export interface StreamsGroupState {
  readonly groupName: string;
  readonly pending: readonly StreamsMessage[];
  readonly acknowledged: readonly StreamsMessage[];
  readonly ackedLsn: number;
  readonly duplicates: number;
}

export interface StreamsConsumerRun {
  readonly ingest: (events: readonly CdcEvent[]) => void;
  readonly poll: (opts: { maxBatch: number }) => readonly StreamsMessage[];
  readonly ack: (messageIds: readonly string[]) => number;
  readonly redeliver: (opts: { retryAll: boolean }) => readonly StreamsMessage[];
  readonly state: () => StreamsGroupState;
  readonly reset: () => void;
}

/**
 * Create a consumer group bound to a stream. `maxInFlight` bounds how many
 * pending messages the consumer will hold at once — additional ingest
 * attempts past that cap raise `STREAMS_BACKPRESSURE`, mirroring the
 * server-side `MAXLEN` behaviour of Redis Streams.
 */
export function createStreamsConsumerRun(opts: {
  groupName: string;
  maxInFlight: number;
}): StreamsConsumerRun {
  if (opts.maxInFlight <= 0) {
    throw new Error('createStreamsConsumerRun: maxInFlight must be positive');
  }

  const pending: StreamsMessage[] = [];
  const acknowledged: StreamsMessage[] = [];
  let ackedLsn = 0;
  let duplicates = 0;
  let messageCounter = 0;
  const seenLsn = new Set<number>();

  function nextMessageId(): string {
    messageCounter += 1;
    return `msg-${messageCounter.toString().padStart(6, '0')}`;
  }

  function ingest(events: readonly CdcEvent[]): void {
    for (const event of events) {
      if (pending.length >= opts.maxInFlight) {
        throw new Error(
          `ingest: STREAMS_BACKPRESSURE — max in-flight reached (${opts.maxInFlight})`,
        );
      }
      if (seenLsn.has(event.lsn)) {
        // Idempotent producer — the same LSN arriving twice is counted as a
        // duplicate but does not push a new pending entry.
        duplicates += 1;
        continue;
      }
      seenLsn.add(event.lsn);
      pending.push({
        messageId: nextMessageId(),
        event,
        attempts: 0,
      });
    }
  }

  function poll(pollOpts: { maxBatch: number }): readonly StreamsMessage[] {
    if (pollOpts.maxBatch <= 0) return [];
    const batch = pending.slice(0, pollOpts.maxBatch).map((m) => ({
      ...m,
      attempts: m.attempts + 1,
    }));
    for (let i = 0; i < batch.length; i += 1) {
      pending[i] = batch[i]!;
    }
    return batch;
  }

  function ack(messageIds: readonly string[]): number {
    const ackSet = new Set(messageIds);
    let ackedCount = 0;
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const message = pending[i]!;
      if (ackSet.has(message.messageId)) {
        acknowledged.push(message);
        pending.splice(i, 1);
        if (message.event.lsn > ackedLsn) {
          ackedLsn = message.event.lsn;
        }
        ackedCount += 1;
      }
    }
    return ackedCount;
  }

  function redeliver(rOpts: { retryAll: boolean }): readonly StreamsMessage[] {
    if (!rOpts.retryAll) return [];
    return pending.map((m) => ({ ...m, attempts: m.attempts + 1 }));
  }

  function state(): StreamsGroupState {
    return {
      groupName: opts.groupName,
      pending: [...pending],
      acknowledged: [...acknowledged],
      ackedLsn,
      duplicates,
    };
  }

  function reset(): void {
    pending.length = 0;
    acknowledged.length = 0;
    ackedLsn = 0;
    duplicates = 0;
    messageCounter = 0;
    seenLsn.clear();
  }

  return { ingest, poll, ack, redeliver, state, reset };
}
