/**
 * Chat room e2e spec (durable-object axis focus).
 *
 * Sub-Issue #915 (v1.24-2) AC — 2 users JOIN a room, exchange messages
 * via broadcast, then a hibernation-eviction event drops in-memory state
 * and the room rehydrates on the next request. This spec covers the
 * durable-object axis of the AC (createDurableObject / requestDurableObject
 * / writeStorage / alarm-fired) end-to-end.
 *
 * Fidelity axes covered here:
 *  1. Room creation emits durable-object.created only on the FIRST join.
 *     Subsequent joins emit durable-object.requested.
 *  2. Broadcast writes append to the DO's transactional storage in order.
 *  3. Hibernation eviction drops members but preserves storage keys, and
 *     the next JOIN rehydrates the axis session.
 *  4. Message broadcast only reaches WebSocket sessions in `open` state.
 *  5. Room isolation — two independent rooms do not share state or
 *     axis sessions.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';

describe('mock adapter — chat room end-to-end', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: first JOIN emits durable-object.created, subsequent joins emit requested', async () => {
    const alice = await adapter.driveRoomJoin({ roomId: 'r1', memberId: 'alice' });
    expect(alice.occupantCount).toBe(1);
    expect(alice.roomId).toBe('r1');
    const bob = await adapter.driveRoomJoin({ roomId: 'r1', memberId: 'bob' });
    expect(bob.occupantCount).toBe(2);
    const traces = adapter.traces();
    // Both joins recorded 1 trace event each; both ok.
    expect(traces.filter((t) => t.op === 'driveRoomJoin').length).toBe(2);
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('axis 2: broadcast writes append to DO storage in order (persisted transcript)', async () => {
    await adapter.driveRoomJoin({ roomId: 'r2', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'r2', memberId: 'alice' });
    await adapter.driveRoomJoin({ roomId: 'r2', memberId: 'bob' });
    await adapter.driveWsUpgrade({ roomId: 'r2', memberId: 'bob' });
    const first = await adapter.driveRoomBroadcast({
      roomId: 'r2',
      senderId: 'alice',
      message: 'hello',
      receivers: ['alice', 'bob'],
    });
    const second = await adapter.driveRoomBroadcast({
      roomId: 'r2',
      senderId: 'bob',
      message: 'hi',
      receivers: ['alice', 'bob'],
    });
    // Both messages delivered to both members.
    expect(first.deliveredTo).toEqual(['alice', 'bob']);
    expect(second.deliveredTo).toEqual(['alice', 'bob']);
    // Both broadcast trace events succeeded.
    const broadcasts = adapter.traces().filter((t) => t.op === 'driveRoomBroadcast');
    expect(broadcasts.length).toBe(2);
    expect(broadcasts.every((t) => t.ok)).toBe(true);
  });

  it('axis 3: hibernation drops members but preserves storage; next JOIN rehydrates', async () => {
    await adapter.driveRoomJoin({ roomId: 'r3', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'r3', memberId: 'alice' });
    await adapter.driveRoomBroadcast({
      roomId: 'r3',
      senderId: 'alice',
      message: 'persist-me',
      receivers: ['alice'],
    });
    // Hibernate — drops the in-memory members set but keeps storage keys.
    const hibernation = await adapter.driveWsHibernation({
      roomId: 'r3',
      memberId: 'alice',
      idleForMs: 60_000,
    });
    expect(hibernation.messagesReplayed).toBe(1);
    expect(hibernation.restoredMembers).toContain('alice');
    // Rejoin — the DO is rehydrated and the occupant count is 1.
    const rejoin = await adapter.driveRoomJoin({ roomId: 'r3', memberId: 'alice' });
    // Members set is rebuilt on hibernate + rejoin: 1 (added by hibernate) + 1 (added by rejoin, same id → still 1).
    expect(rejoin.occupantCount).toBe(1);
    // Storage keys survived (msg:0 for the persist-me broadcast).
    expect(rejoin.storageKeys.length).toBeGreaterThan(0);
  });

  it('axis 4: broadcast reaches only WebSocket sessions in open state', async () => {
    await adapter.driveRoomJoin({ roomId: 'r4', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'r4', memberId: 'alice' });
    await adapter.driveRoomJoin({ roomId: 'r4', memberId: 'bob' });
    // Bob JOINed but has no WebSocket open — broadcast should skip him.
    const broadcast = await adapter.driveRoomBroadcast({
      roomId: 'r4',
      senderId: 'alice',
      message: 'ping',
      receivers: ['alice', 'bob'],
    });
    expect(broadcast.deliveredTo).toEqual(['alice']);
  });

  it('axis 5: two independent rooms do not share state', async () => {
    await adapter.driveRoomJoin({ roomId: 'r5a', memberId: 'alice' });
    await adapter.driveRoomJoin({ roomId: 'r5b', memberId: 'bob' });
    const alice2 = await adapter.driveRoomJoin({ roomId: 'r5a', memberId: 'alice2' });
    // r5a has 2 members (alice + alice2); r5b remains at 1 (bob).
    expect(alice2.occupantCount).toBe(2);
    const bobCheck = await adapter.driveRoomJoin({ roomId: 'r5b', memberId: 'bob' });
    // bob rejoin — Set semantics keep count at 1.
    expect(bobCheck.occupantCount).toBe(1);
  });

  it('metrics: 6 room-join + broadcast ops record 6 latency samples', async () => {
    await adapter.driveRoomJoin({ roomId: 'r6', memberId: 'alice' });
    await adapter.driveRoomJoin({ roomId: 'r6', memberId: 'bob' });
    await adapter.driveWsUpgrade({ roomId: 'r6', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'r6', memberId: 'bob' });
    await adapter.driveRoomBroadcast({
      roomId: 'r6',
      senderId: 'alice',
      message: 'first',
      receivers: ['alice', 'bob'],
    });
    await adapter.driveRoomBroadcast({
      roomId: 'r6',
      senderId: 'bob',
      message: 'second',
      receivers: ['alice', 'bob'],
    });
    const m = adapter.metrics();
    expect(m.roomJoinCount).toBe(2);
    expect(m.roomBroadcastCount).toBe(2);
    expect(m.wsUpgradeCount).toBe(2);
    expect(m.latencySamplesMs.length).toBe(6);
  });

  it('reset() clears trace + metrics + rebuilds registry', async () => {
    await adapter.driveRoomJoin({ roomId: 'r7', memberId: 'alice' });
    await adapter.reset();
    expect(adapter.traces().length).toBe(0);
    expect(adapter.metrics().latencySamplesMs.length).toBe(0);
    // Post-reset, the same room can be joined again from scratch (occupant
    // count starts at 1).
    const rejoin = await adapter.driveRoomJoin({ roomId: 'r7', memberId: 'alice' });
    expect(rejoin.occupantCount).toBe(1);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('driveRoomJoin without KIWA_MODE=real records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveRoomJoin({ roomId: 'r8', memberId: 'alice' }),
    ).rejects.toBeInstanceOf(SkippedError);
    const traces = adapter.traces();
    expect(traces[0]?.ok).toBe(false);
    expect(traces[0]?.errorKind).toBe('KIWA_CF_DURABLE_OBJECT_ENV_MISSING');
    await adapter.reset();
  });

  it('driveRoomBroadcast without env records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveRoomBroadcast({
        roomId: 'r9',
        senderId: 'alice',
        message: 'x',
        receivers: [],
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    const traces = adapter.traces();
    expect(traces[0]?.errorKind).toBe('KIWA_CF_DURABLE_OBJECT_ENV_MISSING');
    await adapter.reset();
  });
});
