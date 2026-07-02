import type {
  NotificationAdapter,
  NotificationEvent,
  PendingSnapshot,
} from '../adapters/interface.js';

/**
 * End-to-end flows that exercise the {@link NotificationAdapter} contract.
 * The flows are provider-neutral — the same code drives the mock and (when
 * envs are set) the real Socket.io / SSE backend.
 *
 * Each flow is designed to hit a different mock difficulty ...
 *
 * - {@link subscribeAndReceive} — join a room + receive a single
 *   notification. Happy path for the on-connected delivery.
 * - {@link multiRoomNotify} — 2 rooms under the same namespace, each
 *   receives its own notification stream (server-side `.to(room).emit`
 *   routes independently).
 * - {@link reconnectReplaysPending} — take the client offline, queue 3
 *   notifications, reconnect, observe FIFO replay to the handler.
 *   Exercises the pending event queue.
 * - {@link backpressureOverflowDrops} — take the client offline, queue 12
 *   notifications against a backpressureLimit of 8. Reconnect replays 8
 *   and 4 are counted as dropped. Exercises the queue-overflow drop path.
 *
 * `takeOffline` is a provider-supplied test hook — the mock adapter
 * exposes `disconnectClient()` which flips the internal `connected` flag
 * without triggering a reconnect. Real-mode tests can supply an
 * equivalent hook (kill server, throttle NIC etc.) or skip these two
 * flows entirely.
 */

const NAMESPACE = '/notify';

export async function subscribeAndReceive(adapter: NotificationAdapter): Promise<{
  subscribe: Awaited<ReturnType<NotificationAdapter['subscribeRoom']>>;
  deliver: Awaited<ReturnType<NotificationAdapter['deliverNotification']>>;
  received: NotificationEvent[];
}> {
  const received: NotificationEvent[] = [];
  const subscribe = await adapter.subscribeRoom({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    userId: 'alice',
    onNotification: (n) => received.push(n),
  });
  const deliver = await adapter.deliverNotification({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    payload: {
      userId: 'alice',
      priority: 'high',
      body: 'PR #123 needs review',
    },
  });
  return { subscribe, deliver, received };
}

/**
 * Two rooms under a shared namespace — alice + bob each subscribe to
 * their own alerts room, each receives their own notifications, and
 * cross-delivery does not leak. In real Socket.io, `io.of(ns).to(room).emit`
 * scopes the broadcast to sockets that have `join`ed the specified room.
 */
export async function multiRoomNotify(adapter: NotificationAdapter): Promise<{
  receivedByAlice: NotificationEvent[];
  receivedByBob: NotificationEvent[];
}> {
  const receivedByAlice: NotificationEvent[] = [];
  const receivedByBob: NotificationEvent[] = [];
  await adapter.subscribeRoom({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    userId: 'alice',
    onNotification: (n) => receivedByAlice.push(n),
  });
  await adapter.subscribeRoom({
    namespace: NAMESPACE,
    room: 'alerts:bob',
    userId: 'bob',
    onNotification: (n) => receivedByBob.push(n),
  });
  await adapter.deliverNotification({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    payload: { userId: 'alice', priority: 'medium', body: 'stale draft' },
  });
  await adapter.deliverNotification({
    namespace: NAMESPACE,
    room: 'alerts:bob',
    payload: { userId: 'bob', priority: 'urgent', body: 'security alert' },
  });
  return { receivedByAlice, receivedByBob };
}

/**
 * Reconnect replays pending events — alice subscribes, the client is
 * taken offline via the supplied `takeOffline` hook, 3 notifications land
 * while offline (buffered on the per-room queue), and on the reconnect
 * flush all 3 are delivered to the handler in FIFO order.
 *
 * This is the Socket.io default behaviour when the server buffers events
 * for a temporarily disconnected client (or when socket.io-client
 * transitions through connect → disconnect → reconnect during a network
 * blip).
 */
export async function reconnectReplaysPending(
  adapter: NotificationAdapter,
  takeOffline: () => void,
): Promise<{
  received: NotificationEvent[];
  reconnect: Awaited<ReturnType<NotificationAdapter['simulateReconnect']>>;
  pendingAtDisconnect: PendingSnapshot;
}> {
  const received: NotificationEvent[] = [];
  await adapter.subscribeRoom({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    userId: 'alice',
    onNotification: (n) => received.push(n),
  });
  takeOffline();
  await adapter.deliverNotification({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    payload: { userId: 'alice', priority: 'low', body: 'ping 1' },
  });
  await adapter.deliverNotification({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    payload: { userId: 'alice', priority: 'low', body: 'ping 2' },
  });
  await adapter.deliverNotification({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    payload: { userId: 'alice', priority: 'low', body: 'ping 3' },
  });
  const pendingAtDisconnect = await adapter.getPending({ room: 'alerts:alice' });
  const reconnect = await adapter.simulateReconnect();
  return { received, reconnect, pendingAtDisconnect };
}

/**
 * Backpressure overflow — the client is taken offline, then 12
 * notifications are pushed against a mock configured with
 * `backpressureLimit: 8`. The first 8 land on the queue; the remaining
 * 4 overflow and are dropped (counted). On reconnect, 8 are replayed to
 * the handler and the reconnect result reports 4 dropped.
 */
export async function backpressureOverflowDrops(
  adapter: NotificationAdapter,
  takeOffline: () => void,
): Promise<{
  received: NotificationEvent[];
  reconnect: Awaited<ReturnType<NotificationAdapter['simulateReconnect']>>;
  pendingAtOverflow: PendingSnapshot;
}> {
  const received: NotificationEvent[] = [];
  await adapter.subscribeRoom({
    namespace: NAMESPACE,
    room: 'alerts:alice',
    userId: 'alice',
    onNotification: (n) => received.push(n),
  });
  takeOffline();
  for (let i = 0; i < 12; i += 1) {
    await adapter.deliverNotification({
      namespace: NAMESPACE,
      room: 'alerts:alice',
      payload: {
        userId: 'alice',
        priority: 'medium',
        body: `burst ${i}`,
      },
    });
  }
  const pendingAtOverflow = await adapter.getPending({ room: 'alerts:alice' });
  const reconnect = await adapter.simulateReconnect();
  return { received, reconnect, pendingAtOverflow };
}
