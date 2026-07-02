import type {
  CursorBoardAdapter,
  CursorPosition,
  PresenceSnapshot,
} from '../adapters/interface.js';

/**
 * End-to-end flows that exercise the {@link CursorBoardAdapter} contract.
 * The flows are provider-neutral — the same code drives the mock and (when
 * envs are set) the real Ably backend.
 *
 * Each flow is designed to hit a different mock semantic ...
 *
 * - {@link joinAndDrawFirstStroke} — subscribe + presence enter + 1 cursor
 *   burst, exercises the happy path for cursor delivery.
 * - {@link twoUsersCollab} — 2 users share a board, presence rolls up both
 *   users, both broadcast cursor bursts, mutual delivery is observable.
 * - {@link burstMouseMove} — rapid mousemove events are throttled at 60 fps
 *   so only a subset of raw events actually broadcast (16 ms window).
 * - {@link lateJoinerRewind} — a first user paints, a second user joins
 *   after and rewinds history to recover the current board state.
 */

const BOARD = 'board:demo';

export async function joinAndDrawFirstStroke(adapter: CursorBoardAdapter): Promise<{
  join: Awaited<ReturnType<CursorBoardAdapter['joinBoard']>>;
  move: Awaited<ReturnType<CursorBoardAdapter['moveCursor']>>;
  presence: PresenceSnapshot;
  received: CursorPosition[];
}> {
  const received: CursorPosition[] = [];
  const join = await adapter.joinBoard({
    board: BOARD,
    userId: 'alice',
    onCursor: (p) => received.push(p),
  });
  // 3 raw events at 20 ms spacing — all 3 clear the 16 ms throttle window
  // (0 ms + 20 ms + 40 ms elapsed) and broadcast.
  const move = await adapter.moveCursor({
    board: BOARD,
    userId: 'alice',
    moveIntervalsMs: [20, 20, 20],
  });
  const presence = await adapter.getPresence({ board: BOARD });
  return { join, move, presence, received };
}

/**
 * Two users share a board through a SINGLE adapter instance — a mock-only
 * convenience shortcut. In real Ably, `presence.enter(data)` identifies
 * the member by the client-authenticated `clientId`, so a single client
 * cannot represent two distinct presence members (bob would overwrite
 * alice on the server side). The adapter carries its own `membersByBoard`
 * map keyed on the caller-supplied `userId`, so the mock stays consistent
 * for surface-coverage measurement, but the flow does not reflect real
 * Ably multi-user semantics — a real implementation would open one Ably
 * client per user (each with its own `clientId`) and drive them in
 * parallel. See `docs/quality-reports/realtime/ably-collab-cursor.md` §
 * Notes for the follow-up.
 */
export async function twoUsersCollab(adapter: CursorBoardAdapter): Promise<{
  received: CursorPosition[];
  presence: PresenceSnapshot;
}> {
  const received: CursorPosition[] = [];
  await adapter.joinBoard({ board: BOARD, userId: 'alice', onCursor: (p) => received.push(p) });
  await adapter.joinBoard({ board: BOARD, userId: 'bob' });

  await adapter.moveCursor({ board: BOARD, userId: 'alice', moveIntervalsMs: [20, 20] });
  await adapter.moveCursor({ board: BOARD, userId: 'bob', moveIntervalsMs: [20, 20] });

  const presence = await adapter.getPresence({ board: BOARD });
  return { received, presence };
}

/**
 * Rapidly move the cursor — 11 mousemove events at 5 ms intervals. The
 * throttle window is 16 ms; the first event always emits (cursor - (-Inf)
 * ≥ 16), and subsequent events emit only after the 16 ms window elapses.
 * With a 5 ms cadence the emits land at cursors 5 / 25 / 45 — 3 emitted,
 * 8 suppressed.
 */
export async function burstMouseMove(adapter: CursorBoardAdapter): Promise<{
  join: Awaited<ReturnType<CursorBoardAdapter['joinBoard']>>;
  move: Awaited<ReturnType<CursorBoardAdapter['moveCursor']>>;
}> {
  const join = await adapter.joinBoard({ board: BOARD, userId: 'carol' });
  const move = await adapter.moveCursor({
    board: BOARD,
    userId: 'carol',
    moveIntervalsMs: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  });
  return { join, move };
}

/**
 * Late-joiner scenario — dave paints first, then erin joins and rewinds
 * the last 10 cursor events from history to recover the current state.
 * Exercises `rewindHistory` + presence roll-up together.
 */
export async function lateJoinerRewind(adapter: CursorBoardAdapter): Promise<{
  paintedFirst: Awaited<ReturnType<CursorBoardAdapter['moveCursor']>>;
  rewind: Awaited<ReturnType<CursorBoardAdapter['rewindHistory']>>;
  presenceAfter: PresenceSnapshot;
}> {
  await adapter.joinBoard({ board: BOARD, userId: 'dave' });
  const paintedFirst = await adapter.moveCursor({
    board: BOARD,
    userId: 'dave',
    moveIntervalsMs: [20, 20, 20, 20, 20],
  });
  // Late joiner rewinds history — the adapter reads the last N events from
  // channel.history so erin's client can replay dave's strokes locally.
  await adapter.joinBoard({ board: BOARD, userId: 'erin' });
  const rewind = await adapter.rewindHistory({ board: BOARD, limit: 10 });
  const presenceAfter = await adapter.getPresence({ board: BOARD });
  return { paintedFirst, rewind, presenceAfter };
}
