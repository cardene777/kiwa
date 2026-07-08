import {
  createSocketioMock,
  type SocketIoMock,
  type SubscriptionHandle,
} from '@kiwa/realtime';
import type {
  NotificationAdapter,
  NotificationEvent,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — drives the `@kiwa/realtime` Socket.io mock so the
 * same app code exercises {@link SocketIoMock} without touching a real
 * Socket.io server (or the SSE endpoint).
 *
 * The mock returns deterministic behaviour so fidelity tests can assert on
 * notification delivery ordering, reconnect + pending-event replay
 * semantics and backpressure overflow. Because the mock never opens a
 * socket, tests can also assert on the exact number of network-visible
 * events the app would generate, which is what the real Socket.io
 * implementation charges for (message count + reconnect penalty).
 *
 * The mock config exposes `backpressureLimit` — when the client is
 * offline (between `disconnectClient` and the next `simulateReconnect`),
 * notifications pushed via `deliverNotification` are buffered on a
 * per-room queue; overflows are dropped and counted. This matches
 * Socket.io's built-in behaviour where the server holds pending messages
 * up to a bounded buffer before dropping the disconnected client entirely.
 *
 * Delivery routing note. The adapter subscribes directly to the engine
 * channel `{namespace}|{room}` rather than routing through the socketio
 * `client.of(ns).to(room).emit` façade. The façade's client-side sockets
 * are namespace-keyed singletons — two callers under the same namespace
 * would share one socket and one merged `on('notify', ...)` handler chain,
 * so `.to(room)` scoping would leak across rooms. Real Socket.io does not
 * have this issue because each user opens their own client socket; the
 * mock's per-namespace singleton is a design choice to keep the surface
 * small. Subscribing at the engine layer sidesteps this and matches the
 * production routing invariant `room A delivery only reaches room A
 * subscribers`.
 */
export interface MakeMockAdapterOptions {
  /**
   * How many pending events a room may buffer while offline before
   * additional events are dropped. Default = 8 so backpressure tests can
   * assert overflow deterministically.
   */
  backpressureLimit?: number;
}

/**
 * The mock adapter exposes one extra test-only method beyond the
 * provider-neutral {@link NotificationAdapter} contract —
 * {@link disconnectClient} — which lets the fidelity harness prime the
 * offline queue for backpressure / reconnect-replay tests. The real
 * adapter does not expose this method; instead, real-mode offline is
 * driven by dropping the socket at the network level (kill server,
 * throttle NIC etc.).
 */
export interface MockNotificationAdapter extends NotificationAdapter {
  readonly mode: 'mock';
  /**
   * Take the client offline without triggering a reconnect. Subsequent
   * `deliverNotification` calls buffer into the per-room queue until
   * {@link NotificationAdapter.simulateReconnect} flushes them (or
   * drops on backpressure overflow).
   */
  disconnectClient(): void;
  /** Whether the client is currently online. */
  isConnected(): boolean;
}

interface BufferedEvent {
  namespace: string;
  room: string;
  event: NotificationEvent;
}

interface RoomSubscription {
  namespace: string;
  room: string;
  onNotification: ((n: NotificationEvent) => void) | undefined;
  handle: SubscriptionHandle;
}

function normalizeChannel(namespace: string, room: string): string {
  return `${namespace}|${room}`;
}

export function makeMockAdapter(
  options: MakeMockAdapterOptions = {},
): MockNotificationAdapter {
  // The mock server is a single-process instance (matching the mock config
  // trade-off — Redis adapter production semantics are cross-server, but
  // fidelity is measured on single-server behaviour per the AC).
  const client: SocketIoMock = createSocketioMock({
    artificialLatencyMs: 3,
    provider: 'socketio-mock',
  });
  const trace: TraceEvent[] = [];
  // room -> subscription state (keyed on room; unsubscribe on reset).
  const subscriptions = new Map<string, RoomSubscription>();
  // room -> buffered event queue (while offline).
  const pendingByRoom = new Map<string, BufferedEvent[]>();
  // room -> dropped event count (backpressure overflow).
  const droppedByRoom = new Map<string, number>();
  const backpressureLimit = options.backpressureLimit ?? 8;
  let requestCount = 0;
  let reconnectCount = 0;
  let connected = true;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensurePending(room: string): BufferedEvent[] {
    let queue = pendingByRoom.get(room);
    if (!queue) {
      queue = [];
      pendingByRoom.set(room, queue);
    }
    return queue;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async subscribeRoom(input) {
      const start = Date.now();
      const channel = normalizeChannel(input.namespace, input.room);
      // Subscribe at the engine layer so each room gets its own dedicated
      // handler chain (see mock.ts § Delivery routing note for why we
      // sidestep the socketio façade).
      const handle = await client.subscribe(channel, (event) => {
        if (event.kind !== 'broadcast') return;
        if (event.event !== 'notify') return;
        const n = event.payload as NotificationEvent | undefined;
        if (n && input.onNotification) input.onNotification(n);
      });
      subscriptions.set(input.room, {
        namespace: input.namespace,
        room: input.room,
        onNotification: input.onNotification,
        handle,
      });
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      record('subscribeRoom', true, {
        detail: { namespace: input.namespace, room: input.room },
      });
      return {
        namespace: input.namespace,
        room: input.room,
        subscribed: true,
        latencyMs,
      };
    },

    async deliverNotification(input) {
      const start = Date.now();
      const event: NotificationEvent = {
        id: `notif_${Math.random().toString(36).slice(2, 10)}`,
        userId: input.payload.userId,
        priority: input.payload.priority,
        body: input.payload.body,
        // Wall-clock timestamp so real / mock payload shapes stay
        // comparable when the SDK is wired.
        timestamp: Date.now(),
      };
      if (!connected) {
        // Offline — buffer the event into the room queue, unless the
        // queue is at the backpressure limit (in which case the event
        // is dropped and counted).
        const queue = ensurePending(input.room);
        if (queue.length >= backpressureLimit) {
          droppedByRoom.set(input.room, (droppedByRoom.get(input.room) ?? 0) + 1);
          record('deliverNotification', false, {
            errorKind: 'BACKPRESSURE_DROP',
            detail: { room: input.room, queued: queue.length },
          });
          const latencyMs = Math.max(0, Date.now() - start);
          return {
            room: input.room,
            eventId: event.id,
            bufferedWhileOffline: false,
            latencyMs,
          };
        }
        queue.push({ namespace: input.namespace, room: input.room, event });
        record('deliverNotification', true, {
          detail: { room: input.room, buffered: true, queued: queue.length },
        });
        const latencyMs = Math.max(0, Date.now() - start);
        return {
          room: input.room,
          eventId: event.id,
          bufferedWhileOffline: true,
          latencyMs,
        };
      }
      // Online — publish directly to the engine channel `namespace|room`.
      // Only subscribers of that channel receive the delivery, so
      // multi-room delivery stays scoped and the on-connected path is
      // awaited (unlike `client.of(ns).to(room).emit`, which fires a
      // floating publish).
      await client.publish(normalizeChannel(input.namespace, input.room), 'notify', event);
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      record('deliverNotification', true, {
        detail: { room: input.room, buffered: false },
      });
      return {
        room: input.room,
        eventId: event.id,
        bufferedWhileOffline: false,
        latencyMs,
      };
    },

    async simulateReconnect() {
      // If we're already offline (primed by disconnectClient), the flush
      // step below will replay whatever landed in the queue. If we're
      // online, this is a no-op reconnect that still increments the
      // reconnect counter so telemetry stays honest.
      const beforeDropped = Array.from(droppedByRoom.values()).reduce(
        (sum, n) => sum + n,
        0,
      );
      // Ensure the client is flipped back online for the flush.
      connected = true;
      reconnectCount += 1;
      let replayed = 0;
      for (const [room, queue] of pendingByRoom) {
        const sub = subscriptions.get(room);
        if (!sub || !sub.onNotification) {
          // No subscriber wired — cannot deliver, drop the queue and count.
          droppedByRoom.set(
            room,
            (droppedByRoom.get(room) ?? 0) + queue.length,
          );
          queue.length = 0;
          continue;
        }
        for (const buffered of queue) {
          sub.onNotification(buffered.event);
          replayed += 1;
        }
        queue.length = 0;
      }
      const afterDropped = Array.from(droppedByRoom.values()).reduce(
        (sum, n) => sum + n,
        0,
      );
      record('simulateReconnect', true, {
        detail: {
          replayed,
          droppedDelta: afterDropped - beforeDropped,
        },
      });
      return {
        replayedCount: replayed,
        droppedByBackpressure: afterDropped - beforeDropped,
        reconnectCount,
      };
    },

    async getPending(input) {
      const queue = pendingByRoom.get(input.room) ?? [];
      const dropped = droppedByRoom.get(input.room) ?? 0;
      record('getPending', true, {
        detail: { room: input.room, queued: queue.length, dropped },
      });
      return {
        room: input.room,
        queuedCount: queue.length,
        droppedCount: dropped,
      };
    },

    metrics() {
      const m = client.getMetrics();
      return {
        subscribeCount: m.subscribeCount,
        publishCount: m.publishCount,
        eventsDelivered: m.eventsDelivered,
        eventsDropped:
          m.eventsDropped +
          Array.from(droppedByRoom.values()).reduce((sum, n) => sum + n, 0),
        reconnectCount: m.reconnectCount + reconnectCount,
        subscribeLatencySamplesMs: [...m.subscribeLatencyMs],
        publishLatencySamplesMs: [...m.publishLatencyMs],
        requests: requestCount,
      };
    },

    disconnectClient() {
      connected = false;
      record('disconnectClient', true);
    },

    isConnected() {
      return connected;
    },

    async reset() {
      for (const [, sub] of subscriptions) {
        await sub.handle.unsubscribe();
      }
      subscriptions.clear();
      pendingByRoom.clear();
      droppedByRoom.clear();
      client.reset();
      trace.length = 0;
      requestCount = 0;
      reconnectCount = 0;
      connected = true;
    },
  };
}
