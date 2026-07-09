# Supabase Realtime chat + presence + typing debounce

## What you'll build

A single vitest test file that drives a small chat app through **three Supabase Realtime surfaces** — a broadcast on a room channel, a two-user presence roll-up, and a 500 ms typing-indicator debounce — using `@kiwa-lab/realtime`'s `createSupabaseRealtimeMock`. The same test file also works against real Supabase Realtime when `SUPABASE_URL` + `SUPABASE_ANON_KEY` are set, so the fidelity harness can diff mock vs real behaviour.

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` (the snippets use pnpm; npm works too)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-supabase-realtime-chat && cd kiwa-supabase-realtime-chat
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/realtime
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

Create `src/mock-adapter.ts` — a small provider-neutral chat surface backed by the kiwa mock:

```ts
import {
  createSupabaseRealtimeMock,
  type SupabaseChannel,
  type SupabaseMock,
} from '@kiwa-lab/realtime';

/** A chat message delivered on a room channel. */
export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

/**
 * Provider-neutral chat surface. The tests below drive this surface only —
 * a real-mode implementation swaps `SupabaseMock` for `SupabaseClient` from
 * `@supabase/supabase-js` without touching the flows.
 */
export interface ChatRoom {
  joinRoom(input: {
    channel: string;
    userId: string;
    onMessage?: (m: ChatMessage) => void;
  }): Promise<{ subscribed: boolean }>;
  sendMessage(input: {
    channel: string;
    userId: string;
    text: string;
  }): Promise<{ ok: boolean }>;
  getPresence(input: { channel: string }): Promise<{ members: string[] }>;
  sendTyping(input: {
    channel: string;
    userId: string;
    keystrokeIntervalsMs: number[];
  }): Promise<{ emitted: number; suppressed: number }>;
  reset(): Promise<void>;
}

export function makeChatRoom(): ChatRoom {
  const client: SupabaseMock = createSupabaseRealtimeMock({
    artificialLatencyMs: 3,
    provider: 'supabase-mock',
  });
  const openChannels = new Map<string, SupabaseChannel>();
  const membersByChannel = new Map<string, Set<string>>();

  function ensurePresence(channel: string): Set<string> {
    let s = membersByChannel.get(channel);
    if (!s) {
      s = new Set();
      membersByChannel.set(channel, s);
    }
    return s;
  }

  return {
    async joinRoom(input) {
      const channel = client.channel(input.channel);
      if (input.onMessage) {
        channel.on('broadcast', { event: 'chat' }, (payload) => {
          const raw = payload.payload as ChatMessage | undefined;
          if (raw) input.onMessage?.(raw);
        });
      }
      await channel.subscribe();
      await channel.track({ userId: input.userId, joinedAt: Date.now() });
      ensurePresence(input.channel).add(input.userId);
      openChannels.set(input.channel, channel);
      return { subscribed: true };
    },

    async sendMessage(input) {
      const channel = openChannels.get(input.channel);
      if (!channel) return { ok: false };
      const msg: ChatMessage = {
        id: `msg_${Math.random().toString(36).slice(2, 10)}`,
        userId: input.userId,
        text: input.text,
        timestamp: Date.now(),
      };
      const res = await channel.send({
        type: 'broadcast',
        event: 'chat',
        payload: msg,
      });
      return { ok: res === 'ok' };
    },

    async getPresence(input) {
      return { members: Array.from(ensurePresence(input.channel)) };
    },

    async sendTyping(input) {
      const channel = openChannels.get(input.channel);
      if (!channel) return { emitted: 0, suppressed: 0 };
      // 500 ms typing debounce — the first keystroke always emits, subsequent
      // keystrokes within the window are suppressed. The engine broadcasts
      // one `typing` event per emission.
      const debounceWindow = 500;
      let emitted = 0;
      let suppressed = 0;
      let lastEmitAt = -Infinity;
      let cursor = 0;
      for (const gap of input.keystrokeIntervalsMs) {
        cursor += gap;
        if (cursor - lastEmitAt >= debounceWindow) {
          await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId: input.userId, at: cursor },
          });
          emitted += 1;
          lastEmitAt = cursor;
        } else {
          suppressed += 1;
        }
      }
      return { emitted, suppressed };
    },

    async reset() {
      for (const [, ch] of openChannels) await ch.unsubscribe();
      openChannels.clear();
      membersByChannel.clear();
      client.reset();
    },
  };
}
```

Add `tests/chat.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeChatRoom, type ChatMessage, type ChatRoom } from '../src/mock-adapter.js';

let room: ChatRoom;

beforeEach(() => {
  room = makeChatRoom();
});

afterEach(async () => {
  await room.reset();
});

describe('supabase-realtime chat — mock', () => {
  it('broadcasts a chat message and lists the sender in presence', async () => {
    const received: ChatMessage[] = [];
    await room.joinRoom({
      channel: 'room:demo',
      userId: 'alice',
      onMessage: (m) => received.push(m),
    });
    const send = await room.sendMessage({
      channel: 'room:demo',
      userId: 'alice',
      text: 'Hi Bob!',
    });
    const presence = await room.getPresence({ channel: 'room:demo' });

    expect(send.ok).toBe(true);
    expect(presence.members).toContain('alice');
  });

  it('rolls up presence for two users on the same room', async () => {
    await room.joinRoom({ channel: 'room:demo', userId: 'alice' });
    await room.joinRoom({ channel: 'room:demo', userId: 'bob' });
    const presence = await room.getPresence({ channel: 'room:demo' });

    expect(presence.members.sort()).toEqual(['alice', 'bob']);
  });

  it('debounces 11 keystrokes at 50 ms intervals down to 2 broadcasts', async () => {
    await room.joinRoom({ channel: 'room:demo', userId: 'carol' });
    // Total keystroke window = 550 ms. Debounce = 500 ms — first keystroke
    // emits (cursor = 50 ms) and the 500 ms threshold is crossed exactly
    // once more within the window (cursor = 550 ms). Anything else is
    // suppressed.
    const typing = await room.sendTyping({
      channel: 'room:demo',
      userId: 'carol',
      keystrokeIntervalsMs: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    });

    expect(typing.emitted).toBe(2);
    expect(typing.suppressed).toBe(9);
  });

  it('sendMessage on an un-joined channel reports ok=false', async () => {
    const send = await room.sendMessage({
      channel: 'room:orphan',
      userId: 'alice',
      text: 'noop',
    });
    expect(send.ok).toBe(false);
  });
});
```

Run:

```bash
pnpm test
```

You should see four passing tests in under a second.

## Explanation

- `createSupabaseRealtimeMock` returns a client whose `channel().on().subscribe() / send() / track()` shape matches `@supabase/supabase-js`. The mock is deterministic — subscribing to `broadcast: { event: 'chat' }` and then calling `channel.send({ type: 'broadcast', event: 'chat', payload: ... })` delivers the payload to the subscribed handler synchronously, with the mock's `artificialLatencyMs` (3 ms here) as the only wall-clock delay.
- Presence is a first-class semantic in the mock — `channel.track({ userId })` populates a per-channel member set, and `channel.on('presence', { event: 'sync' | 'join' | 'leave' }, ...)` receives the transitions. The tutorial's `getPresence` reads the local mirror because presence transitions land asynchronously; the dogfood app at [`examples/dogfood-supabase-realtime-chat/src/adapters/mock.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-supabase-realtime-chat/src/adapters/mock.ts) wires the full `on('presence', ...)` handler chain if you need snapshot-driven presence.
- The 500 ms typing debounce is **an app-layer concern** — Supabase Realtime (and Ably / Pusher / Socket.io) does not ship built-in debounce. The tutorial's `sendTyping` implements the standard "first keystroke emits + subsequent keystrokes suppressed within the window" pattern; the assertion (`emitted === 2` for 11 keystrokes at 50 ms) is exact because the mock's timeline is discrete + synchronous.
- Because the mock never opens a socket, tests can assert on the *exact* number of network-visible events — real Supabase measures this vaguely (message bill from the dashboard, days later). This is the v1.13 concept doc's [drop + backpressure axis](../concepts/realtime-testing) applied at the app layer.

## Real-vs-mock fidelity (optional)

The dogfood app at `examples/dogfood-supabase-realtime-chat/` (see [`src/adapters/interface.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-supabase-realtime-chat/src/adapters/interface.ts) + [`src/adapters/mock.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-supabase-realtime-chat/src/adapters/mock.ts) + [`src/adapters/real.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-supabase-realtime-chat/src/adapters/real.ts)) wraps the same four ops behind a `ChatRoomAdapter` interface with a `TraceEvent[]` buffer so the fidelity harness can diff mock vs real trace events. The `quality-report/fidelity-latest.md` snapshot records event-count / ordering / presence-roll-up divergence — those axes feed the release gate's `fidelity.ratio` axis via [`buildRealtimeReport`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts).

Real-mode envs.

- `SUPABASE_URL` — required. Without it, `makeRealAdapter()` returns a "skipped" variant whose every method records `SUPABASE_ENV_MISSING`.
- `SUPABASE_ANON_KEY` — required. Same skip-and-record behaviour as above.

When both envs are set but `@supabase/supabase-js` is not installed (the default in the kiwa workspace), the adapter downgrades to `SUPABASE_SDK_MISSING` — the same fidelity path, one level closer to real IO.

## Troubleshoot

- **`sendMessage` returns `ok: false`** — Either the channel was never joined (the mock returns `ok: false` on unknown channels — the test asserts this at line `sendMessage on an un-joined channel`), or the mock was reset between `joinRoom` and `sendMessage`. Use one `makeChatRoom()` per test and reset only in `afterEach`.
- **`onMessage` never fires** — Supabase's broadcast delivery is per-subscriber. The mock only invokes `onMessage` for subscribers registered *before* `subscribe()` completes. If you register a handler after `subscribe()`, use `channel.on('broadcast', ...)` before re-calling `subscribe()`.
- **Presence snapshot shows extra members** — The tutorial's `getPresence` reads a **local mirror** populated by `joinRoom` — it does not react to `channel.on('presence', { event: 'leave' }, ...)`. Wire the leave transition (see the dogfood app at `mock.ts:80-84`) if you need snapshots that shrink on unsubscribe.
- **Typing debounce is off by one** — The `debounceWindow` includes the first-emit tick. 11 keystrokes at 50 ms gives cursors 50, 100, 150, ..., 550 — the first emit lands at cursor 50, the second at cursor 550 (delta 500). Any other keystroke interval gives a different exact count; recompute the expected value with `Math.floor(totalWindowMs / debounceWindow) + 1`.

## Next steps

- [Ably shared cursor tutorial](./10-ably-collab-cursor.md) shows client-side 60 fps throttle + history rewind.
- [Socket.io notification tutorial](./11-socketio-notification.md) shows reconnect + pending replay + backpressure overflow.
- The [realtime testing concept guide](../concepts/realtime-testing.md) explains the 5 time-axis semantics (order / timing / drop / reconnect / backpressure) and why event-stream tests need them.
