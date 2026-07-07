import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Risk-based auth axis — score-driven adaptive challenge. A risk engine
 * fuses device fingerprint, IP reputation, geo, velocity, and behavioural
 * signals into a single score. Below threshold `allowThreshold` the request
 * is allowed silently. Between `allowThreshold` and `blockThreshold` a
 * challenge is injected. Above `blockThreshold` the request is blocked.
 */
export type RiskState = 'idle' | 'evaluated' | 'challenged' | 'allowed' | 'blocked';

export interface RiskSignals {
  deviceScore: number;
  ipReputation: number;
  geoAnomaly: number;
  velocityScore: number;
  behavioralScore: number;
}

export interface RiskSession {
  platform: AuthPlatform;
  userId: string;
  allowThreshold: number;
  blockThreshold: number;
  score: number;
  state: RiskState;
  history: AxisStep<RiskState>[];
}

export function startRiskEval(input: {
  platform: AuthPlatform;
  userId: string;
  allowThreshold?: number;
  blockThreshold?: number;
}): RiskSession {
  return {
    platform: input.platform,
    userId: input.userId,
    allowThreshold: input.allowThreshold ?? 30,
    blockThreshold: input.blockThreshold ?? 70,
    score: 0,
    state: 'idle',
    history: [],
  };
}

export function evaluateScore(
  session: RiskSession,
  input: { signals: RiskSignals },
): AxisStep<RiskState> {
  if (session.state !== 'idle') {
    throw new Error(`evaluateScore: session is ${session.state}, expected idle`);
  }
  const { deviceScore, ipReputation, geoAnomaly, velocityScore, behavioralScore } = input.signals;
  session.score = Math.min(
    100,
    Math.round(deviceScore + ipReputation + geoAnomaly + velocityScore + behavioralScore),
  );
  session.state = 'evaluated';
  const step: AxisStep<RiskState> = {
    neutralEvent: 'risk.score-evaluated',
    platformEvent: platformEventName(session.platform, 'risk.score-evaluated'),
    state: 'evaluated',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      score: session.score,
      allowThreshold: session.allowThreshold,
      blockThreshold: session.blockThreshold,
    },
  };
  session.history.push(step);
  return step;
}

export function injectChallenge(
  session: RiskSession,
  input: { challenge: 'sms' | 'email' | 'webauthn' | 'captcha' },
): AxisStep<RiskState> {
  if (session.state !== 'evaluated') {
    throw new Error(`injectChallenge: session is ${session.state}, expected evaluated`);
  }
  if (session.score < session.allowThreshold || session.score >= session.blockThreshold) {
    throw new Error(
      `injectChallenge: score ${session.score} not in challenge range [${session.allowThreshold}, ${session.blockThreshold})`,
    );
  }
  session.state = 'challenged';
  const step: AxisStep<RiskState> = {
    neutralEvent: 'risk.challenge-injected',
    platformEvent: platformEventName(session.platform, 'risk.challenge-injected'),
    state: 'challenged',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      score: session.score,
      challenge: input.challenge,
    },
  };
  session.history.push(step);
  return step;
}

export function applyPolicy(session: RiskSession): AxisStep<RiskState> {
  if (session.state !== 'evaluated' && session.state !== 'challenged') {
    throw new Error(`applyPolicy: session is ${session.state}, cannot apply policy`);
  }
  const blocked = session.score >= session.blockThreshold;
  const neutralEvent: 'risk.policy-blocked' | 'risk.policy-allowed' = blocked
    ? 'risk.policy-blocked'
    : 'risk.policy-allowed';
  session.state = blocked ? 'blocked' : 'allowed';
  const step: AxisStep<RiskState> = {
    neutralEvent,
    platformEvent: platformEventName(session.platform, neutralEvent),
    state: session.state,
    platform: session.platform,
    metadata: {
      userId: session.userId,
      score: session.score,
      blocked,
    },
  };
  session.history.push(step);
  return step;
}
