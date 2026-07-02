# Socket.io notification + reconnect + pending replay + backpressure

## What you'll build

A single vitest test file that drives a small notification service through **four Socket.io surfaces** — a per-room subscription with namespace + room routing, a server-side push, a disconnect → reconnect cycle that replays pending events in FIFO order, and a bounded backpressure queue that drops overflow deterministically — using `@kiwa-test/realtime`'s `createSocketioMock`. The same test file also works against a real Socket.io / SSE server when `SOCKETIO_URL` is set, so the fidelity harness can diff mock vs real behaviour.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-socketio-notification && cd kiwa-socketio-notification
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-test/realtime
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Create `src/mock-adapter.ts` — a provider-neutral notification surface backed by the kiwa mock. The adapter also exposes a test-only `disconnectClient()` method so tests can prime the pending queue without a real network drop:

```ts
import {
  createSocketioMock,
  type SocketIoMock,
  type SubscriptionHandle,
} from '@kiwa-test/realtime';

/** A notification event pushed by the server. */
export interface NotificationEvent {
  id: string;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  body: string;
  timestamp: number;
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

/**
 * Provider-neutral notification surface. The tests below drive this surface
 * only — a real-mode implementation swaps `SocketIoMock` for
 * `socket.io-client` without touching the flows.
 *
 * The `disconnectClient()` and `isConnected()` methods are test-only —
 * real-mode offline is driven by dropping the socket at the network level.
 */
export interface NotificationService {
  subscribeRoom(input: {
    namespace: string;
    room: string;
    userId: string;
    onNotification?: (n: NotificationEvent) => void;
  }): Promise<{ subscribed: boolean }>;
  deliverNotification(input: {
    namespace: string;
    room: string;
    payload: Omit<NotificationEvent, 'id' | 'timestamp'>;
  }): Promise<{ bufferedWhileOffline: boolean; eventId: string }>;
  getPending(input: {
    room: string;
  }): Promise<{ queuedCount: number; droppedCount: number }>;
  simulateReconnect(): Promise<{
    replayedCount: number;
    droppedByBackpressure: number;
  }>;
  disconnectClient(): void;
  isConnected(): boolean;
  reset(): Promise<void>;
}

function normalizeChannel(namespace: string, room: string): string {
  return `${namespace}|${room}`;
}

export function makeNotificationService(options: {
  backpressureLimit?: number;
} = {}): NotificationService {
  const client: SocketIoMock = createSocketioMock({
    artificialLatencyMs: 3,
    provider: 'socketio-mock',
  });
  const subscriptions = new Map<string, RoomSubscription>();
  const pendingByRoom = new Map<string, BufferedEvent[]>();
  const droppedByRoom = new Map<string, number>();
  const backpressureLimit = options.backpressureLimit ?? 8;
  let connected = true;

  function ensurePending(room: string): BufferedEvent[] {
    let queue = pendingByRoom.get(room);
    if (!queue) {
      queue = [];
      pendingByRoom.set(room, queue);
    }
    return queue;
  }

  return {
    async subscribeRoom(input) {
      const channel = normalizeChannel(input.namespace, input.room);
      // Subscribe at the engine layer so each room gets its own handler
      // chain — subscribing via `client.of(ns).to(room)` would leak across
      // rooms because namespace sockets are singletons (see dogfood mock.ts
      // § Delivery routing note).
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
      return { subscribed: true };
    },

    async deliverNotification(input) {
      const event: NotificationEvent = {
        id: `notif_${Math.random().toString(36).slice(2, 10)}`,
        userId: input.payload.userId,
        priority: input.payload.priority,
        body: input.payload.body,
        timestamp: Date.now(),
      };
      if (!connected) {
        const queue = ensurePending(input.room);
        if (queue.length >= backpressureLimit) {
          droppedByRoom.set(input.room, (droppedByRoom.get(input.room) ?? 0) + 1);
          return { bufferedWhileOffline: false, eventId: event.id };
        }
        queue.push({ namespace: input.namespace, room: input.room, event });
        return { bufferedWhileOffline: true, eventId: event.id };
      }
      await client.publish(normalizeChannel(input.namespace, input.room), 'notify', event);
      return { bufferedWhileOffline: false, eventId: event.id };
    },

    async getPending(input) {
      const queue = pendingByRoom.get(input.room) ?? [];
      const dropped = droppedByRoom.get(input.room) ?? 0;
      return { queuedCount: queue.length, droppedCount: dropped };
    },

    async simulateReconnect() {
      const beforeDropped = Array.from(droppedByRoom.values()).reduce((s, n) => s + n, 0);
      connected = true;
      let replayed = 0;
      for (const [room, queue] of pendingByRoom) {
        const sub = subscriptions.get(room);
        if (!sub || !sub.onNotification) {
          droppedByRoom.set(room, (droppedByRoom.get(room) ?? 0) + queue.length);
          queue.length = 0;
          continue;
        }
        for (const buffered of queue) {
          sub.onNotification(buffered.event);
          replayed += 1;
        }
        queue.length = 0;
      }
      const afterDropped = Array.from(droppedByRoom.values()).reduce((s, n) => s + n, 0);
      return {
        replayedCount: replayed,
        droppedByBackpressure: afterDropped - beforeDropped,
      };
    },

    disconnectClient() {
      connected = false;
    },

    isConnected() {
      return connected;
    },

    async reset() {
      for (const [, sub] of subscriptions) await sub.handle.unsubscribe();
      subscriptions.clear();
      pendingByRoom.clear();
      droppedByRoom.clear();
      client.reset();
      connected = true;
    },
  };
}
```

Add `tests/notify.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  makeNotificationService,
  type NotificationEvent,
  type NotificationService,
} from '../src/mock-adapter.js';

let service: NotificationService;

beforeEach(() => {
  service = makeNotificationService({ backpressureLimit: 8 });
});

afterEach(async () => {
  await service.reset();
});

describe('socket.io notification — mock', () => {
  it('delivers a notification to the subscribed room handler', async () => {
    const received: NotificationEvent[] = [];
    await service.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:alice',
      userId: 'alice',
      onNotification: (n) => received.push(n),
    });
    const deliver = await service.deliverNotification({
      namespace: '/notify',
      room: 'alerts:alice',
      payload: { userId: 'alice', priority: 'high', body: 'PR #123 needs review' },
    });

    expect(deliver.bufferedWhileOffline).toBe(false);
    expect(received).toHaveLength(1);
    expect(received[0]?.body).toBe('PR #123 needs review');
    expect(received[0]?.id).toBe(deliver.eventId);
  });

  it('scopes delivery per room (no cross-leak between two subscribers on the same namespace)', async () => {
    const aliceReceived: NotificationEvent[] = [];
    const bobReceived: NotificationEvent[] = [];
    await service.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:alice',
      userId: 'alice',
      onNotification: (n) => aliceReceived.push(n),
    });
    await service.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:bob',
      userId: 'bob',
      onNotification: (n) => bobReceived.push(n),
    });
    await service.deliverNotification({
      namespace: '/notify',
      room: 'alerts:alice',
      payload: { userId: 'alice', priority: 'medium', body: 'for alice' },
    });
    await service.deliverNotification({
      namespace: '/notify',
      room: 'alerts:bob',
      payload: { userId: 'bob', priority: 'urgent', body: 'for bob' },
    });

    expect(aliceReceived).toHaveLength(1);
    expect(bobReceived).toHaveLength(1);
    expect(aliceReceived[0]?.userId).toBe('alice');
    expect(bobReceived[0]?.userId).toBe('bob');
  });

  it('buffers 3 events while offline and replays them on reconnect in FIFO order', async () => {
    const received: NotificationEvent[] = [];
    await service.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:carol',
      userId: 'carol',
      onNotification: (n) => received.push(n),
    });
    service.disconnectClient();
    for (let i = 1; i <= 3; i += 1) {
      await service.deliverNotification({
        namespace: '/notify',
        room: 'alerts:carol',
        payload: { userId: 'carol', priority: 'low', body: `ping ${i}` },
      });
    }
    const pending = await service.getPending({ room: 'alerts:carol' });
    expect(pending.queuedCount).toBe(3);
    expect(pending.droppedCount).toBe(0);
    // No delivery until reconnect.
    expect(received).toHaveLength(0);

    const reconnect = await service.simulateReconnect();
    expect(reconnect.replayedCount).toBe(3);
    expect(reconnect.droppedByBackpressure).toBe(0);
    expect(received.map((n) => n.body)).toEqual(['ping 1', 'ping 2', 'ping 3']);
  });

  it('drops overflow events at backpressureLimit=8 (12 in, 8 replayed, 4 dropped)', async () => {
    const received: NotificationEvent[] = [];
    await service.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:dave',
      userId: 'dave',
      onNotification: (n) => received.push(n),
    });
    service.disconnectClient();
    for (let i = 0; i < 12; i += 1) {
      await service.deliverNotification({
        namespace: '/notify',
        room: 'alerts:dave',
        payload: { userId: 'dave', priority: 'medium', body: `burst ${i}` },
      });
    }
    const pending = await service.getPending({ room: 'alerts:dave' });
    // The 8th event is the last that fits; events 9-12 overflow.
    expect(pending.queuedCount).toBe(8);
    expect(pending.droppedCount).toBe(4);

    const reconnect = await service.simulateReconnect();
    // 8 replay to the handler; 4 stay counted as dropped.
    expect(reconnect.replayedCount).toBe(8);
    expect(received).toHaveLength(8);
    expect(received.map((n) => n.body)).toEqual([
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

  it('deliverNotification while offline reports bufferedWhileOffline=true', async () => {
    await service.subscribeRoom({
      namespace: '/notify',
      room: 'alerts:erin',
      userId: 'erin',
    });
    service.disconnectClient();
    const result = await service.deliverNotification({
      namespace: '/notify',
      room: 'alerts:erin',
      payload: { userId: 'erin', priority: 'low', body: 'offline ping' },
    });
    expect(result.bufferedWhileOffline).toBe(true);
  });
});
```

Run:

```bash
pnpm test
```

You should see five passing tests in under a second.

## Explanation

- `createSocketioMock` returns a client whose `subscribe(channel, handler) / publish(channel, event, payload) / of(ns).to(room).emit(...)` shape is a superset of `socket.io-client` — the tutorial subscribes at the **engine layer** (`client.subscribe(normalizeChannel(ns, room), handler)`) rather than through the `of(ns)` façade because the mock's namespace sockets are singletons. Two callers under the same namespace would share one socket and one merged handler chain, so `.to(room)` scoping would leak across rooms. Subscribing at the engine layer sidesteps this and matches the production invariant "room A delivery reaches only room A subscribers". See the dogfood app's [`mock.ts` § Delivery routing note](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/adapters/mock.ts) for the full rationale.
- **Namespace + room** is Socket.io's 2-level routing. Supabase / Ably / Pusher use single channel strings; Socket.io splits into `/notify` (namespace) + `alerts:alice` (room). The tutorial normalises them into an engine channel key (`${namespace}|${room}`) so the mock engine can validate ordering, backpressure, and reconnect replay without a real server. Real Socket.io production still routes at the 2-level surface — the normalisation is a mock-side implementation detail.
- The **disconnect → buffered → reconnect → replay** cycle is the reason Socket.io ships a message buffer at all. Real Socket.io holds pending server-side messages for a bounded window while the client's socket is dropped, then flushes them on reconnect. The tutorial's `deliverNotification` mirrors this — when `connected === false`, the event is pushed to `pendingByRoom[room]` instead of being published; `simulateReconnect()` walks every pending queue and invokes the subscribed handler in FIFO order. The exact assertion `expect(received.map(...)).toEqual(['ping 1', 'ping 2', 'ping 3'])` is what makes the mock valuable — real Socket.io does not expose the pending queue for direct inspection.
- **Backpressure overflow** is what happens when the pending queue fills. `backpressureLimit: 8` means the 9th offline delivery is dropped and counted. Real Socket.io drops the client entirely at some threshold (server-configurable) — the mock's per-room `droppedByRoom` counter is a cleaner surface for testing. The `pendingAtOverflow.droppedCount === 4` assertion for 12 in / 8 fit is exact by construction.

## Real-vs-mock fidelity (optional)

The dogfood app at `examples/dogfood-socketio-notification/` (see [`src/adapters/interface.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/adapters/interface.ts) + [`src/adapters/mock.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/adapters/mock.ts) + [`src/adapters/real.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/adapters/real.ts)) wraps the same four ops behind a `NotificationAdapter` interface with a `TraceEvent[]` buffer so the fidelity harness can diff mock vs real trace events. The `quality-report/fidelity-latest.md` snapshot records delivery-count / buffered-count / dropped-count / reconnect divergence — those axes feed the release gate's `fidelity.ratio` axis via [`buildRealtimeReport`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts).

Real-mode envs.

- `SOCKETIO_URL` — required (e.g. `http://localhost:3000`). Without it, `makeRealAdapter()` reports `SOCKETIO_ENV_MISSING`.
- `SOCKETIO_NAMESPACE` — optional. Defaults to `/notify`.
- `SOCKETIO_TRANSPORT` — optional. `socketio` (default) or `sse` to switch to the SSE endpoint at `{SOCKETIO_URL}/notify/sse`.

When `SOCKETIO_URL` is set but `socket.io-client` is not installed (the default in the kiwa workspace), the adapter downgrades to `SOCKETIO_SDK_MISSING` — the same fidelity path, one level closer to real IO.

## Troubleshoot

- **`replayedCount` is 0 after `simulateReconnect`** — The room's subscription registered no `onNotification` handler. `simulateReconnect` drops queued events when no handler is wired (and counts them as dropped). Re-check that `subscribeRoom({ ..., onNotification })` was called before `disconnectClient()`.
- **Events replay to the wrong room** — The mock keys pending queues by `room` alone (not `namespace|room`). If your app uses the same `room` string across two namespaces, the queues will merge. Use unique room strings per namespace (`alerts:alice` vs `alerts:alice:premium`) or extend the mock to key by `namespace|room` if you need cross-namespace isolation.
- **`droppedCount` is 0 even after overflow** — The backpressure counter only increments when `deliverNotification` is called while offline **and** the queue is already at the limit. Calling it while online (or when the queue has room) does not increment. Print the sequence: `disconnectClient` → 8 successful buffers (queuedCount 1..8) → 9th delivery increments droppedCount.
- **`simulateReconnect` does not fire the handler even after adding one** — The handler is captured *at `subscribeRoom` time*. Adding a handler after the fact requires re-subscribing (unsubscribe → subscribeRoom with the new handler). Match real Socket.io behaviour — you cannot mutate a socket's event handlers post-attach.
- **`bufferedWhileOffline` is `false` for an offline delivery** — The queue was already at the limit — the event was dropped, not buffered. Check `getPending().droppedCount` to confirm.

## Next steps

- The [realtime testing concept guide](../concepts/realtime-testing.md) explains the 5 time-axis semantics (order / timing / drop / reconnect / backpressure) and why event-stream tests need them.
- The dogfood app has a `backpressureOverflowDrops` flow ([`src/flows/notification-flows.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/flows/notification-flows.ts)) that exercises the exact 12-in-8-fit scenario — useful for stress-testing your own backpressure limits.
- [Migration v1.12 → v1.13](../migrations/v1.12-to-v1.13.md) covers the full v1.13 milestone including the perf harness and the fidelity harness API surface.
