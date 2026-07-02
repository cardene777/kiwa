/**
 * Provider-neutral notification service surface for the dogfood app.
 *
 * The app talks to Socket.io (and SSE as an alternative path) only through
 * this interface. Two implementations exist — {@link makeRealAdapter}
 * (would call `socket.io-client` when `SOCKETIO_URL` is set, otherwise
 * reports each method as `SOCKETIO_ENV_MISSING`) and {@link makeMockAdapter}
 * (backed by `@kiwa-test/realtime`'s {@link createSocketioMock}). Both must
 * satisfy the same contract so behavioural fidelity between real vs mock
 * can be measured side-by-side and fed to `@kiwa-test/quality-metrics`
 * release gate.
 *
 * The 4 ops are chosen so Socket.io + SSE's notification difficulty surface
 * is observable end-to-end ...
 *
 * - `subscribeRoom` — join a namespace + room (`/notify` + `alerts:{userId}`)
 *   and register a handler for incoming notifications. Presence for a room
 *   is roll-up so multi-tab clients register once per userId.
 * - `deliverNotification` — server-side push a notification to a room. The
 *   payload carries priority + id + body so re-delivery on reconnect can
 *   dedupe.
 * - `simulateReconnect` — disconnect + reconnect the client. Events emitted
 *   while disconnected must be replayed in FIFO order (pending event queue),
 *   subject to `backpressureLimit` on overflow. This is the mock difficulty
 *   the real Socket.io server handles with a message buffer.
 * - `getPending` — snapshot the number of events currently queued (0 when
 *   connected). Used by backpressure tests to assert overflow behaviour
 *   deterministically.
 */

/** A notification event pushed by the server. */
export interface NotificationEvent {
  id: string;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  body: string;
  /** Wall-clock server timestamp (ms). */
  timestamp: number;
}

/** Result of subscribing to a room. */
export interface SubscribeRoomResult {
  namespace: string;
  room: string;
  subscribed: boolean;
  latencyMs: number;
}

/**
 * Result of a server-side notification push. Captures whether the push
 * landed on a connected socket or was buffered for a disconnected one.
 */
export interface DeliverResult {
  room: string;
  eventId: string;
  bufferedWhileOffline: boolean;
  latencyMs: number;
}

/**
 * Reconnect result — captures how many pending events were replayed on
 * reconnect and how many were dropped due to backpressure overflow.
 */
export interface ReconnectResult {
  replayedCount: number;
  droppedByBackpressure: number;
  reconnectCount: number;
}

/** Snapshot of pending events queued while the client is offline. */
export interface PendingSnapshot {
  room: string;
  queuedCount: number;
  droppedCount: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Notification-service adapter — the app performs 4 ops:
 *
 * - `subscribeRoom` — join a namespace + room and register a notification
 *   handler.
 * - `deliverNotification` — server-side push a notification to a room.
 *   Notifications sent while the client is disconnected are buffered
 *   (Socket.io's default behaviour) and replayed on reconnect, subject to
 *   the backpressure queue limit.
 * - `simulateReconnect` — disconnect + reconnect the client, flushing the
 *   pending event queue in FIFO order. Overflows are dropped and counted.
 * - `getPending` — snapshot the pending queue depth for a room. Used to
 *   assert backpressure overflow deterministically.
 */
export interface NotificationAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /** Subscribe to a namespace + room and register a notification handler. */
  subscribeRoom(input: {
    namespace: string;
    room: string;
    userId: string;
    onNotification?: (n: NotificationEvent) => void;
  }): Promise<SubscribeRoomResult>;

  /**
   * Server-side push a notification to a room. When the client is
   * disconnected, the payload is buffered until the next
   * {@link simulateReconnect}. When the pending queue exceeds the
   * configured backpressure limit, the payload is dropped and counted.
   */
  deliverNotification(input: {
    namespace: string;
    room: string;
    payload: Omit<NotificationEvent, 'id' | 'timestamp'>;
  }): Promise<DeliverResult>;

  /**
   * Disconnect + reconnect the client. Any events queued while offline
   * are replayed to the room handlers in FIFO order (up to the backpressure
   * limit). The returned counts are what the test suite asserts on.
   */
  simulateReconnect(): Promise<ReconnectResult>;

  /** Snapshot pending queue depth for a room (0 when connected). */
  getPending(input: { room: string }): Promise<PendingSnapshot>;

  /** Rolling metric aggregate for the fidelity harness. */
  metrics(): {
    subscribeCount: number;
    publishCount: number;
    eventsDelivered: number;
    eventsDropped: number;
    reconnectCount: number;
    subscribeLatencySamplesMs: number[];
    publishLatencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
