import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type RedUseState = 'idle' | 'rate-tracked' | 'errors-tracked' | 'duration-tracked' | 'saturation-tracked';

export interface RedUseSession {
  target: ObservabilityTarget;
  serviceName: string;
  state: RedUseState;
  requestCount: number;
  errorCount: number;
  durationSamplesMs: number[];
  saturationSamples: number[];
  history: AxisStep<RedUseState>[];
}

export interface FourGoldenSignals {
  latencyP99Ms: number;
  trafficRps: number;
  errorRate: number;
  saturation: number;
}

export function startRedUse(input: {
  target: ObservabilityTarget;
  serviceName: string;
}): RedUseSession {
  if (input.serviceName.length === 0) {
    throw new Error('startRedUse: serviceName must not be empty');
  }
  return {
    target: input.target,
    serviceName: input.serviceName,
    state: 'idle',
    requestCount: 0,
    errorCount: 0,
    durationSamplesMs: [],
    saturationSamples: [],
    history: [],
  };
}

export function recordRequestRate(
  session: RedUseSession,
  input: { requests: number; windowSeconds: number },
): AxisStep<RedUseState> {
  if (input.requests < 0) {
    throw new Error('recordRequestRate: requests must be non-negative');
  }
  if (input.windowSeconds <= 0) {
    throw new Error('recordRequestRate: windowSeconds must be positive');
  }
  session.requestCount += input.requests;
  session.state = 'rate-tracked';
  return emit(session, 'red.rate_recorded', {
    requests: input.requests,
    windowSeconds: input.windowSeconds,
    rps: input.requests / input.windowSeconds,
  });
}

export function recordErrors(
  session: RedUseSession,
  input: { errors: number },
): AxisStep<RedUseState> {
  if (session.state === 'idle') {
    throw new Error('recordErrors: rate must be recorded first');
  }
  if (input.errors < 0) {
    throw new Error('recordErrors: errors must be non-negative');
  }
  if (input.errors > session.requestCount) {
    throw new Error('recordErrors: errors must not exceed total requests');
  }
  session.errorCount += input.errors;
  session.state = 'errors-tracked';
  return emit(session, 'red.errors_recorded', {
    errors: input.errors,
    cumulativeErrors: session.errorCount,
    errorRate: session.requestCount === 0 ? 0 : session.errorCount / session.requestCount,
  });
}

export function recordDuration(
  session: RedUseSession,
  input: { durationMs: number },
): AxisStep<RedUseState> {
  if (session.state === 'idle') {
    throw new Error('recordDuration: rate must be recorded first');
  }
  if (input.durationMs < 0) {
    throw new Error('recordDuration: durationMs must be non-negative');
  }
  session.durationSamplesMs.push(input.durationMs);
  session.state = 'duration-tracked';
  return emit(session, 'red.duration_recorded', {
    durationMs: input.durationMs,
    sampleCount: session.durationSamplesMs.length,
  });
}

export function recordSaturation(
  session: RedUseSession,
  input: { saturation: number },
): AxisStep<RedUseState> {
  if (input.saturation < 0 || input.saturation > 1) {
    throw new Error('recordSaturation: saturation must be within [0, 1]');
  }
  session.saturationSamples.push(input.saturation);
  session.state = 'saturation-tracked';
  return emit(session, 'use.saturation_recorded', {
    saturation: input.saturation,
    sampleCount: session.saturationSamples.length,
  });
}

export function computeFourGoldenSignals(session: RedUseSession): FourGoldenSignals {
  if (session.durationSamplesMs.length === 0) {
    return {
      latencyP99Ms: 0,
      trafficRps: 0,
      errorRate: 0,
      saturation: 0,
    };
  }
  const sorted = [...session.durationSamplesMs].sort((a, b) => a - b);
  const p99Index = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.99) - 1);
  const latencyP99Ms = sorted[Math.max(0, p99Index)] ?? 0;
  const trafficRps = session.requestCount;
  const errorRate = session.requestCount === 0 ? 0 : session.errorCount / session.requestCount;
  const saturation =
    session.saturationSamples.length === 0
      ? 0
      : session.saturationSamples.reduce((a, b) => a + b, 0) / session.saturationSamples.length;
  return { latencyP99Ms, trafficRps, errorRate, saturation };
}

function emit(
  session: RedUseSession,
  neutralEvent: AxisStep<RedUseState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<RedUseState> {
  const step: AxisStep<RedUseState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, serviceName: session.serviceName, ...metadata },
  };
  session.history.push(step);
  return step;
}
