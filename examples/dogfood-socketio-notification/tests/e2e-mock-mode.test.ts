import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter, type MockNotificationAdapter } from '../src/adapters/mock.js';
import {
  backpressureOverflowDrops,
  multiRoomNotify,
  reconnectReplaysPending,
  subscribeAndReceive,
} from '../src/flows/notification-flows.js';

let adapter: MockNotificationAdapter;

beforeEach(() => {
  adapter = makeMockAdapter({ backpressureLimit: 8 });
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-socketio-notification (mock mode) — notification + room + reconnect + backpressure', () => {
  it('T-DFS-M-001 subscribeAndReceive delivers a high-priority notification to the room handler', async () => {
    const result = await subscribeAndReceive(adapter);
    expect(result.subscribe.subscribed).toBe(true);
    expect(result.deliver.bufferedWhileOffline).toBe(false);
    expect(result.received).toHaveLength(1);
    expect(result.received[0]?.priority).toBe('high');
    expect(result.received[0]?.body).toBe('PR #123 needs review');
  });

  it('T-DFS-M-002 subscribeAndReceive returns a stable event id (prefixed notif_)', async () => {
    const result = await subscribeAndReceive(adapter);
    expect(result.deliver.eventId).toMatch(/^notif_[a-z0-9]+$/);
    expect(result.received[0]?.id).toBe(result.deliver.eventId);
  });

  it('T-DFS-M-003 multiRoomNotify scopes delivery per room (no cross-leak)', async () => {
    const result = await multiRoomNotify(adapter);
    expect(result.receivedByAlice).toHaveLength(1);
    expect(result.receivedByBob).toHaveLength(1);
    expect(result.receivedByAlice[0]?.userId).toBe('alice');
    expect(result.receivedByBob[0]?.userId).toBe('bob');
    expect(result.receivedByBob[0]?.priority).toBe('urgent');
  });

  it('T-DFS-M-004 reconnectReplaysPending buffers 3 events while offline and replays them on reconnect', async () => {
    const result = await reconnectReplaysPending(adapter, () => adapter.disconnectClient());
    // 3 events queued while offline.
    expect(result.pendingAtDisconnect.queuedCount).toBe(3);
    expect(result.pendingAtDisconnect.droppedCount).toBe(0);
    // Reconnect flushes all 3 to the room handler in FIFO order.
    expect(result.reconnect.replayedCount).toBe(3);
    expect(result.reconnect.droppedByBackpressure).toBe(0);
    expect(result.received.map((n) => n.body)).toEqual(['ping 1', 'ping 2', 'ping 3']);
  });

  it('T-DFS-M-005 reconnect increments the reconnect counter', async () => {
    const result = await reconnectReplaysPending(adapter, () => adapter.disconnectClient());
    expect(result.reconnect.reconnectCount).toBe(1);
    expect(adapter.metrics().reconnectCount).toBeGreaterThanOrEqual(1);
  });

  it('T-DFS-M-006 backpressureOverflowDrops queues 8 and drops 4 at backpressureLimit=8', async () => {
    const result = await backpressureOverflowDrops(adapter, () => adapter.disconnectClient());
    // The 8th event is the last that fits; events 9-12 overflow.
    expect(result.pendingAtOverflow.queuedCount).toBe(8);
    expect(result.pendingAtOverflow.droppedCount).toBe(4);
    // Reconnect flushes 8 to the handler; 4 are counted as dropped.
    expect(result.reconnect.replayedCount).toBe(8);
    expect(result.received).toHaveLength(8);
    // The first 8 (indices 0..7) landed on the queue in order.
    expect(result.received.map((n) => n.body)).toEqual([
      'burst 0',
      'burst 1',
      'burst 2',
      'burst 3',
      'burst 4',
      'burst 5',
      'burst 6',
      'burst 7',
    ]);
  });

  it('T-DFS-M-007 metrics roll up publish / subscribe counts across flows', async () => {
    await subscribeAndReceive(adapter);
    const m = adapter.metrics();
    expect(m.subscribeCount).toBeGreaterThanOrEqual(1);
    expect(m.publishCount).toBeGreaterThanOrEqual(1);
    expect(m.requests).toBeGreaterThanOrEqual(2);
  });

  it('T-DFS-M-008 reset clears traces + metrics + connection state', async () => {
    await subscribeAndReceive(adapter);
    adapter.disconnectClient();
    expect(adapter.isConnected()).toBe(false);
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().requests).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.isConnected()).toBe(true);
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().requests).toBe(0);
  });

  it('T-DFS-M-009 deliverNotification while offline reports bufferedWhileOffline=true', async () => {
    await adapter.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:carol',
      userId: 'carol',
    });
    adapter.disconnectClient();
    const result = await adapter.deliverNotification({
      namespace: '/notify',
      room: 'alerts:carol',
      payload: { userId: 'carol', priority: 'low', body: 'offline ping' },
    });
    expect(result.bufferedWhileOffline).toBe(true);
    const pending = await adapter.getPending({ room: 'alerts:carol' });
    expect(pending.queuedCount).toBe(1);
  });

  it('T-DFS-M-010 backpressure drop records BACKPRESSURE_DROP trace entries after the queue is full', async () => {
    await adapter.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:dave',
      userId: 'dave',
    });
    adapter.disconnectClient();
    for (let i = 0; i < 12; i += 1) {
      await adapter.deliverNotification({
        namespace: '/notify',
        room: 'alerts:dave',
        payload: { userId: 'dave', priority: 'medium', body: `x${i}` },
      });
    }
    const drops = adapter.traces().filter((t) => t.errorKind === 'BACKPRESSURE_DROP');
    expect(drops).toHaveLength(4);
  });
});
