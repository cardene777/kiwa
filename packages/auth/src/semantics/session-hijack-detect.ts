import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Session hijack detect axis — anomaly signals per session (fingerprint
 * drift, geo anomaly, concurrent session, logout cascade). A live session
 * publishes its fingerprint + geo per request; drifting from baseline
 * triggers a hijack candidate flag. Concurrent sessions from disjoint
 * geos amplify the signal, and confirmed hijack triggers a logout cascade
 * across the user's other active sessions.
 */
export type HijackState = 'clean' | 'drift-detected' | 'geo-anomaly' | 'concurrent' | 'logout-cascade';

export interface HijackSession {
  platform: AuthPlatform;
  sessionId: string;
  baselineFingerprint: string;
  baselineRegion: string;
  state: HijackState;
  activeSessionCount: number;
  history: AxisStep<HijackState>[];
}

export function startHijackWatch(input: {
  platform: AuthPlatform;
  sessionId: string;
  baselineFingerprint: string;
  baselineRegion: string;
}): HijackSession {
  return {
    platform: input.platform,
    sessionId: input.sessionId,
    baselineFingerprint: input.baselineFingerprint,
    baselineRegion: input.baselineRegion,
    state: 'clean',
    activeSessionCount: 1,
    history: [],
  };
}

export function reportFingerprintDrift(
  session: HijackSession,
  input: { observedFingerprint: string; distance: number },
): AxisStep<HijackState> {
  session.state = 'drift-detected';
  const step: AxisStep<HijackState> = {
    neutralEvent: 'hijack.fingerprint-drift',
    platformEvent: platformEventName(session.platform, 'hijack.fingerprint-drift'),
    state: 'drift-detected',
    platform: session.platform,
    metadata: {
      sessionId: session.sessionId,
      baseline: session.baselineFingerprint,
      observed: input.observedFingerprint,
      distance: input.distance,
    },
  };
  session.history.push(step);
  return step;
}

export function reportGeoAnomaly(
  session: HijackSession,
  input: { observedRegion: string; km: number; withinMinutes: number },
): AxisStep<HijackState> {
  session.state = 'geo-anomaly';
  const step: AxisStep<HijackState> = {
    neutralEvent: 'hijack.geo-anomaly',
    platformEvent: platformEventName(session.platform, 'hijack.geo-anomaly'),
    state: 'geo-anomaly',
    platform: session.platform,
    metadata: {
      sessionId: session.sessionId,
      baselineRegion: session.baselineRegion,
      observedRegion: input.observedRegion,
      km: input.km,
      withinMinutes: input.withinMinutes,
    },
  };
  session.history.push(step);
  return step;
}

export function reportConcurrentSession(
  session: HijackSession,
  input: { concurrentSessionCount: number },
): AxisStep<HijackState> {
  if (input.concurrentSessionCount <= 1) {
    throw new Error(`reportConcurrentSession: count ${input.concurrentSessionCount} must be > 1`);
  }
  session.activeSessionCount = input.concurrentSessionCount;
  session.state = 'concurrent';
  const step: AxisStep<HijackState> = {
    neutralEvent: 'hijack.concurrent-session',
    platformEvent: platformEventName(session.platform, 'hijack.concurrent-session'),
    state: 'concurrent',
    platform: session.platform,
    metadata: {
      sessionId: session.sessionId,
      concurrentSessionCount: input.concurrentSessionCount,
    },
  };
  session.history.push(step);
  return step;
}

export function triggerLogoutCascade(
  session: HijackSession,
  input: { revokedSessionIds: string[] },
): AxisStep<HijackState> {
  session.state = 'logout-cascade';
  const step: AxisStep<HijackState> = {
    neutralEvent: 'hijack.logout-cascade',
    platformEvent: platformEventName(session.platform, 'hijack.logout-cascade'),
    state: 'logout-cascade',
    platform: session.platform,
    metadata: {
      sessionId: session.sessionId,
      revokedCount: input.revokedSessionIds.length,
    },
  };
  session.history.push(step);
  return step;
}
