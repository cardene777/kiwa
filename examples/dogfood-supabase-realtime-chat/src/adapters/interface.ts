/**
 * Provider-neutral chat surface for the dogfood app.
 *
 * The app talks to Supabase Realtime only through this interface. Two
 * implementations exist — {@link makeRealAdapter} (calls
 * `@supabase/supabase-js` when `SUPABASE_URL` + `SUPABASE_ANON_KEY` are set,
 * otherwise reports each method as `SUPABASE_ENV_MISSING`) and
 * {@link makeMockAdapter} (backed by `@kiwa-test/realtime`'s
 * {@link createSupabaseRealtimeMock}). Both must satisfy the same contract so
 * behavioural fidelity between real vs mock can be measured side-by-side and
 * fed to `@kiwa-test/quality-metrics` release gate.
 */

/** A chat message delivered on a room channel. */
export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

/** Result of subscribing to a room and collecting broadcast + presence events. */
export interface JoinRoomResult {
  channel: string;
  subscribed: boolean;
  latencyMs: number;
}

/** Result of a chat message broadcast — the caller sees delivery order + latency. */
export interface BroadcastResult {
  channel: string;
  event: string;
  ok: boolean;
  latencyMs: number;
}

/** Presence snapshot — who is currently in the room. */
export interface PresenceSnapshot {
  channel: string;
  members: Array<{ userId: string; joinedAt: number }>;
}

/** Typing indicator broadcast result — captures debounced event count. */
export interface TypingResult {
  channel: string;
  emittedCount: number;
  suppressedCount: number;
  latencyMs: number;
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
 * Chat room adapter — the app performs 4 ops:
 *
 * - `joinRoom` — subscribe to a channel + track presence for a user.
 * - `sendMessage` — broadcast a chat message to the channel.
 * - `getPresence` — snapshot current room members.
 * - `sendTyping` — broadcast a series of typing events, debounced at 500ms
 *   so mass keystrokes do not flood the channel. The result exposes the
 *   number of events actually emitted vs suppressed by debounce.
 */
export interface ChatRoomAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /** Subscribe to a room channel and track the user's presence. */
  joinRoom(input: {
    channel: string;
    userId: string;
    onMessage?: (msg: ChatMessage) => void;
    onPresence?: (snapshot: PresenceSnapshot) => void;
  }): Promise<JoinRoomResult>;

  /** Broadcast a chat message on the channel. */
  sendMessage(input: {
    channel: string;
    userId: string;
    text: string;
  }): Promise<BroadcastResult>;

  /** Snapshot presence — who is currently tracked in the channel. */
  getPresence(input: { channel: string }): Promise<PresenceSnapshot>;

  /**
   * Emit a burst of typing events, debounced so mass keystrokes do not
   * flood the channel. The debounce window is fixed at 500ms — the caller
   * supplies the raw keystroke intervals and the adapter returns emitted /
   * suppressed counts.
   */
  sendTyping(input: {
    channel: string;
    userId: string;
    /** Milliseconds between each keystroke. Length = number of raw events. */
    keystrokeIntervalsMs: number[];
  }): Promise<TypingResult>;

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
