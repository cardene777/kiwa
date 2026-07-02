import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ChatRoomAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  burstTyping,
  joinAndSayHi,
  leaveRoomFlow,
  twoUsersJoinAndChat,
} from '../src/flows/chat-flows.js';

let adapter: ChatRoomAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-supabase-realtime-chat (mock mode) — chat + presence + typing debounce', () => {
  it('T-DFS-M-001 joinAndSayHi subscribes and broadcasts a chat message', async () => {
    const result = await joinAndSayHi(adapter);
    expect(result.join.subscribed).toBe(true);
    expect(result.send.ok).toBe(true);
    expect(result.send.event).toBe('chat');
  });

  it('T-DFS-M-002 joinAndSayHi presence snapshot lists the joining user', async () => {
    const result = await joinAndSayHi(adapter);
    expect(result.presence.members.map((m) => m.userId)).toContain('alice');
  });

  it('T-DFS-M-003 twoUsersJoinAndChat rolls up both members into presence', async () => {
    const result = await twoUsersJoinAndChat(adapter);
    expect(result.presence.members.map((m) => m.userId).sort()).toEqual(['alice', 'bob']);
  });

  it('T-DFS-M-004 burstTyping debounces 11 keystrokes at 50ms to ~2 emitted broadcast events', async () => {
    const result = await burstTyping(adapter);
    // Total keystroke window = 550ms. Debounce = 500ms — the first keystroke
    // emits (cursor = 50ms) and the 500ms threshold is crossed exactly once
    // more within the window (cursor = 550ms). Anything else is suppressed.
    expect(result.typing.emittedCount).toBe(2);
    expect(result.typing.suppressedCount).toBe(9);
  });

  it('T-DFS-M-005 leaveRoomFlow — presence rolls up dave then erin joining sequentially', async () => {
    const result = await leaveRoomFlow(adapter);
    expect(result.before.members.map((m) => m.userId)).toEqual(['dave']);
    expect(result.after.members.map((m) => m.userId).sort()).toEqual(['dave', 'erin']);
  });

  it('T-DFS-M-006 metrics roll up subscribe + publish counts across flows', async () => {
    await joinAndSayHi(adapter);
    const m = adapter.metrics();
    expect(m.subscribeCount).toBeGreaterThanOrEqual(1);
    expect(m.publishCount).toBeGreaterThanOrEqual(1);
    expect(m.requests).toBeGreaterThanOrEqual(2);
  });

  it('T-DFS-M-007 reset clears traces + metrics', async () => {
    await joinAndSayHi(adapter);
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().requests).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().requests).toBe(0);
  });

  it('T-DFS-M-008 sendMessage on an un-joined channel records CHANNEL_NOT_JOINED', async () => {
    const result = await adapter.sendMessage({
      channel: 'room:orphan',
      userId: 'alice',
      text: 'noop',
    });
    expect(result.ok).toBe(false);
    const errs = adapter.traces().filter((t) => t.errorKind === 'CHANNEL_NOT_JOINED');
    expect(errs.length).toBe(1);
  });
});
