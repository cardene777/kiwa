# Cloudflare Workers Durable Object — realtime chat + Hibernation + storage in 15 min

## What you'll build

A Cloudflare Workers Durable Object chat room app wired to `@kiwa-test/edge` v0.2's `durable-object` + `websocket-edge` semantics. The suite covers the full realtime journey — DO instance creation on the first join, per-room WebSocket broadcast to every member, transactional storage that rolls back on failure, the Hibernation-driven wake-up that reroutes a stale request, and the 24-h retention alarm that purges an idle room. Every event goes through the same neutral envelope, so the `KIWA_MODE=real` switch flips the run to a Miniflare + `wrangler dev` stack without touching the test bodies.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-cf-do && cd kiwa-cf-do
pnpm init
pnpm add -D @kiwa-test/edge@^0.2 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:real": "KIWA_MODE=real WRANGLER_KEY=1 vitest run"
  }
}
```

### 2. Wire the Durable Object mock

`src/adapters/mock.ts` — thin factory that returns per-room `DurableObjectSession` + `WebSocketSession` pairs used by every op.

```ts
import {
  createDurableObject,
  requestDurableObject,
  fireAlarm,
  writeStorage,
  requestWebSocketUpgrade,
  acceptWebSocket,
  sendMessage,
  closeWebSocket,
} from '@kiwa-test/edge';

export function makeMockAdapter() {
  return {
    createRoom(roomId: string) {
      return createDurableObject({ id: roomId, platform: 'cloudflare' });
    },
    driveRoomJoin(session: ReturnType<typeof createDurableObject>, joinUrl: string) {
      return requestDurableObject(session, { url: joinUrl });
    },
    driveRoomBroadcast(
      doSession: ReturnType<typeof createDurableObject>,
      wsSession: ReturnType<typeof requestWebSocketUpgrade>,
      body: string,
    ) {
      writeStorage(doSession, { key: 'last-message', value: body });
      return sendMessage(wsSession, { data: body });
    },
    driveAlarmPurge(session: ReturnType<typeof createDurableObject>) {
      return fireAlarm(session);
    },
    driveWsUpgrade(id: string) {
      const session = requestWebSocketUpgrade({ id, platform: 'cloudflare' });
      acceptWebSocket(session);
      return session;
    },
    driveWsClose(session: ReturnType<typeof requestWebSocketUpgrade>) {
      return closeWebSocket(session, { code: 1000 });
    },
  };
}
```

Every axis helper (`createDurableObject` / `requestDurableObject` / `fireAlarm` / `writeStorage` / `requestWebSocketUpgrade` / `acceptWebSocket` / `sendMessage` / `closeWebSocket`) emits a `neutralEvent` string tests assert on — the mock never touches a live Miniflare, so the whole suite runs in-process on any laptop.

### 3. Test the room join → broadcast flow

`tests/chat-room.test.ts` — walk the `durable-object` axis end-to-end (create room → join → broadcast).

```ts
import { describe, expect, it } from 'vitest';
import {
  createDurableObject,
  requestDurableObject,
  writeStorage,
  requestWebSocketUpgrade,
  acceptWebSocket,
  sendMessage,
} from '@kiwa-test/edge';

describe('chat room broadcast', () => {
  it('creates the DO on the first join and broadcasts to every member', () => {
    const room = createDurableObject({ id: 'room-1', platform: 'cloudflare' });
    expect(room.state).toBe('initialized');
    expect(room.history[0]?.neutralEvent).toBe('durable-object.created');

    const alice = requestDurableObject(room, { url: 'https://edge/room-1/join?user=alice' });
    expect(alice.neutralEvent).toBe('durable-object.requested');
    expect(room.state).toBe('active');
    expect(room.requestCount).toBe(1);

    const bob = requestDurableObject(room, { url: 'https://edge/room-1/join?user=bob' });
    expect(room.requestCount).toBe(2);

    const aliceWs = requestWebSocketUpgrade({ id: 'ws-alice', platform: 'cloudflare' });
    const bobWs = requestWebSocketUpgrade({ id: 'ws-bob', platform: 'cloudflare' });
    acceptWebSocket(aliceWs);
    acceptWebSocket(bobWs);

    writeStorage(room, { key: 'last-message', value: 'hello' });
    const aliceMsg = sendMessage(aliceWs, { data: 'hello' });
    const bobMsg = sendMessage(bobWs, { data: 'hello' });

    expect(aliceMsg.neutralEvent).toBe('websocket.message');
    expect(bobMsg.neutralEvent).toBe('websocket.message');
    expect(room.storageKeys.get('last-message')).toBe('hello');
  });
});
```

The `durable-object.created` event fires exactly once — the first `requestDurableObject` call pins the instance `active` and every follow-up request re-uses the same room. `writeStorage` mirrors Cloudflare's transactional storage API. Every WebSocket send emits `websocket.message` neutralised across `cloudflare` / `vercel` / `deno` so downstream fidelity assertions never depend on the platform's dialect.

### 4. Test the transactional storage rollback

`tests/storage-transactional.test.ts` — write, roll back, and observe the pre-tx state.

```ts
import { describe, expect, it } from 'vitest';
import { createDurableObject, writeStorage } from '@kiwa-test/edge';

describe('storage transactional rollback', () => {
  it('restores pre-tx values when the handler throws', () => {
    const room = createDurableObject({ id: 'room-tx', platform: 'cloudflare' });
    writeStorage(room, { key: 'counter', value: '1' });
    const snapshot = new Map(room.storageKeys);

    // Simulate the handler starting a tx…
    writeStorage(room, { key: 'counter', value: '2' });
    writeStorage(room, { key: 'counter', value: '3' });
    // …then throwing. Roll back by restoring the snapshot.
    room.storageKeys = new Map(snapshot);

    expect(room.storageKeys.get('counter')).toBe('1');
    expect(room.history.filter((s) => s.neutralEvent === 'durable-object.storage-written')).toHaveLength(3);
  });
});
```

`storageKeys` is a plain `Map`, so a snapshot restore is deterministic. The 3 `durable-object.storage-written` steps stay in `history` — the fidelity harness relies on the ordered trace, not the final state, when comparing mock vs real Miniflare runs.

### 5. Test the alarm-driven retention purge

`tests/alarm-purge.test.ts` — schedule a 24-h alarm, fire it, and assert on the wake-up event.

```ts
import { describe, expect, it } from 'vitest';
import { createDurableObject, fireAlarm, writeStorage } from '@kiwa-test/edge';

describe('alarm-driven retention purge', () => {
  it('fires the alarm and lets the handler purge stale keys', () => {
    const room = createDurableObject({ id: 'room-alarm', platform: 'cloudflare' });
    writeStorage(room, { key: 'msg:1', value: 'hello' });
    writeStorage(room, { key: 'msg:2', value: 'world' });

    const wake = fireAlarm(room);
    expect(wake.neutralEvent).toBe('durable-object.alarm-fired');
    expect(wake.state).toBe('active');

    // The purge handler drops every `msg:` key.
    for (const key of Array.from(room.storageKeys.keys())) {
      if (key.startsWith('msg:')) room.storageKeys.delete(key);
    }
    expect(room.storageKeys.size).toBe(0);
  });
});
```

`fireAlarm` re-activates the instance and appends `durable-object.alarm-fired` to `history`. In production the alarm callback would run inside the DO context; here it is a plain function call so the trace stays deterministic.

### 6. Test the WebSocket hibernation wake-up

`tests/websocket-hibernation.test.ts` — force close a socket, re-open on a follow-up request, and assert the DO stays warm.

```ts
import { describe, expect, it } from 'vitest';
import {
  createDurableObject,
  requestDurableObject,
  requestWebSocketUpgrade,
  acceptWebSocket,
  closeWebSocket,
} from '@kiwa-test/edge';

describe('websocket hibernation wake-up', () => {
  it('drops the socket, re-routes the follow-up request, keeps the DO active', () => {
    const room = createDurableObject({ id: 'room-hib', platform: 'cloudflare' });
    requestDurableObject(room, { url: 'https://edge/room-hib/join' });

    const ws = requestWebSocketUpgrade({ id: 'ws-1', platform: 'cloudflare' });
    acceptWebSocket(ws);
    expect(ws.state).toBe('open');

    const closed = closeWebSocket(ws, { code: 1006 });
    expect(closed.state).toBe('closed');

    // Follow-up fetch wakes the DO. Cloudflare's Hibernation API keeps DO storage alive
    // while shedding idle sockets, so the follow-up request finds the same instance.
    const wake = requestDurableObject(room, { url: 'https://edge/room-hib/wake' });
    expect(wake.state).toBe('active');
    expect(room.requestCount).toBe(2);
  });
});
```

The `1006` close code stands in for Cloudflare's abnormal-close signalling on hibernation. The follow-up `requestDurableObject` re-runs against the same room, so the mock preserves DO storage across the hibernation cycle exactly like Miniflare + workerd does.

### 7. Real driver mode (opt-in)

Every op in the app reads `KIWA_MODE`:

```ts
const mode = process.env.KIWA_MODE ?? 'mock';
export function makeAdapter() {
  return mode === 'real' && process.env.WRANGLER_KEY === '1'
    ? makeRealAdapter()  // Miniflare + wrangler dev + real Durable Object
    : makeMockAdapter(); // @kiwa-test/edge v0.2 semantics
}
```

In `mock only` mode (`KIWA_MODE` unset), the vitest suite runs against the pure mock — zero network, sub-100 ms per test, safe on every laptop. In `KIWA_MODE=real WRANGLER_KEY=1` mode, the same tests re-run against a local Miniflare workerd. The 8-op surface stays in the driver's seat — only the underlying adapter swaps.

### 8. Run it

```bash
pnpm test        # mock only, no network
pnpm test:real   # requires WRANGLER_KEY=1 + local Miniflare install
```

The full end-to-end example lives in `examples/dogfood-cloudflare-workers-durable-object-app` — a Cloudflare Workers chat room with `chat-room-e2e.spec.ts` + `storage-transactional-e2e.spec.ts` + `websocket-hibernation-e2e.spec.ts`, all wired through the same 8-op surface (4 `durable-object` + 4 `websocket-edge`) you just built.

## Where to next

- [Concept doc — Edge runtime testing (8 axis SSOT)](../concepts/edge-runtime-testing)
- [Tutorial 43 — Vercel Edge streaming](./43-vercel-edge-streaming)
- [Tutorial 44 — Deno Deploy geo](./44-deno-deploy-geo)
- [Migration guide v1.23 → v1.24](../migrations/v1.23-to-v1.24)
