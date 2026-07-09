import {
  createAblyMock,
  type AblyChannel,
  type AblyMock,
} from '@kiwa-lab/realtime';
import type {
  CursorBoardAdapter,
  CursorPosition,
  PresenceSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — drives the `@kiwa-lab/realtime` Ably mock so the same
 * app code exercises {@link AblyMock} without touching Ably.
 *
 * The mock returns deterministic behaviour so fidelity tests can assert on
 * cursor broadcast ordering, presence join / leave transitions, throttle
 * semantics (60 fps client-side) and history rewind. Because the mock never
 * opens a socket, tests can also assert on the exact number of network-
 * visible events the app would generate, which is what the real Ably
 * implementation charges for.
 */
export function makeMockAdapter(): CursorBoardAdapter {
  const client: AblyMock = createAblyMock({
    artificialLatencyMs: 3,
    provider: 'ably-mock',
  });
  const trace: TraceEvent[] = [];
  // board -> tracked AblyChannel handle (so detach on reset).
  const openChannels = new Map<string, AblyChannel>();
  const membersByBoard = new Map<string, Map<string, number>>();
  let requestCount = 0;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensurePresenceMap(board: string): Map<string, number> {
    let map = membersByBoard.get(board);
    if (!map) {
      map = new Map();
      membersByBoard.set(board, map);
    }
    return map;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async joinBoard(input) {
      const start = Date.now();
      const channel = client.channels.get(input.board);
      if (input.onCursor) {
        await channel.subscribe('cursor', (msg) => {
          const raw = msg.data as CursorPosition | undefined;
          if (raw) input.onCursor?.(raw);
        });
      }
      if (input.onPresence) {
        // Ably presence.subscribe delivers enter / leave / update to the
        // caller; we roll them up into a PresenceSnapshot each time.
        const emitSnapshot = (): void => {
          input.onPresence?.({
            board: input.board,
            members: Array.from(ensurePresenceMap(input.board).entries()).map(
              ([userId, joinedAt]) => ({ userId, joinedAt }),
            ),
          });
        };
        await channel.presence.subscribe('enter', emitSnapshot);
        await channel.presence.subscribe('leave', emitSnapshot);
      }
      await channel.attach();
      // Populate the local presence map BEFORE presence.enter fires the
      // subscribe handler so `emitSnapshot` observes the joining user in
      // the very first `onPresence` callback (rather than an empty list).
      const joinedAt = Date.now();
      ensurePresenceMap(input.board).set(input.userId, joinedAt);
      await channel.presence.enter({ userId: input.userId, joinedAt });
      openChannels.set(input.board, channel);
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      record('joinBoard', true, { detail: { board: input.board } });
      return { board: input.board, subscribed: true, latencyMs };
    },

    async moveCursor(input) {
      const start = Date.now();
      const channel = openChannels.get(input.board);
      if (!channel) {
        record('moveCursor', false, { errorKind: 'BOARD_NOT_JOINED' });
        return { board: input.board, emittedCount: 0, suppressedCount: 0, latencyMs: 0 };
      }
      // 60 fps = ~16.667 ms window. Use 16 for integer arithmetic; tests
      // assert on emitted / suppressed ratio, not on wall-clock timing.
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
            // Wall-clock timestamp so mock / real-mode payloads stay
            // comparable when the real Ably SDK is wired in. The synthetic
            // `cursor` variable drives the throttle window (deterministic
            // across environments) but does not leak into user-visible
            // payloads.
            timestamp: Date.now(),
          };
          await channel.publish('cursor', pos);
          emitted += 1;
          lastEmitAt = cursor;
        } else {
          suppressed += 1;
        }
      }
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      record('moveCursor', true, {
        detail: { emitted, suppressed, raws: input.moveIntervalsMs.length },
      });
      return {
        board: input.board,
        emittedCount: emitted,
        suppressedCount: suppressed,
        latencyMs,
      };
    },

    async rewindHistory(input) {
      const start = Date.now();
      const channel = openChannels.get(input.board);
      if (!channel) {
        record('rewindHistory', false, { errorKind: 'BOARD_NOT_JOINED' });
        return { board: input.board, events: [], latencyMs: 0 };
      }
      const h = await channel.history({ limit: input.limit });
      const events = h.items
        .filter((item) => item.name === 'cursor')
        .map((item) => item.data as CursorPosition);
      requestCount += 1;
      const latencyMs = Math.max(0, Date.now() - start);
      record('rewindHistory', true, {
        detail: { board: input.board, limit: input.limit, returned: events.length },
      });
      return { board: input.board, events, latencyMs };
    },

    async getPresence(input) {
      const map = ensurePresenceMap(input.board);
      record('getPresence', true, { detail: { count: map.size } });
      return {
        board: input.board,
        members: Array.from(map.entries()).map(([userId, joinedAt]) => ({
          userId,
          joinedAt,
        })),
      };
    },

    metrics() {
      const m = client.getMetrics();
      return {
        subscribeCount: m.subscribeCount,
        publishCount: m.publishCount,
        eventsDelivered: m.eventsDelivered,
        eventsDropped: m.eventsDropped,
        subscribeLatencySamplesMs: [...m.subscribeLatencyMs],
        publishLatencySamplesMs: [...m.publishLatencyMs],
        requests: requestCount,
      };
    },

    async reset() {
      for (const [, ch] of openChannels) {
        await ch.detach();
      }
      openChannels.clear();
      membersByBoard.clear();
      client.reset();
      trace.length = 0;
      requestCount = 0;
    },
  };
}
