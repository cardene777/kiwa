/**
 * Chat room Durable Object implementation. Uses `@kiwa-lab/edge` v0.2
 * durable-object axis semantics (createDurableObject / requestDurableObject /
 * fireAlarm / writeStorage) for the state-machine backing, plus a small
 * per-room registry of members, message transcript, and scheduled alarm.
 *
 * Cloudflare Durable Objects pin an actor to a single edge location; this
 * mock reproduces the user-observable behaviour without a live Cloudflare
 * runtime — every method mutates the shared registry in-process. A real
 * runtime would replace {@link ChatRoomRegistry} with a per-object storage
 * transaction API, but the same neutral events fire and the transcript
 * persistence has the same shape.
 *
 * The chat room emits 4 event categories through the durable-object axis:
 *   - `created`         when the room is JOINed for the first time
 *   - `requested`       every subsequent JOIN / SEND
 *   - `alarm-fired`     when the 24-h purge alarm elapses
 *   - `storage-written` on each message append or transcript prune
 */

import {
  createDurableObject,
  requestDurableObject,
  fireAlarm,
  writeStorage,
  type DurableObjectSession,
} from '@kiwa-lab/edge';

/**
 * Per-room state. `members` tracks live occupants (added on JOIN, removed
 * on CLOSE), `transcript` records the ordered message list (appended on
 * SEND, cleared on ALARM purge), `alarmAt` is the epoch ms the next purge
 * fires.
 *
 * The transcript is capped at 100 messages for the mock — a real Cloudflare
 * DO would rely on storage transactional API and paginate, but for the
 * dogfood harness the shape is what the fidelity axis measures.
 */
export interface ChatRoomState {
  readonly roomId: string;
  members: Set<string>;
  transcript: readonly ChatMessage[];
  alarmAt: number | null;
  session: DurableObjectSession;
}

export interface ChatMessage {
  readonly senderId: string;
  readonly body: string;
  readonly at: number;
}

/** Per-process registry of chat rooms — 1 entry = 1 Durable Object instance. */
export class ChatRoomRegistry {
  private readonly rooms = new Map<string, ChatRoomState>();

  /**
   * Get or create a room. The first call for a given `roomId` emits a
   * `durable-object.created` step through the axis session; subsequent
   * calls emit `durable-object.requested`. A real Cloudflare DO would
   * lazily instantiate on the first `fetch()` — the mock reproduces this
   * by branching on Map presence.
   */
  ensureRoom(roomId: string): ChatRoomState {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;
    const session = createDurableObject({ id: roomId, platform: 'cloudflare' });
    const state: ChatRoomState = {
      roomId,
      members: new Set<string>(),
      transcript: [],
      alarmAt: null,
      session,
    };
    this.rooms.set(roomId, state);
    return state;
  }

  /**
   * Route a fetch-shaped request to the DO. Bumps the request counter on
   * the axis session and pins the object 'active'. Callers pass a
   * short-lived `url` string so the trace records the invocation path.
   */
  route(state: ChatRoomState, url: string): void {
    requestDurableObject(state.session, { url });
  }

  /** Add a member to the room; returns the updated occupant count. */
  addMember(state: ChatRoomState, memberId: string): number {
    state.members.add(memberId);
    return state.members.size;
  }

  /** Remove a member from the room; returns the updated occupant count. */
  removeMember(state: ChatRoomState, memberId: string): number {
    state.members.delete(memberId);
    return state.members.size;
  }

  /**
   * Append a message to the transcript and persist it via `writeStorage`.
   * Storage keys follow `msg:<index>` so a live Cloudflare DO can
   * transactionally read / prune the same list.
   */
  appendMessage(state: ChatRoomState, message: ChatMessage): number {
    state.transcript = [...state.transcript, message];
    const key = `msg:${state.transcript.length - 1}`;
    writeStorage(state.session, { key, value: JSON.stringify(message) });
    return state.transcript.length;
  }

  /**
   * Persist an arbitrary key / value pair through the axis session. Used by
   * the storage-transactional flow to observe writeStorage steps outside
   * of the message-append path.
   */
  persist(state: ChatRoomState, key: string, value: string): void {
    writeStorage(state.session, { key, value });
  }

  /**
   * Schedule the purge alarm at the given epoch ms. Overwrites any prior
   * alarm — matches Cloudflare DO's single-alarm-per-object semantic.
   */
  scheduleAlarm(state: ChatRoomState, at: number): void {
    state.alarmAt = at;
    state.session.scheduledAlarmAt = at;
  }

  /**
   * Fire the scheduled alarm. Emits `durable-object.alarm-fired` and
   * clears the transcript (24-h retention purge). Returns the number of
   * messages purged so the caller can assert on the purge effect.
   *
   * The alarm-fired step is emitted through the axis session; only
   * transcript-owned keys (`msg:*` prefix) are removed from storage.
   * Non-transcript entries written via `persist` (e.g. `user:*:last_seen`,
   * per-room metadata) survive the alarm — matches real Cloudflare DO
   * retention policy where the purge targets the transcript index only.
   */
  firePurgeAlarm(state: ChatRoomState): { purgedCount: number } {
    fireAlarm(state.session);
    const purgedCount = state.transcript.length;
    state.transcript = [];
    // Remove only transcript-owned keys (`msg:*` prefix). A real
    // transactional storage.delete() would emit per-key delete events;
    // the mock axis only exposes `writeStorage`, so we record the purge
    // count under `msg:purged` for observability.
    for (const key of Array.from(state.session.storageKeys.keys())) {
      if (key.startsWith('msg:')) {
        state.session.storageKeys.delete(key);
      }
    }
    writeStorage(state.session, { key: 'msg:purged', value: String(purgedCount) });
    return { purgedCount };
  }

  /**
   * Simulate hibernation eviction. In a real Cloudflare runtime an idle
   * Durable Object is evicted from memory and its WebSocket connections
   * are managed by the runtime's Hibernation API — the DO's in-memory
   * state is dropped and rebuilt from storage on the next request.
   *
   * The mock reproduces this by clearing the members set (WebSockets are
   * closed on eviction), emitting a fresh `requested` step through the
   * axis session (matches wake-up fetch), and returning the storage keys
   * so the caller can prove the transcript persisted through eviction.
   */
  hibernate(state: ChatRoomState): { storageKeys: readonly string[] } {
    state.members.clear();
    // Emit a `requested` step to model the wake-up fetch.
    requestDurableObject(state.session, { url: `/wake-up/${state.roomId}` });
    return { storageKeys: Array.from(state.session.storageKeys.keys()) };
  }

  /** Reset the registry — used by adapter.reset() to isolate tests. */
  clear(): void {
    this.rooms.clear();
  }
}
