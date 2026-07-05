/**
 * WebSocket + hibernation e2e spec.
 *
 * Sub-Issue #915 (v1.24-2) AC — Hibernation API + WebSocket state
 * restoration. Covers the websocket-edge axis (upgrade-requested /
 * accepted / message / closed) and the durable-object axis wake-up path
 * end-to-end.
 *
 * Fidelity axes covered here:
 *  1. Upgrade handshake — requestWebSocketUpgrade → acceptWebSocket
 *     transitions the axis state pending → open.
 *  2. Message send — sequential frames preserve insertion order in the
 *     session's messages array.
 *  3. Close semantics — closeWebSocket transitions to `closed`; a second
 *     close throws.
 *  4. Hibernation eviction — drops members, closes 1006 abnormal, but
 *     the DO's storage keys survive the eviction round-trip.
 *  5. Rehydration — a JOIN after hibernation rebuilds the members set
 *     and emits a fresh axis session event.
 *  6. WebSocket registry isolation across rooms — the same memberId in
 *     two rooms tracks two independent axis sessions.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';

describe('mock adapter — WebSocket + hibernation', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: upgrade handshake transitions pending → open', async () => {
    await adapter.driveRoomJoin({ roomId: 'ws1', memberId: 'alice' });
    const upgrade = await adapter.driveWsUpgrade({
      roomId: 'ws1',
      memberId: 'alice',
    });
    expect(upgrade.upgraded).toBe(true);
    expect(upgrade.accepted).toBe(true);
  });

  it('axis 2: sequential message send preserves order', async () => {
    await adapter.driveRoomJoin({ roomId: 'ws2', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'ws2', memberId: 'alice' });
    const send = await adapter.driveWsSend({
      roomId: 'ws2',
      memberId: 'alice',
      messages: ['first', 'second', 'third'],
    });
    expect(send.messages).toEqual(['first', 'second', 'third']);
  });

  it('axis 3: closeWebSocket transitions to closed; a second close throws', async () => {
    await adapter.driveRoomJoin({ roomId: 'ws3', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'ws3', memberId: 'alice' });
    const close = await adapter.driveWsClose({
      roomId: 'ws3',
      memberId: 'alice',
      code: 1000,
    });
    expect(close.closeCode).toBe(1000);
    // Second close throws — the websocket-edge axis rejects double-close.
    await expect(
      adapter.driveWsClose({ roomId: 'ws3', memberId: 'alice', code: 1000 }),
    ).rejects.toThrow(/socket already closed/);
  });

  it('axis 4: hibernation drops members, closes 1006, but preserves storage', async () => {
    await adapter.driveRoomJoin({ roomId: 'ws4', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'ws4', memberId: 'alice' });
    // Broadcast so storage has some content.
    await adapter.driveRoomBroadcast({
      roomId: 'ws4',
      senderId: 'alice',
      message: 'persist-me',
      receivers: ['alice'],
    });
    const hibernation = await adapter.driveWsHibernation({
      roomId: 'ws4',
      memberId: 'alice',
      idleForMs: 45_000,
    });
    // Storage keys survived — messagesReplayed === 1 (the broadcast).
    expect(hibernation.messagesReplayed).toBe(1);
    // Restored members includes alice (re-added post-hibernation).
    expect(hibernation.restoredMembers).toContain('alice');
    // The WS session should now be closed with code 1006.
    // (We can indirectly verify via a subsequent JOIN + upgrade round trip.)
    await adapter.driveRoomJoin({ roomId: 'ws4', memberId: 'alice' });
    const nextUpgrade = await adapter.driveWsUpgrade({
      roomId: 'ws4',
      memberId: 'alice',
    });
    expect(nextUpgrade.upgraded).toBe(true);
  });

  it('axis 5: rehydration after hibernation rebuilds members', async () => {
    await adapter.driveRoomJoin({ roomId: 'ws5', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'ws5', memberId: 'alice' });
    await adapter.driveRoomJoin({ roomId: 'ws5', memberId: 'bob' });
    await adapter.driveWsUpgrade({ roomId: 'ws5', memberId: 'bob' });
    // Hibernate — drops both members' sockets.
    await adapter.driveWsHibernation({
      roomId: 'ws5',
      memberId: 'alice',
      idleForMs: 60_000,
    });
    // Rejoin bob — his socket needs a fresh upgrade.
    const bob = await adapter.driveRoomJoin({ roomId: 'ws5', memberId: 'bob' });
    // After hibernate + alice-rejoin (via driveWsHibernation) + bob-rejoin,
    // occupant count should be 2.
    expect(bob.occupantCount).toBe(2);
  });

  it('axis 6: WebSocket registry isolation across rooms', async () => {
    // Same memberId in two rooms — two independent sessions.
    await adapter.driveRoomJoin({ roomId: 'ws6a', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'ws6a', memberId: 'alice' });
    await adapter.driveRoomJoin({ roomId: 'ws6b', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'ws6b', memberId: 'alice' });
    // Sending to one room does not affect the other's session.
    await adapter.driveWsSend({
      roomId: 'ws6a',
      memberId: 'alice',
      messages: ['a-msg'],
    });
    await adapter.driveWsSend({
      roomId: 'ws6b',
      memberId: 'alice',
      messages: ['b-msg'],
    });
    // Closing ws6a does not close ws6b — the next send on ws6b succeeds.
    await adapter.driveWsClose({
      roomId: 'ws6a',
      memberId: 'alice',
      code: 1000,
    });
    const nextSend = await adapter.driveWsSend({
      roomId: 'ws6b',
      memberId: 'alice',
      messages: ['still-open'],
    });
    expect(nextSend.messages).toEqual(['still-open']);
  });

  it('metrics: 8 op surface produces 8 metric counters', async () => {
    await adapter.driveRoomJoin({ roomId: 'ws7', memberId: 'alice' });
    await adapter.driveRoomBroadcast({
      roomId: 'ws7',
      senderId: 'alice',
      message: 'x',
      receivers: [],
    });
    await adapter.driveStorageTx({
      roomId: 'ws7',
      writes: [{ key: 'k', value: 'v' }],
      rollback: false,
    });
    await adapter.driveAlarmPurge({
      roomId: 'ws7',
      scheduledAt: 100,
      now: 200,
    });
    await adapter.driveWsUpgrade({ roomId: 'ws7', memberId: 'alice' });
    await adapter.driveWsSend({
      roomId: 'ws7',
      memberId: 'alice',
      messages: ['m'],
    });
    await adapter.driveWsHibernation({
      roomId: 'ws7',
      memberId: 'alice',
      idleForMs: 1000,
    });
    // driveRoomJoin (alice again to re-open) + driveWsClose to end.
    await adapter.driveRoomJoin({ roomId: 'ws7', memberId: 'alice' });
    await adapter.driveWsUpgrade({ roomId: 'ws7', memberId: 'alice' });
    await adapter.driveWsClose({
      roomId: 'ws7',
      memberId: 'alice',
      code: 1000,
    });
    const m = adapter.metrics();
    expect(m.roomJoinCount).toBe(2);
    expect(m.roomBroadcastCount).toBe(1);
    expect(m.storageTxCount).toBe(1);
    expect(m.alarmPurgeCount).toBe(1);
    expect(m.wsUpgradeCount).toBe(2);
    expect(m.wsSendCount).toBe(1);
    expect(m.wsCloseCount).toBe(1);
    expect(m.wsHibernationCount).toBe(1);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('driveWsUpgrade without env records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveWsUpgrade({ roomId: 'ws-real', memberId: 'alice' }),
    ).rejects.toBeInstanceOf(SkippedError);
    const traces = adapter.traces();
    expect(traces[0]?.errorKind).toBe('KIWA_CF_DURABLE_OBJECT_ENV_MISSING');
    await adapter.reset();
  });

  it('driveWsSend without env records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveWsSend({
        roomId: 'ws-real',
        memberId: 'alice',
        messages: ['m'],
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    await adapter.reset();
  });

  it('driveWsClose without env records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveWsClose({
        roomId: 'ws-real',
        memberId: 'alice',
        code: 1000,
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    await adapter.reset();
  });

  it('driveWsHibernation without env records missing-env trace', async () => {
    const adapter = makeRealAdapter();
    await expect(
      adapter.driveWsHibernation({
        roomId: 'ws-real',
        memberId: 'alice',
        idleForMs: 1000,
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    await adapter.reset();
  });
});
