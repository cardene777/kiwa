import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type LogCorrelationAdvancedState =
  | 'idle'
  | 'log-emitted'
  | 'trace-joined'
  | 'logql-promql-joined'
  | 'index-built';

export interface StructuredLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  traceId: string | null;
  spanId: string | null;
  labels: Record<string, string>;
  timestampMs: number;
}

export interface LogCorrelationAdvancedSession {
  target: ObservabilityTarget;
  namespace: string;
  state: LogCorrelationAdvancedState;
  logs: StructuredLog[];
  correlationIndex: Map<string, StructuredLog[]>;
  history: AxisStep<LogCorrelationAdvancedState>[];
}

export function startLogCorrelationAdvanced(input: {
  target: ObservabilityTarget;
  namespace: string;
}): LogCorrelationAdvancedSession {
  if (input.namespace.length === 0) {
    throw new Error('startLogCorrelationAdvanced: namespace must not be empty');
  }
  return {
    target: input.target,
    namespace: input.namespace,
    state: 'idle',
    logs: [],
    correlationIndex: new Map(),
    history: [],
  };
}

export function emitStructuredLog(
  session: LogCorrelationAdvancedSession,
  log: StructuredLog,
): AxisStep<LogCorrelationAdvancedState> {
  if (log.message.length === 0) {
    throw new Error('emitStructuredLog: message must not be empty');
  }
  session.logs.push(log);
  session.state = 'log-emitted';
  return emit(session, 'logcorr.structured_log_emitted', {
    level: log.level,
    hasTraceId: log.traceId !== null,
    labelCount: Object.keys(log.labels).length,
    logCount: session.logs.length,
  });
}

export function joinTraceIds(
  session: LogCorrelationAdvancedSession,
  input: { traceId: string },
): { step: AxisStep<LogCorrelationAdvancedState>; matchedLogs: StructuredLog[] } {
  if (input.traceId.length === 0) {
    throw new Error('joinTraceIds: traceId must not be empty');
  }
  const matchedLogs = session.logs.filter((l) => l.traceId === input.traceId);
  session.state = 'trace-joined';
  const step = emit(session, 'logcorr.trace_id_joined', {
    traceId: input.traceId,
    matchedCount: matchedLogs.length,
  });
  return { step, matchedLogs };
}

export interface LogQLPromQLJoinQuery {
  logQlSelector: string;
  promQlSelector: string;
  labels: string[];
}

export function joinLogQLAndPromQL(
  session: LogCorrelationAdvancedSession,
  query: LogQLPromQLJoinQuery,
): AxisStep<LogCorrelationAdvancedState> {
  if (query.logQlSelector.length === 0) {
    throw new Error('joinLogQLAndPromQL: logQlSelector must not be empty');
  }
  if (query.promQlSelector.length === 0) {
    throw new Error('joinLogQLAndPromQL: promQlSelector must not be empty');
  }
  if (query.labels.length === 0) {
    throw new Error('joinLogQLAndPromQL: at least one join label required');
  }
  const matchingLogs = session.logs.filter((l) =>
    query.labels.every((label) => Object.prototype.hasOwnProperty.call(l.labels, label)),
  );
  session.state = 'logql-promql-joined';
  return emit(session, 'logcorr.logql_promql_joined', {
    logqlSelector: query.logQlSelector,
    promqlSelector: query.promQlSelector,
    labelCount: query.labels.length,
    matchedLogs: matchingLogs.length,
  });
}

export function buildCorrelationIndex(
  session: LogCorrelationAdvancedSession,
): AxisStep<LogCorrelationAdvancedState> {
  session.correlationIndex.clear();
  for (const log of session.logs) {
    if (log.traceId === null) continue;
    const bucket = session.correlationIndex.get(log.traceId) ?? [];
    bucket.push(log);
    session.correlationIndex.set(log.traceId, bucket);
  }
  session.state = 'index-built';
  return emit(session, 'logcorr.correlation_index_built', {
    traceCount: session.correlationIndex.size,
    logCount: session.logs.length,
  });
}

function emit(
  session: LogCorrelationAdvancedSession,
  neutralEvent: AxisStep<LogCorrelationAdvancedState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<LogCorrelationAdvancedState> {
  const step: AxisStep<LogCorrelationAdvancedState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, namespace: session.namespace, ...metadata },
  };
  session.history.push(step);
  return step;
}
