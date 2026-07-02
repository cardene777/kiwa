/**
 * Provider-neutral shared-cursor board surface for the dogfood app.
 *
 * The app talks to Ably only through this interface. Two implementations
 * exist — {@link makeRealAdapter} (calls `ably` when `ABLY_API_KEY` is set,
 * otherwise reports each method as `ABLY_ENV_MISSING`) and
 * {@link makeMockAdapter} (backed by `@kiwa-test/realtime`'s
 * {@link createAblyMock}). Both must satisfy the same contract so
 * behavioural fidelity between real vs mock can be measured side-by-side and
 * fed to `@kiwa-test/quality-metrics` release gate.
 *
 * The 4 ops are chosen so Ably's collab-cursor difficulty surface is
 * observable end-to-end ...
 *
 * - `joinBoard` — subscribe to a board channel + track presence for a user.
 * - `moveCursor` — broadcast a burst of cursor positions, throttled at 60 fps
 *   (16 ms window) so mass mousemove events do not flood the channel.
 * - `rewindHistory` — pull the last N cursor events from `channel.history`
 *   so a late-joining user recovers the current board state deterministically.
 * - `getPresence` — snapshot current board members (who is looking at this
 *   board right now).
 */

/** A cursor position broadcast on the board channel. */
export interface CursorPosition {
  id: string;
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

/** Result of subscribing to a board and starting presence tracking. */
export interface JoinBoardResult {
  board: string;
  subscribed: boolean;
  latencyMs: number;
}

/**
 * Result of a cursor movement burst — captures the client-side throttle
 * ratio so we can measure how many raw mousemove events actually broadcast.
 */
export interface CursorMoveResult {
  board: string;
  emittedCount: number;
  suppressedCount: number;
  latencyMs: number;
}

/** History rewind result — the last N cursor events observed on the channel. */
export interface RewindResult {
  board: string;
  events: CursorPosition[];
  latencyMs: number;
}

/** Presence snapshot — who is currently on the board. */
export interface PresenceSnapshot {
  board: string;
  members: Array<{ userId: string; joinedAt: number }>;
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
 * Cursor-board adapter — the app performs 4 ops:
 *
 * - `joinBoard` — subscribe to a board channel + presence track a user.
 * - `moveCursor` — broadcast a series of cursor positions, throttled at
 *   60 fps (16 ms window) so mass mousemove events do not flood the channel.
 *   The result exposes the number of events actually emitted vs suppressed.
 * - `rewindHistory` — fetch the last N cursor positions from channel history
 *   so a late-joining user replays the board state deterministically.
 * - `getPresence` — snapshot current board members.
 */
export interface CursorBoardAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /** Subscribe to a board channel and track the user's presence. */
  joinBoard(input: {
    board: string;
    userId: string;
    onCursor?: (pos: CursorPosition) => void;
    onPresence?: (snapshot: PresenceSnapshot) => void;
  }): Promise<JoinBoardResult>;

  /**
   * Emit a burst of cursor positions, throttled at 60 fps so mass mousemove
   * events do not flood the channel. The throttle window is fixed at 16 ms —
   * the caller supplies raw mouse-move intervals and the adapter returns
   * emitted / suppressed counts.
   */
  moveCursor(input: {
    board: string;
    userId: string;
    /**
     * Millisecond gaps between each raw mousemove event. Length = number of
     * raw events. Positions are synthesised so successive events do not sit
     * on top of each other (x / y advance by 1 pixel per event).
     */
    moveIntervalsMs: number[];
  }): Promise<CursorMoveResult>;

  /**
   * Rewind the last N cursor events from the board channel history — the
   * late-joining path that a real Ably client would use on attach.
   */
  rewindHistory(input: { board: string; limit: number }): Promise<RewindResult>;

  /** Snapshot presence — who is currently tracked on the board. */
  getPresence(input: { board: string }): Promise<PresenceSnapshot>;

  /** Rolling metric aggregate for the fidelity harness. */
  metrics(): {
    subscribeCount: number;
    publishCount: number;
    eventsDelivered: number;
    eventsDropped: number;
    subscribeLatencySamplesMs: number[];
    publishLatencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
