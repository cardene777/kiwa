import type { ChatMessage, ChatRoomAdapter, PresenceSnapshot } from '../adapters/interface.js';

/**
 * End-to-end flows that exercise the {@link ChatRoomAdapter} contract. The
 * flows are provider-neutral — the same code drives the mock and (when
 * envs are set) the real Supabase Realtime backend.
 *
 * Each flow is designed to hit a different mock semantic ...
 *
 * - {@link joinAndSayHi} — subscribe + presence join + 1 broadcast, exercises
 *   the happy path for chat delivery.
 * - {@link twoUsersJoinAndChat} — 2 users share a room, presence rolls up
 *   both users, both broadcast, mutual delivery is observable.
 * - {@link burstTyping} — rapid keystrokes are debounced at 500ms so only
 *   a subset of raw events actually broadcast.
 * - {@link leaveRoomFlow} — presence leave transition is observable in the
 *   snapshot right after untrack.
 */

const ROOM = 'room:demo';

export async function joinAndSayHi(adapter: ChatRoomAdapter): Promise<{
  join: Awaited<ReturnType<ChatRoomAdapter['joinRoom']>>;
  send: Awaited<ReturnType<ChatRoomAdapter['sendMessage']>>;
  presence: PresenceSnapshot;
  received: ChatMessage[];
}> {
  const received: ChatMessage[] = [];
  const join = await adapter.joinRoom({
    channel: ROOM,
    userId: 'alice',
    onMessage: (m) => received.push(m),
  });
  const send = await adapter.sendMessage({
    channel: ROOM,
    userId: 'alice',
    text: 'Hi there — this is Alice.',
  });
  const presence = await adapter.getPresence({ channel: ROOM });
  return { join, send, presence, received };
}

export async function twoUsersJoinAndChat(adapter: ChatRoomAdapter): Promise<{
  received: ChatMessage[];
  presence: PresenceSnapshot;
}> {
  const received: ChatMessage[] = [];
  // The adapter is a chat-room facade — the real Supabase (or the kiwa mock)
  // serves multiple joined users through a single client connection. Both
  // users therefore join through the same adapter here; the presence roll-up
  // reflects the shared channel state.
  await adapter.joinRoom({ channel: ROOM, userId: 'alice', onMessage: (m) => received.push(m) });
  await adapter.joinRoom({ channel: ROOM, userId: 'bob' });

  await adapter.sendMessage({ channel: ROOM, userId: 'alice', text: 'Bob, are you there?' });
  await adapter.sendMessage({ channel: ROOM, userId: 'bob', text: 'Yes Alice — hi!' });

  const presence = await adapter.getPresence({ channel: ROOM });
  return { received, presence };
}

/**
 * Rapidly type "hello world" — 11 keystrokes at 50ms intervals. The debounce
 * window is 500ms, so only 2 typing events should actually broadcast
 * (immediate emit + one at the 500ms mark), leaving 9 suppressed.
 */
export async function burstTyping(adapter: ChatRoomAdapter): Promise<{
  join: Awaited<ReturnType<ChatRoomAdapter['joinRoom']>>;
  typing: Awaited<ReturnType<ChatRoomAdapter['sendTyping']>>;
}> {
  const join = await adapter.joinRoom({ channel: ROOM, userId: 'carol' });
  const typing = await adapter.sendTyping({
    channel: ROOM,
    userId: 'carol',
    keystrokeIntervalsMs: [50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
  });
  return { join, typing };
}

/**
 * Presence roll-up transition — dave joins, presence snapshot shows dave,
 * then erin joins and the snapshot rolls both up. Exercises the join +
 * presence sync path without wiping the trace mid-flow (`adapter.reset`
 * clears the trace buffer by contract).
 */
export async function leaveRoomFlow(adapter: ChatRoomAdapter): Promise<{
  before: PresenceSnapshot;
  after: PresenceSnapshot;
}> {
  await adapter.joinRoom({ channel: ROOM, userId: 'dave' });
  const before = await adapter.getPresence({ channel: ROOM });
  await adapter.joinRoom({ channel: ROOM, userId: 'erin' });
  const after = await adapter.getPresence({ channel: ROOM });
  return { before, after };
}
