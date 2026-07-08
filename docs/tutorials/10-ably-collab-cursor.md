# Ably shared cursor + 60 fps throttle + history rewind

## What you'll build

A single vitest test file that drives a small collaboration board through **three Ably surfaces** — a cursor position broadcast on a board channel, a 60 fps client-side throttle on mass mousemove events, and a `channel.history({ limit })` rewind for a late-joining user — using `@kiwa/realtime`'s `createAblyMock`. The same test file also works against real Ably when `ABLY_API_KEY` is set, so the fidelity harness can diff mock vs real behaviour.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-ably-collab-cursor && cd kiwa-ably-collab-cursor
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa/realtime
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

Create `src/mock-adapter.ts` — a provider-neutral cursor-board surface backed by the kiwa mock:

```ts
import {
  createAblyMock,
  type AblyChannel,
  type AblyMock,
} from '@kiwa/realtime';

/** A cursor position broadcast on the board channel. */
export interface CursorPosition {
  id: string;
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

/**
 * Provider-neutral cursor-board surface. The tests below drive this surface
 * only — a real-mode implementation swaps `AblyMock` for `Ably.Realtime` from
 * the `ably` SDK without touching the flows.
 */
export interface CursorBoard {
  joinBoard(input: {
    board: string;
    userId: string;
    onCursor?: (p: CursorPosition) => void;
  }): Promise<{ subscribed: boolean }>;
  moveCursor(input: {
    board: string;
    userId: string;
    moveIntervalsMs: number[];
  }): Promise<{ emitted: number; suppressed: number }>;
  rewindHistory(input: {
    board: string;
    limit: number;
  }): Promise<{ events: CursorPosition[] }>;
  getPresence(input: { board: string }): Promise<{ members: string[] }>;
  reset(): Promise<void>;
}

export function makeCursorBoard(): CursorBoard {
  const client: AblyMock = createAblyMock({
    artificialLatencyMs: 3,
    provider: 'ably-mock',
  });
  const openChannels = new Map<string, AblyChannel>();
  const membersByBoard = new Map<string, Set<string>>();

  function ensurePresence(board: string): Set<string> {
    let s = membersByBoard.get(board);
    if (!s) {
      s = new Set();
      membersByBoard.set(board, s);
    }
    return s;
  }

  return {
    async joinBoard(input) {
      const channel = client.channels.get(input.board);
      if (input.onCursor) {
        await channel.subscribe('cursor', (msg) => {
          const raw = msg.data as CursorPosition | undefined;
          if (raw) input.onCursor?.(raw);
        });
      }
      await channel.attach();
      ensurePresence(input.board).add(input.userId);
      await channel.presence.enter({ userId: input.userId, joinedAt: Date.now() });
      openChannels.set(input.board, channel);
      return { subscribed: true };
    },

    async moveCursor(input) {
      const channel = openChannels.get(input.board);
      if (!channel) return { emitted: 0, suppressed: 0 };
      // 60 fps = ~16.667 ms window; use 16 for integer arithmetic. First
      // event always emits; subsequent events within 16 ms of the last
      // emission are suppressed.
      const throttleWindow = 16;
      let emitted = 0;
      let suppressed = 0;
      let lastEmitAt = -Infinity;
      let cursor = 0;
      let x = 0;
      let y = 0;
      for (const gap of input.moveIntervalsMs) {
        cursor += gap;
        x += 1;
        y += 1;
        if (cursor - lastEmitAt >= throttleWindow) {
          const pos: CursorPosition = {
            id: `pos_${Math.random().toString(36).slice(2, 10)}`,
            userId: input.userId,
            x,
            y,
            timestamp: Date.now(),
          };
          await channel.publish('cursor', pos);
          emitted += 1;
          lastEmitAt = cursor;
        } else {
          suppressed += 1;
        }
      }
      return { emitted, suppressed };
    },

    async rewindHistory(input) {
      const channel = openChannels.get(input.board);
      if (!channel) return { events: [] };
      const h = await channel.history({ limit: input.limit });
      const events = h.items
        .filter((item) => item.name === 'cursor')
        .map((item) => item.data as CursorPosition);
      return { events };
    },

    async getPresence(input) {
      return { members: Array.from(ensurePresence(input.board)) };
    },

    async reset() {
      for (const [, ch] of openChannels) await ch.detach();
      openChannels.clear();
      membersByBoard.clear();
      client.reset();
    },
  };
}
```

Add `tests/board.spec.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeCursorBoard, type CursorBoard, type CursorPosition } from '../src/mock-adapter.js';

let board: CursorBoard;

beforeEach(() => {
  board = makeCursorBoard();
});

afterEach(async () => {
  await board.reset();
});

describe('ably collab cursor — mock', () => {
  it('joinBoard subscribes and delivers a cursor position via publish', async () => {
    const received: CursorPosition[] = [];
    await board.joinBoard({
      board: 'board:demo',
      userId: 'alice',
      onCursor: (p) => received.push(p),
    });
    // 3 raw events at 20 ms spacing all clear the 16 ms throttle window.
    const move = await board.moveCursor({
      board: 'board:demo',
      userId: 'alice',
      moveIntervalsMs: [20, 20, 20],
    });

    expect(move.emitted).toBe(3);
    expect(move.suppressed).toBe(0);
    expect(received.length).toBe(3);
    expect(received.every((p) => p.userId === 'alice')).toBe(true);
  });

  it('rolls up presence for two users on the same board', async () => {
    await board.joinBoard({ board: 'board:demo', userId: 'alice' });
    await board.joinBoard({ board: 'board:demo', userId: 'bob' });
    const presence = await board.getPresence({ board: 'board:demo' });

    expect(presence.members.sort()).toEqual(['alice', 'bob']);
  });

  it('throttles 11 mousemove events at 5 ms intervals down to 3 broadcasts (60 fps window)', async () => {
    await board.joinBoard({ board: 'board:demo', userId: 'carol' });
    // 11 events × 5 ms cadence = 55 ms window. Throttle = 16 ms — emits
    // land at synthetic cursors 5 / 25 / 45 (first event always emits +
    // one every ≥ 16 ms). 3 emitted, 8 suppressed.
    const move = await board.moveCursor({
      board: 'board:demo',
      userId: 'carol',
      moveIntervalsMs: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    });

    expect(move.emitted).toBe(3);
    expect(move.suppressed).toBe(8);
  });

  it('history rewind returns previously published cursors for a late-joining user', async () => {
    // Dave paints 5 positions; each at 20 ms cadence clears the throttle.
    await board.joinBoard({ board: 'board:demo', userId: 'dave' });
    await board.moveCursor({
      board: 'board:demo',
      userId: 'dave',
      moveIntervalsMs: [20, 20, 20, 20, 20],
    });
    // Erin joins later and pulls history for the last 10 events.
    await board.joinBoard({ board: 'board:demo', userId: 'erin' });
    const rewind = await board.rewindHistory({ board: 'board:demo', limit: 10 });

    expect(rewind.events.length).toBe(5);
    // Ably's `history()` returns most-recent-first (see packages/realtime/
    // src/ably.ts, `slice(-limit).reverse()`). All events are Dave's — Erin
    // joined after the paint completed.
    for (const e of rewind.events) expect(e.userId).toBe('dave');
  });

  it('moveCursor on an un-joined board reports emitted=0', async () => {
    const move = await board.moveCursor({
      board: 'board:orphan',
      userId: 'alice',
      moveIntervalsMs: [20],
    });
    expect(move.emitted).toBe(0);
  });
});
```

Run:

```bash
pnpm test
```

You should see five passing tests in under a second.

## Explanation

- `createAblyMock` returns a client whose `channels.get(name).attach() / subscribe(event, handler) / publish(event, data) / history({ limit })` shape matches the `ably` SDK. The mock is deterministic — subscribing to `subscribe('cursor', handler)` and then calling `channel.publish('cursor', pos)` delivers the payload synchronously, with `artificialLatencyMs` (3 ms here) as the only wall-clock delay.
- The **60 fps throttle** is an app-layer concern — Ably (and Supabase / Pusher / Socket.io) does not ship built-in throttle. The tutorial's `moveCursor` implements the standard "first event always emits + subsequent events within the throttle window suppressed" pattern. 60 fps = ~16.667 ms per frame; the tutorial uses integer 16 so cursor arithmetic stays exact. With 11 raw events at 5 ms cadence, emissions land at synthetic cursors 5 / 25 / 45 (first + every ≥ 16 ms after last) → 3 emitted, 8 suppressed. Change the throttle window or the raw cadence and the math shifts predictably.
- **History rewind** is an Ably-only primitive among the 4 v1.13 providers. `channel.history({ limit })` returns the last N events in reverse-chronological order. The mock stores every published event on the engine channel; `history` reads a `slice(-limit).reverse()` off that store. Real Ably returns paginated results — the mock's return shape (`{ items: [...] }`) matches the first page. See the [realtime concept doc § provider difference table](../concepts/realtime-testing) for how the other providers substitute for rewind.
- Presence works identically to the Supabase Realtime tutorial (roll-up mirror maintained by `joinBoard`). Ably's `channel.presence.enter({ ... })` fires an `enter` event; `channel.presence.subscribe('enter' | 'leave', ...)` receives the transition. The dogfood app at [`examples/dogfood-ably-collab-cursor/src/adapters/mock.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-ably-collab-cursor/src/adapters/mock.ts) wires the full subscription; the tutorial uses the local mirror for brevity.

## Real-vs-mock fidelity (optional)

The dogfood app at `examples/dogfood-ably-collab-cursor/` (see [`src/adapters/interface.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-ably-collab-cursor/src/adapters/interface.ts) + [`src/adapters/mock.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-ably-collab-cursor/src/adapters/mock.ts) + [`src/adapters/real.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-ably-collab-cursor/src/adapters/real.ts)) wraps the same four ops behind a `CursorBoardAdapter` interface with a `TraceEvent[]` buffer so the fidelity harness can diff mock vs real trace events. The `quality-report/fidelity-latest.md` snapshot records emit-count / ordering / history divergence — those axes feed the release gate's `fidelity.ratio` axis via [`buildRealtimeReport`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts).

Real-mode envs.

- `ABLY_API_KEY` — required. Without it, `makeRealAdapter()` returns a "skipped" variant whose every method records `ABLY_ENV_MISSING`.
- `ABLY_CLIENT_ID` — optional. Defaults to a random `client_xxxxxx`.

When `ABLY_API_KEY` is set but the `ably` SDK is not installed (the default in the kiwa workspace), the adapter downgrades to `ABLY_SDK_MISSING` — the same fidelity path, one level closer to real IO.

## Troubleshoot

- **`emitted` count mismatches your calculation** — The throttle formula is `Math.floor(totalMs / throttleWindow) + 1` — first event always emits, then one per ≥ 16 ms gap. 11 events × 5 ms = 55 ms → `floor(55/16) + 1 = 3 + 1 = 4`? No — the formula is subtly different because the *first* emit consumes the initial "cursor advance". Trace through: cursor advances 5, 10, 15, 20, 25 — first emit at 5, next threshold at 21, so second emit at 25 (delta = 20 ≥ 16). Continue and you get 3 emissions at cursor 5, 25, 45. When in doubt, log `lastEmitAt` at each step.
- **`history()` returns 0 events** — Ably history is per-channel. Rewind only sees events published on the *same* channel string. If you call `channel.publish('cursor', ...)` on `board:demo` and then `client.channels.get('board:other').history()`, the second channel is empty by design.
- **`history()` returns events in chronological order** (not reverse) — The mock implements `slice(-limit).reverse()` so the newest event is first. If your assertion expects the oldest first, `Array.reverse()` the result or use `history({ limit, direction: 'forwards' })` if you extend the mock to support the `direction` option.
- **Presence snapshot missing a member after `detach()`** — The tutorial's local mirror does not shrink on `detach()`. Real Ably (and the mock's `channel.presence.subscribe('leave', ...)`) fires a leave event on `detach()`; wire the handler if your app snapshots presence after unsubscribe.

## Next steps

- [Socket.io notification tutorial](./11-socketio-notification.md) shows reconnect + pending replay + backpressure overflow — the last of the 5 v1.13 realtime semantics.
- The [realtime testing concept guide](../concepts/realtime-testing.md) explains the 5 time-axis semantics (order / timing / drop / reconnect / backpressure) and why event-stream tests need them.
- The dogfood app has a `burstMouseMove` flow ([`src/flows/cursor-flows.ts`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-ably-collab-cursor/src/flows/cursor-flows.ts)) that generates 100 raw events at 5 ms cadence — useful for stress-testing your own throttle implementations.
