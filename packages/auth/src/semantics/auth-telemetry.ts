import { platformEventName, type AxisStep, type AuthPlatform } from './types.js';

/**
 * Auth telemetry axis — attempt log + success rate + latency histogram +
 * abuse detection. Provides operational metrics for a login endpoint so
 * the risk engine can dial in `allowThreshold` / `blockThreshold` and the
 * SLO harness can wire a burn-rate alert on `success_rate < 0.95`.
 */
export type TelemetryState = 'collecting' | 'abuse-detected';

export interface TelemetryBuckets {
  under100ms: number;
  under500ms: number;
  under1000ms: number;
  over1000ms: number;
}

export interface AuthTelemetrySession {
  platform: AuthPlatform;
  endpointId: string;
  attemptCount: number;
  successCount: number;
  buckets: TelemetryBuckets;
  state: TelemetryState;
  history: AxisStep<TelemetryState>[];
}

export function startAuthTelemetry(input: {
  platform: AuthPlatform;
  endpointId: string;
}): AuthTelemetrySession {
  return {
    platform: input.platform,
    endpointId: input.endpointId,
    attemptCount: 0,
    successCount: 0,
    buckets: { under100ms: 0, under500ms: 0, under1000ms: 0, over1000ms: 0 },
    state: 'collecting',
    history: [],
  };
}

export function recordAttempt(
  session: AuthTelemetrySession,
  input: { success: boolean; latencyMs: number },
): AxisStep<TelemetryState> {
  session.attemptCount++;
  if (input.success) session.successCount++;
  const step: AxisStep<TelemetryState> = {
    neutralEvent: 'telemetry.attempt-recorded',
    platformEvent: platformEventName(session.platform, 'telemetry.attempt-recorded'),
    state: session.state,
    platform: session.platform,
    metadata: {
      endpointId: session.endpointId,
      success: input.success,
      latencyMs: input.latencyMs,
      attemptCount: session.attemptCount,
    },
  };
  session.history.push(step);
  return step;
}

export function updateSuccessRate(session: AuthTelemetrySession): AxisStep<TelemetryState> {
  if (session.attemptCount === 0) {
    throw new Error('updateSuccessRate: no attempts recorded');
  }
  const rate = session.successCount / session.attemptCount;
  const step: AxisStep<TelemetryState> = {
    neutralEvent: 'telemetry.success-rate-updated',
    platformEvent: platformEventName(session.platform, 'telemetry.success-rate-updated'),
    state: session.state,
    platform: session.platform,
    metadata: {
      endpointId: session.endpointId,
      attemptCount: session.attemptCount,
      successCount: session.successCount,
      successRate: rate,
    },
  };
  session.history.push(step);
  return step;
}

export function bucketLatency(
  session: AuthTelemetrySession,
  input: { latencyMs: number },
): AxisStep<TelemetryState> {
  if (input.latencyMs < 100) session.buckets.under100ms++;
  else if (input.latencyMs < 500) session.buckets.under500ms++;
  else if (input.latencyMs < 1000) session.buckets.under1000ms++;
  else session.buckets.over1000ms++;
  const step: AxisStep<TelemetryState> = {
    neutralEvent: 'telemetry.latency-bucketed',
    platformEvent: platformEventName(session.platform, 'telemetry.latency-bucketed'),
    state: session.state,
    platform: session.platform,
    metadata: {
      endpointId: session.endpointId,
      latencyMs: input.latencyMs,
      under100ms: session.buckets.under100ms,
      under500ms: session.buckets.under500ms,
      under1000ms: session.buckets.under1000ms,
      over1000ms: session.buckets.over1000ms,
    },
  };
  session.history.push(step);
  return step;
}

export function detectAbuse(
  session: AuthTelemetrySession,
  input: { failureRateThreshold: number; ipAddress: string },
): AxisStep<TelemetryState> {
  if (session.attemptCount === 0) {
    throw new Error('detectAbuse: no attempts recorded');
  }
  const failureRate = 1 - session.successCount / session.attemptCount;
  const isAbuse = failureRate >= input.failureRateThreshold;
  if (isAbuse) session.state = 'abuse-detected';
  const step: AxisStep<TelemetryState> = {
    neutralEvent: 'telemetry.abuse-detected',
    platformEvent: platformEventName(session.platform, 'telemetry.abuse-detected'),
    state: session.state,
    platform: session.platform,
    metadata: {
      endpointId: session.endpointId,
      failureRate,
      failureRateThreshold: input.failureRateThreshold,
      ipAddress: input.ipAddress,
      isAbuse,
    },
  };
  session.history.push(step);
  return step;
}
