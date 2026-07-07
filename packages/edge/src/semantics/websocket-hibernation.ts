import { platformEventName, type AxisStep, type EdgePlatform } from './types.js';

/**
 * WebSocket hibernation axis — Cloudflare Workers / Vercel Edge model where
 * an idle WebSocket connection is hibernated (freed from memory), then
 * resumed on the next inbound message with restored state. The helper
 * tracks per-connection hibernation status and last-known state so tests
 * can drive hibernate → resume → reconnect flows.
 */
export type WsHibernationState = 'live' | 'hibernated' | 'resuming' | 'reconnected';

export interface WsHibernationSession {
  platform: EdgePlatform;
  connectionId: string;
  state: WsHibernationState;
  storedState: Record<string, string | number | boolean>;
  hibernatedAtMs: number;
  history: AxisStep<WsHibernationState>[];
}

/**
 * Open a hibernation session. Initial state is `live` with given
 * `storedState` (persisted across hibernation).
 */
export function startHibernationSession(input: {
  platform: EdgePlatform;
  connectionId: string;
  initialState?: Record<string, string | number | boolean>;
}): WsHibernationSession {
  return {
    platform: input.platform,
    connectionId: input.connectionId,
    state: 'live',
    storedState: { ...(input.initialState ?? {}) },
    hibernatedAtMs: 0,
    history: [],
  };
}

/**
 * Hibernate the connection (idle timeout). Transitions to `hibernated`
 * and emits `ws-hibernation.entered`. State is preserved in storage.
 */
export function hibernate(
  session: WsHibernationSession,
  input: { nowMs: number },
): AxisStep<WsHibernationState> {
  if (session.state !== 'live') {
    throw new Error(`hibernate: session is ${session.state}, cannot hibernate`);
  }
  session.state = 'hibernated';
  session.hibernatedAtMs = input.nowMs;
  const step: AxisStep<WsHibernationState> = {
    neutralEvent: 'ws-hibernation.entered',
    platformEvent: platformEventName(session.platform, 'ws-hibernation.entered'),
    state: 'hibernated',
    platform: session.platform,
    metadata: {
      connectionId: session.connectionId,
      hibernatedAtMs: input.nowMs,
      storedKeys: Object.keys(session.storedState).length,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Resume a hibernated connection on inbound message. Transitions to
 * `resuming` and emits `ws-hibernation.resumed` with time in hibernation.
 */
export function resume(
  session: WsHibernationSession,
  input: { nowMs: number },
): AxisStep<WsHibernationState> {
  if (session.state !== 'hibernated') {
    throw new Error(`resume: session is ${session.state}, cannot resume`);
  }
  session.state = 'resuming';
  const hibernatedMs = input.nowMs - session.hibernatedAtMs;
  const step: AxisStep<WsHibernationState> = {
    neutralEvent: 'ws-hibernation.resumed',
    platformEvent: platformEventName(session.platform, 'ws-hibernation.resumed'),
    state: 'resuming',
    platform: session.platform,
    metadata: {
      connectionId: session.connectionId,
      nowMs: input.nowMs,
      hibernatedMs,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Restore state from storage back into the resumed session. Confirms all
 * expected keys are present and emits `ws-hibernation.state-restored`.
 */
export function restoreState(
  session: WsHibernationSession,
  input: { expectedKeys: string[] },
): AxisStep<WsHibernationState> {
  if (session.state !== 'resuming') {
    throw new Error(`restoreState: session is ${session.state}, cannot restore`);
  }
  const missing = input.expectedKeys.filter((k) => !(k in session.storedState));
  const step: AxisStep<WsHibernationState> = {
    neutralEvent: 'ws-hibernation.state-restored',
    platformEvent: platformEventName(session.platform, 'ws-hibernation.state-restored'),
    state: 'resuming',
    platform: session.platform,
    metadata: {
      connectionId: session.connectionId,
      expectedKeys: input.expectedKeys.length,
      missingKeys: missing.length,
      restoredKeys: input.expectedKeys.length - missing.length,
    },
  };
  session.history.push(step);
  return step;
}

/**
 * Complete reconnection — connection is fully live again. Transitions to
 * `reconnected` and emits `ws-hibernation.reconnected`.
 */
export function completeReconnect(session: WsHibernationSession): AxisStep<WsHibernationState> {
  if (session.state !== 'resuming') {
    throw new Error(`completeReconnect: session is ${session.state}, expected resuming`);
  }
  session.state = 'reconnected';
  const step: AxisStep<WsHibernationState> = {
    neutralEvent: 'ws-hibernation.reconnected',
    platformEvent: platformEventName(session.platform, 'ws-hibernation.reconnected'),
    state: 'reconnected',
    platform: session.platform,
    metadata: {
      connectionId: session.connectionId,
    },
  };
  session.history.push(step);
  return step;
}
