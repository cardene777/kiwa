import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type ExemplarState =
  | 'idle'
  | 'metric-recorded'
  | 'trace-attached'
  | 'm2t-resolved'
  | 't2m-resolved';

export interface ExemplarRecord {
  metricName: string;
  metricValue: number;
  traceId: string;
  spanId: string;
  timestampMs: number;
}

export interface ExemplarSession {
  target: ObservabilityTarget;
  bucket: string;
  state: ExemplarState;
  exemplars: ExemplarRecord[];
  history: AxisStep<ExemplarState>[];
}

export function startExemplarSession(input: {
  target: ObservabilityTarget;
  bucket: string;
}): ExemplarSession {
  if (input.bucket.length === 0) {
    throw new Error('startExemplarSession: bucket must not be empty');
  }
  return {
    target: input.target,
    bucket: input.bucket,
    state: 'idle',
    exemplars: [],
    history: [],
  };
}

export function recordExemplarMetric(
  session: ExemplarSession,
  input: { metricName: string; value: number; traceId: string; spanId: string; timestampMs: number },
): AxisStep<ExemplarState> {
  if (input.metricName.length === 0) {
    throw new Error('recordExemplarMetric: metricName must not be empty');
  }
  if (input.traceId.length < 8) {
    throw new Error('recordExemplarMetric: traceId must be at least 8 chars');
  }
  if (input.spanId.length < 4) {
    throw new Error('recordExemplarMetric: spanId must be at least 4 chars');
  }
  session.exemplars.push({
    metricName: input.metricName,
    metricValue: input.value,
    traceId: input.traceId,
    spanId: input.spanId,
    timestampMs: input.timestampMs,
  });
  session.state = 'metric-recorded';
  return emit(session, 'exemplar.metric_recorded', {
    metricName: input.metricName,
    value: input.value,
    traceId: input.traceId,
    spanId: input.spanId,
  });
}

export function attachTraceToMetric(
  session: ExemplarSession,
  input: { metricName: string; traceId: string; spanId: string },
): AxisStep<ExemplarState> {
  const target = session.exemplars.find(
    (e) => e.metricName === input.metricName && e.traceId === input.traceId,
  );
  if (!target) {
    throw new Error(
      `attachTraceToMetric: no exemplar for metric=${input.metricName} trace=${input.traceId}`,
    );
  }
  target.spanId = input.spanId;
  session.state = 'trace-attached';
  return emit(session, 'exemplar.trace_attached', {
    metricName: input.metricName,
    traceId: input.traceId,
    spanId: input.spanId,
  });
}

export function resolveMetricToTrace(
  session: ExemplarSession,
  input: { metricName: string },
): { step: AxisStep<ExemplarState>; traceIds: string[] } {
  if (input.metricName.length === 0) {
    throw new Error('resolveMetricToTrace: metricName must not be empty');
  }
  const traceIds = session.exemplars
    .filter((e) => e.metricName === input.metricName)
    .map((e) => e.traceId);
  session.state = 'm2t-resolved';
  const step = emit(session, 'exemplar.metric_to_trace_resolved', {
    metricName: input.metricName,
    traceCount: traceIds.length,
  });
  return { step, traceIds };
}

export function resolveTraceToMetric(
  session: ExemplarSession,
  input: { traceId: string },
): { step: AxisStep<ExemplarState>; metricNames: string[] } {
  if (input.traceId.length === 0) {
    throw new Error('resolveTraceToMetric: traceId must not be empty');
  }
  const metricNames = Array.from(
    new Set(session.exemplars.filter((e) => e.traceId === input.traceId).map((e) => e.metricName)),
  );
  session.state = 't2m-resolved';
  const step = emit(session, 'exemplar.trace_to_metric_resolved', {
    traceId: input.traceId,
    metricCount: metricNames.length,
  });
  return { step, metricNames };
}

function emit(
  session: ExemplarSession,
  neutralEvent: AxisStep<ExemplarState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<ExemplarState> {
  const step: AxisStep<ExemplarState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, bucket: session.bucket, ...metadata },
  };
  session.history.push(step);
  return step;
}
