/**
 * Alarm-based message purge — the 24-h retention policy fires an alarm
 * once a room's oldest message crosses the retention window, and the
 * alarm handler clears the transcript.
 *
 * Cloudflare Durable Objects expose an `alarm()` method the runtime calls
 * when the scheduled epoch elapses; the mock reproduces this by exposing
 * a pure {@link runPurgeAlarm} function the fidelity harness invokes at a
 * simulated "now" value.
 *
 * A real deployment would set `env.CHAT_ROOM.setAlarm(Date.now() + 86400000)`
 * on every append; the mock schedules the alarm at `firstMessageAt +
 * RETENTION_MS` on room creation and re-schedules after each purge.
 */

import type { ChatRoomRegistry, ChatRoomState } from '../workers/chat-room.js';

/** Retention window — 24 hours in milliseconds. */
export const RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Compute the next purge epoch for a room. Returns `null` if the room has
 * no messages (no transcript to purge → no alarm scheduled).
 */
export function computeNextPurgeAt(state: ChatRoomState, now: number): number | null {
  if (state.transcript.length === 0) return null;
  const firstMessageAt = state.transcript[0]?.at ?? now;
  return firstMessageAt + RETENTION_MS;
}

/**
 * Run the purge alarm at simulated `now`. If the scheduled alarm epoch
 * has not yet elapsed, no purge fires and the caller receives a
 * `noop` signal so the fidelity harness can record the alarm never fired.
 *
 * Otherwise:
 *  1. The DO's `firePurgeAlarm` transitions the axis session and clears
 *     the transcript.
 *  2. The next alarm is re-scheduled at `now + RETENTION_MS` (or
 *     `null` if the transcript is now empty) — matches the "keep the
 *     alarm live" pattern real Cloudflare DOs follow.
 *
 * Returns `{ fired, purgedCount, nextAlarmAt }`.
 */
export function runPurgeAlarm(input: {
  registry: ChatRoomRegistry;
  state: ChatRoomState;
  now: number;
}): { fired: boolean; purgedCount: number; nextAlarmAt: number | null } {
  const scheduledAt = input.state.alarmAt;
  if (scheduledAt === null) return { fired: false, purgedCount: 0, nextAlarmAt: null };
  if (input.now < scheduledAt) {
    return { fired: false, purgedCount: 0, nextAlarmAt: scheduledAt };
  }
  const { purgedCount } = input.registry.firePurgeAlarm(input.state);
  const nextAlarmAt =
    input.state.transcript.length > 0 ? input.now + RETENTION_MS : null;
  input.state.alarmAt = nextAlarmAt;
  input.state.session.scheduledAlarmAt = nextAlarmAt;
  return { fired: true, purgedCount, nextAlarmAt };
}
