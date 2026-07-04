import { createKafkaMock, type StreamingMessage } from '@kiwa-test/streaming';
import { afterEach, describe, expect, it } from 'vitest';
import { createDlqRun, type WorkPayload } from '../src/dlq/index.js';

let kafkaRef: ReturnType<typeof createKafkaMock> | null = null;

afterEach(() => {
  kafkaRef?.reset();
  kafkaRef = null;
});

function makeMock() {
  const kafka = createKafkaMock({ defaultPartitionCount: 1 });
  kafkaRef = kafka;
  return kafka;
}

function makeMessage(payload: WorkPayload, offset = 0): StreamingMessage<WorkPayload> {
  return {
    topic: 'work',
    partition: 0,
    offset,
    timestamp: Date.now(),
    key: payload.orderId,
    value: payload,
    headers: {},
  };
}

describe('DLQ flow — retry policy + quarantine + DLQ topic replay', () => {
  it('T-DKD-001 valid payload is handled on the first attempt', async () => {
    const run = createDlqRun({ topic: 'work', maxAttempts: 3 });
    const msg = makeMessage({ orderId: 'ok-1', valid: true });
    const result = await run.handle(msg);
    expect(result.outcome).toBe('handled');
    expect(result.attempts).toBe(1);
    expect(result.quarantinedCount).toBe(0);
  });

  it('T-DKD-002 poison payload exhausts retry budget and is quarantined', async () => {
    const run = createDlqRun({ topic: 'work', maxAttempts: 3 });
    const msg = makeMessage({ orderId: 'poison-1', valid: false });
    const result = await run.handle(msg);
    expect(result.outcome).toBe('quarantined');
    expect(result.attempts).toBe(3);
    expect(result.quarantinedCount).toBe(1);
    expect(run.quarantined()[0]?.reason).toContain('poison message');
  });

  it('T-DKD-003 DLQ topic name derives from topic + .dlq suffix', async () => {
    const run = createDlqRun({ topic: 'orders', maxAttempts: 1 });
    expect(run.dlq.deadLetterTopic).toBe('orders.dlq');
  });

  it('T-DKD-004 quarantined entries can be replayed from the DLQ topic once the fix predicate flips', async () => {
    const kafka = makeMock();
    const run = createDlqRun({ topic: 'work', maxAttempts: 1 });
    // Quarantine 2 poison messages.
    await run.handle(makeMessage({ orderId: 'p1', valid: false }, 0));
    await run.handle(makeMessage({ orderId: 'p2', valid: false }, 1));
    expect(run.quarantined().length).toBe(2);
    // Publish + replay with an ok predicate that never accepts → replayed 0.
    const replayNone = await run.publishAndReplayDlq(kafka, () => false);
    expect(replayNone.published).toBe(2);
    expect(replayNone.replayed).toBe(0);
    // Publish + replay again with an accept-all predicate → replayed 2.
    // Note the DLQ topic already has 2 records from the earlier publish +
    // 2 more from this republish → the replay consumer sees 4 records.
    const replayAll = await run.publishAndReplayDlq(kafka, () => true);
    expect(replayAll.published).toBe(2);
    expect(replayAll.replayed).toBeGreaterThanOrEqual(2);
  });

  it('T-DKD-005 maxAttempts=0 throws (guard invalid config)', () => {
    expect(() => createDlqRun({ topic: 'x', maxAttempts: 0 })).toThrow(/maxAttempts/);
  });
});
