import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Step-up MFA axis — Authenticator Assurance Level (AAL) escalation ladder
 * (NIST SP 800-63B AAL1 → AAL2 → AAL3). Sensitive operations require a
 * higher AAL than the initial session — the axis models the escalation
 * request + factor collection + trust duration cache.
 */
export type AalLevel = 'AAL1' | 'AAL2' | 'AAL3';
export type StepUpState = 'idle' | 'escalation-requested' | 'aal2-satisfied' | 'aal3-satisfied';

export interface StepUpSession {
  platform: AuthPlatform;
  userId: string;
  currentAal: AalLevel;
  requiredAal: AalLevel;
  trustDurationMs: number;
  trustExpiresAtMs: number;
  state: StepUpState;
  history: AxisStep<StepUpState>[];
}

export function startStepUp(input: {
  platform: AuthPlatform;
  userId: string;
  currentAal: AalLevel;
  trustDurationMs?: number;
}): StepUpSession {
  return {
    platform: input.platform,
    userId: input.userId,
    currentAal: input.currentAal,
    requiredAal: input.currentAal,
    trustDurationMs: input.trustDurationMs ?? 900_000,
    trustExpiresAtMs: 0,
    state: 'idle',
    history: [],
  };
}

export function requestEscalation(
  session: StepUpSession,
  input: { requiredAal: AalLevel },
): AxisStep<StepUpState> {
  if (aalRank(input.requiredAal) <= aalRank(session.currentAal)) {
    throw new Error(
      `requestEscalation: requiredAal ${input.requiredAal} not higher than currentAal ${session.currentAal}`,
    );
  }
  session.requiredAal = input.requiredAal;
  session.state = 'escalation-requested';
  const step: AxisStep<StepUpState> = {
    neutralEvent: 'step-up.escalation-requested',
    platformEvent: platformEventName(session.platform, 'step-up.escalation-requested'),
    state: 'escalation-requested',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      fromAal: session.currentAal,
      toAal: input.requiredAal,
    },
  };
  session.history.push(step);
  return step;
}

export function satisfyAal2(
  session: StepUpSession,
  input: { factor: 'sms' | 'totp' | 'push'; nowMs: number },
): AxisStep<StepUpState> {
  if (session.state !== 'escalation-requested') {
    throw new Error(`satisfyAal2: session is ${session.state}, expected escalation-requested`);
  }
  if (session.requiredAal === 'AAL3') {
    throw new Error('satisfyAal2: requiredAal is AAL3, cannot satisfy with AAL2');
  }
  session.currentAal = 'AAL2';
  session.state = 'aal2-satisfied';
  session.trustExpiresAtMs = input.nowMs + session.trustDurationMs;
  const step: AxisStep<StepUpState> = {
    neutralEvent: 'step-up.aal2-satisfied',
    platformEvent: platformEventName(session.platform, 'step-up.aal2-satisfied'),
    state: 'aal2-satisfied',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      factor: input.factor,
      trustExpiresAtMs: session.trustExpiresAtMs,
    },
  };
  session.history.push(step);
  return step;
}

export function satisfyAal3(
  session: StepUpSession,
  input: { factor: 'webauthn' | 'passkey-biometric' | 'hardware-key'; nowMs: number },
): AxisStep<StepUpState> {
  if (session.state !== 'escalation-requested') {
    throw new Error(`satisfyAal3: session is ${session.state}, expected escalation-requested`);
  }
  session.currentAal = 'AAL3';
  session.state = 'aal3-satisfied';
  session.trustExpiresAtMs = input.nowMs + session.trustDurationMs;
  const step: AxisStep<StepUpState> = {
    neutralEvent: 'step-up.aal3-satisfied',
    platformEvent: platformEventName(session.platform, 'step-up.aal3-satisfied'),
    state: 'aal3-satisfied',
    platform: session.platform,
    metadata: {
      userId: session.userId,
      factor: input.factor,
      trustExpiresAtMs: session.trustExpiresAtMs,
    },
  };
  session.history.push(step);
  return step;
}

export function checkTrustCache(
  session: StepUpSession,
  input: { nowMs: number },
): AxisStep<StepUpState> {
  const hit = input.nowMs < session.trustExpiresAtMs;
  const step: AxisStep<StepUpState> = {
    neutralEvent: 'step-up.trust-cached',
    platformEvent: platformEventName(session.platform, 'step-up.trust-cached'),
    state: session.state,
    platform: session.platform,
    metadata: {
      userId: session.userId,
      currentAal: session.currentAal,
      trustExpiresAtMs: session.trustExpiresAtMs,
      nowMs: input.nowMs,
      hit,
    },
  };
  session.history.push(step);
  return step;
}

function aalRank(level: AalLevel): number {
  return { AAL1: 1, AAL2: 2, AAL3: 3 }[level];
}
