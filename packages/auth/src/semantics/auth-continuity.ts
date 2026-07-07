import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Auth continuity axis — seamless re-auth + refresh rotation + session
 * extension + revocation window. Users expect long-lived sessions but
 * providers must rotate refresh tokens (RFC 6749 §10.4) and honor a
 * revocation window when a token is compromised. The axis tracks token
 * state + rotation lineage + revocation cascade.
 */
export type ContinuityState =
  | 'active'
  | 'seamless-reauthed'
  | 'refresh-rotated'
  | 'extended'
  | 'in-revocation-window';

export interface ContinuitySession {
  platform: AuthPlatform;
  userId: string;
  refreshToken: string;
  refreshFamily: string;
  expiresAtMs: number;
  revocationWindowMs: number;
  state: ContinuityState;
  history: AxisStep<ContinuityState>[];
}

export function startContinuity(input: {
  platform: AuthPlatform;
  userId: string;
  refreshToken: string;
  expiresAtMs: number;
  revocationWindowMs?: number;
}): ContinuitySession {
  return {
    platform: input.platform,
    userId: input.userId,
    refreshToken: input.refreshToken,
    refreshFamily: input.refreshToken,
    expiresAtMs: input.expiresAtMs,
    revocationWindowMs: input.revocationWindowMs ?? 30_000,
    state: 'active',
    history: [],
  };
}

export function seamlessReauth(
  session: ContinuitySession,
  input: { nowMs: number },
): AxisStep<ContinuityState> {
  if (session.state === 'in-revocation-window') {
    throw new Error('seamlessReauth: session in revocation window, cannot reauth');
  }
  session.state = 'seamless-reauthed';
  const step: AxisStep<ContinuityState> = {
    neutralEvent: 'continuity.seamless-reauth',
    platformEvent: platformEventName(session.platform, 'continuity.seamless-reauth'),
    state: 'seamless-reauthed',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      nowMs: input.nowMs,
      expiresAtMs: session.expiresAtMs,
    },
  };
  session.history.push(step);
  return step;
}

export function rotateRefresh(
  session: ContinuitySession,
  input: { newToken: string; nowMs: number },
): AxisStep<ContinuityState> {
  if (session.state === 'in-revocation-window') {
    throw new Error('rotateRefresh: session in revocation window, cannot rotate');
  }
  const oldToken = session.refreshToken;
  session.refreshToken = input.newToken;
  session.state = 'refresh-rotated';
  const step: AxisStep<ContinuityState> = {
    neutralEvent: 'continuity.refresh-rotated',
    platformEvent: platformEventName(session.platform, 'continuity.refresh-rotated'),
    state: 'refresh-rotated',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      oldToken,
      newToken: input.newToken,
      refreshFamily: session.refreshFamily,
      nowMs: input.nowMs,
    },
  };
  session.history.push(step);
  return step;
}

export function extendSession(
  session: ContinuitySession,
  input: { extendByMs: number },
): AxisStep<ContinuityState> {
  if (session.state === 'in-revocation-window') {
    throw new Error('extendSession: session in revocation window, cannot extend');
  }
  session.expiresAtMs += input.extendByMs;
  session.state = 'extended';
  const step: AxisStep<ContinuityState> = {
    neutralEvent: 'continuity.session-extended',
    platformEvent: platformEventName(session.platform, 'continuity.session-extended'),
    state: 'extended',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      extendByMs: input.extendByMs,
      newExpiresAtMs: session.expiresAtMs,
    },
  };
  session.history.push(step);
  return step;
}

export function hitRevocationWindow(
  session: ContinuitySession,
  input: { reason: string },
): AxisStep<ContinuityState> {
  session.state = 'in-revocation-window';
  const step: AxisStep<ContinuityState> = {
    neutralEvent: 'continuity.revocation-window-hit',
    platformEvent: platformEventName(session.platform, 'continuity.revocation-window-hit'),
    state: 'in-revocation-window',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      reason: input.reason,
      revocationWindowMs: session.revocationWindowMs,
    },
  };
  session.history.push(step);
  return step;
}
