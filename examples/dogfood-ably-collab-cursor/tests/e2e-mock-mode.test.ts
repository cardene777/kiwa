import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CursorBoardAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  burstMouseMove,
  joinAndDrawFirstStroke,
  lateJoinerRewind,
  twoUsersCollab,
} from '../src/flows/cursor-flows.js';

let adapter: CursorBoardAdapter;

beforeEach(() => {
  adapter = makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-ably-collab-cursor (mock mode) — cursor + presence + throttle + history rewind', () => {
  it('T-DFA-M-001 joinAndDrawFirstStroke subscribes and broadcasts a cursor position', async () => {
    const result = await joinAndDrawFirstStroke(adapter);
    expect(result.join.subscribed).toBe(true);
    // 3 raw events at 20 ms spacing all clear the 16 ms throttle window.
    expect(result.move.emittedCount).toBe(3);
    expect(result.move.suppressedCount).toBe(0);
  });

  it('T-DFA-M-002 joinAndDrawFirstStroke presence snapshot lists the joining user', async () => {
    const result = await joinAndDrawFirstStroke(adapter);
    expect(result.presence.members.map((m) => m.userId)).toContain('alice');
  });

  it('T-DFA-M-003 twoUsersCollab rolls up both members into presence', async () => {
    const result = await twoUsersCollab(adapter);
    expect(result.presence.members.map((m) => m.userId).sort()).toEqual(['alice', 'bob']);
  });

  it('T-DFA-M-004 burstMouseMove throttles 11 events at 5 ms to 3 emitted (60 fps window)', async () => {
    const result = await burstMouseMove(adapter);
    // 11 events × 5 ms cadence = 55 ms window. Throttle = 16 ms — emits
    // land at synthetic cursors 5 / 25 / 45 (first event always emits +
    // one every ≥ 16 ms). 3 emitted, 8 suppressed.
    expect(result.move.emittedCount).toBe(3);
    expect(result.move.suppressedCount).toBe(8);
  });

  it('T-DFA-M-005 lateJoinerRewind — dave paints 5 positions, erin rewinds history and sees them', async () => {
    const result = await lateJoinerRewind(adapter);
    // 5 raw events at 20 ms spacing all clear the 16 ms throttle — all 5
    // broadcast, so history rewind returns all 5.
    expect(result.paintedFirst.emittedCount).toBe(5);
    expect(result.rewind.events.length).toBe(5);
    // All events should be dave's — erin joined after painting.
    for (const e of result.rewind.events) {
      expect(e.userId).toBe('dave');
    }
    // Presence rolls up both users after erin joined.
    expect(result.presenceAfter.members.map((m) => m.userId).sort()).toEqual(['dave', 'erin']);
  });

  it('T-DFA-M-006 metrics roll up subscribe + publish counts across flows', async () => {
    await joinAndDrawFirstStroke(adapter);
    const m = adapter.metrics();
    expect(m.subscribeCount).toBeGreaterThanOrEqual(1);
    expect(m.publishCount).toBeGreaterThanOrEqual(1);
    expect(m.requests).toBeGreaterThanOrEqual(2);
  });

  it('T-DFA-M-007 reset clears traces + metrics', async () => {
    await joinAndDrawFirstStroke(adapter);
    expect(adapter.traces()).not.toHaveLength(0);
    expect(adapter.metrics().requests).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().requests).toBe(0);
  });

  it('T-DFA-M-008 moveCursor on an un-joined board records BOARD_NOT_JOINED', async () => {
    const result = await adapter.moveCursor({
      board: 'board:orphan',
      userId: 'alice',
      moveIntervalsMs: [20],
    });
    expect(result.emittedCount).toBe(0);
    const errs = adapter.traces().filter((t) => t.errorKind === 'BOARD_NOT_JOINED');
    expect(errs.length).toBe(1);
  });

  it('T-DFA-M-009 rewindHistory on an un-joined board records BOARD_NOT_JOINED', async () => {
    const result = await adapter.rewindHistory({ board: 'board:orphan', limit: 10 });
    expect(result.events).toHaveLength(0);
    const errs = adapter.traces().filter(
      (t) => t.op === 'rewindHistory' && t.errorKind === 'BOARD_NOT_JOINED',
    );
    expect(errs.length).toBe(1);
  });

  it('T-DFA-M-010 rewindHistory returns cursor events in chronological order after emit', async () => {
    await adapter.joinBoard({ board: 'board:demo', userId: 'alice' });
    await adapter.moveCursor({
      board: 'board:demo',
      userId: 'alice',
      moveIntervalsMs: [20, 20, 20],
    });
    const r = await adapter.rewindHistory({ board: 'board:demo', limit: 10 });
    expect(r.events.length).toBe(3);
    // Ably `history()` returns most-recent-first per the mock contract
    // (see packages/realtime/src/ably.ts history impl, `slice(-limit).reverse()`).
    // Each CursorPosition carries a wall-clock `timestamp: Date.now()` set at
    // publish time, so the returned slice must be monotonically non-increasing
    // (>= 3ms of artificialLatency between publishes guarantees strict order,
    // but we assert `>=` to stay stable if latency drops).
    for (let i = 1; i < r.events.length; i += 1) {
      const prev = r.events[i - 1];
      const cur = r.events[i];
      if (prev && cur) {
        expect(prev.timestamp).toBeGreaterThanOrEqual(cur.timestamp);
      }
    }
  });
});
