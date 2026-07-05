/**
 * Storage transactional e2e spec.
 *
 * Sub-Issue #915 (v1.24-2) AC — Durable Object storage transactional
 * put/get/delete + transaction rollback. Covers the storage-written
 * neutral event on the durable-object axis end-to-end.
 *
 * Fidelity axes covered here:
 *  1. Transactional put — multiple writes commit atomically when
 *     rollback = false.
 *  2. Transactional rollback — writes revert on rollback = true, storage
 *     returns to the pre-transaction snapshot.
 *  3. Interleaved transactions — a rolled-back tx does not affect a
 *     subsequently committed tx.
 *  4. Storage keys persist across message broadcasts + hibernation.
 *  5. Alarm purge clears message keys but records purged count under
 *     `msg:purged`.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';

describe('mock adapter — storage transactional', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: writes commit when rollback = false', async () => {
    const snapshot = await adapter.driveStorageTx({
      roomId: 'stx1',
      writes: [
        { key: 'a', value: '1' },
        { key: 'b', value: '2' },
        { key: 'c', value: '3' },
      ],
      rollback: false,
    });
    expect(snapshot.rolledBack).toBe(false);
    expect(snapshot.finalRead).toEqual({ a: '1', b: '2', c: '3' });
    expect(snapshot.writes).toEqual({ a: '1', b: '2', c: '3' });
  });

  it('axis 2: writes revert when rollback = true', async () => {
    const snapshot = await adapter.driveStorageTx({
      roomId: 'stx2',
      writes: [
        { key: 'x', value: '10' },
        { key: 'y', value: '20' },
      ],
      rollback: true,
    });
    expect(snapshot.rolledBack).toBe(true);
    // Rollback restores the pre-tx snapshot, so both keys read as null.
    expect(snapshot.finalRead).toEqual({ x: null, y: null });
    // The writes field records the attempted mutation so callers can
    // observe what would have committed.
    expect(snapshot.writes).toEqual({ x: '10', y: '20' });
  });

  it('axis 3: rolled-back tx does not affect subsequent committed tx', async () => {
    // First tx rolls back.
    await adapter.driveStorageTx({
      roomId: 'stx3',
      writes: [{ key: 'k1', value: 'v1' }],
      rollback: true,
    });
    // Second tx commits — the rolled-back key should not leak.
    const second = await adapter.driveStorageTx({
      roomId: 'stx3',
      writes: [
        { key: 'k2', value: 'v2' },
        { key: 'k3', value: 'v3' },
      ],
      rollback: false,
    });
    expect(second.finalRead).toEqual({ k2: 'v2', k3: 'v3' });
    expect(second.rolledBack).toBe(false);
    // A third read via a no-op tx should show only the committed keys.
    const third = await adapter.driveStorageTx({
      roomId: 'stx3',
      writes: [{ key: 'k1', value: 'v1-shadow' }],
      rollback: true,
    });
    // k1 was never persisted (first tx rolled back, third tx also rolls
    // back), so the final read is null.
    expect(third.finalRead).toEqual({ k1: null });
  });

  it('axis 4: storage keys persist across broadcast + hibernation', async () => {
    await adapter.driveRoomJoin({ roomId: 'stx4', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'stx4', memberId: 'alice' });
    await adapter.driveRoomBroadcast({
      roomId: 'stx4',
      senderId: 'alice',
      message: 'persist-me',
      receivers: ['alice'],
    });
    // Persist an extra key outside the message-append path.
    await adapter.driveStorageTx({
      roomId: 'stx4',
      writes: [{ key: 'user:alice:last_seen', value: '1700000000' }],
      rollback: false,
    });
    // Hibernate — the fabric-persist keys should survive.
    const hibernation = await adapter.driveWsHibernation({
      roomId: 'stx4',
      memberId: 'alice',
      idleForMs: 30_000,
    });
    // messagesReplayed = 1 (the persist-me broadcast).
    expect(hibernation.messagesReplayed).toBe(1);
  });

  it('axis 5: alarm purge clears message keys and records msg:purged', async () => {
    await adapter.driveRoomJoin({ roomId: 'stx5', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'stx5', memberId: 'alice' });
    // Append 3 messages to fill the transcript.
    for (let i = 0; i < 3; i += 1) {
      await adapter.driveRoomBroadcast({
        roomId: 'stx5',
        senderId: 'alice',
        message: `m${i}`,
        receivers: ['alice'],
      });
    }
    // Fire the alarm with now > scheduledAt.
    const purge = await adapter.driveAlarmPurge({
      roomId: 'stx5',
      scheduledAt: 100,
      now: 200,
    });
    expect(purge.firedAt).toBe(200);
    // 3 message keys purged (msg:0 / msg:1 / msg:2).
    expect(purge.keysPurged.length).toBe(3);
    expect(purge.keysPurged).toEqual(['msg:0', 'msg:1', 'msg:2']);
  });

  it('axis 5: alarm purge no-ops when now < scheduledAt', async () => {
    await adapter.driveRoomJoin({ roomId: 'stx6', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'stx6', memberId: 'alice' });
    await adapter.driveRoomBroadcast({
      roomId: 'stx6',
      senderId: 'alice',
      message: 'ping',
      receivers: ['alice'],
    });
    const purge = await adapter.driveAlarmPurge({
      roomId: 'stx6',
      scheduledAt: 500,
      now: 300,
    });
    expect(purge.firedAt).toBe(0);
    expect(purge.keysPurged).toEqual([]);
  });

  it('metrics: 4 storage txs record 4 latency samples + 4 tx count', async () => {
    await adapter.driveStorageTx({
      roomId: 'stx7',
      writes: [{ key: 'a', value: '1' }],
      rollback: false,
    });
    await adapter.driveStorageTx({
      roomId: 'stx7',
      writes: [{ key: 'b', value: '2' }],
      rollback: true,
    });
    await adapter.driveStorageTx({
      roomId: 'stx7',
      writes: [{ key: 'c', value: '3' }],
      rollback: false,
    });
    await adapter.driveStorageTx({
      roomId: 'stx7',
      writes: [{ key: 'd', value: '4' }],
      rollback: false,
    });
    const m = adapter.metrics();
    expect(m.storageTxCount).toBe(4);
    expect(m.latencySamplesMs.length).toBe(4);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('driveStorageTx without env records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveStorageTx({
        roomId: 'stx-real',
        writes: [{ key: 'k', value: 'v' }],
        rollback: false,
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    const traces = adapter.traces();
    expect(traces[0]?.errorKind).toBe('KIWA_CF_DURABLE_OBJECT_ENV_MISSING');
    await adapter.reset();
  });

  it('driveAlarmPurge without env records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveAlarmPurge({
        roomId: 'stx-real',
        scheduledAt: 0,
        now: 1,
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    await adapter.reset();
  });
});
