import { providerEventName, type AxisStep, type ObservabilityTarget } from './types.js';

export type OtelAdvancedState =
  | 'idle'
  | 'batch-flushed'
  | 'resource-detected'
  | 'baggage-propagated'
  | 'w3c-extracted';

export interface OtelSpanQueueItem {
  spanId: string;
  parentId: string | null;
  attributes: Record<string, string>;
}

export interface OtelAdvancedSession {
  target: ObservabilityTarget;
  serviceName: string;
  state: OtelAdvancedState;
  queue: OtelSpanQueueItem[];
  batches: OtelSpanQueueItem[][];
  resource: Record<string, string>;
  baggage: Record<string, string>;
  w3cTraceparent: string | null;
  w3cTracestate: string | null;
  history: AxisStep<OtelAdvancedState>[];
}

export function startOtelAdvanced(input: {
  target: ObservabilityTarget;
  serviceName: string;
}): OtelAdvancedSession {
  if (input.serviceName.length === 0) {
    throw new Error('startOtelAdvanced: serviceName must not be empty');
  }
  return {
    target: input.target,
    serviceName: input.serviceName,
    state: 'idle',
    queue: [],
    batches: [],
    resource: {},
    baggage: {},
    w3cTraceparent: null,
    w3cTracestate: null,
    history: [],
  };
}

export function enqueueSpan(session: OtelAdvancedSession, span: OtelSpanQueueItem): void {
  if (span.spanId.length === 0) {
    throw new Error('enqueueSpan: spanId must not be empty');
  }
  session.queue.push(span);
}

export function flushBatch(
  session: OtelAdvancedSession,
  input: { maxBatchSize: number },
): AxisStep<OtelAdvancedState> {
  if (input.maxBatchSize <= 0) {
    throw new Error('flushBatch: maxBatchSize must be positive');
  }
  const batch = session.queue.splice(0, Math.min(input.maxBatchSize, session.queue.length));
  session.batches.push(batch);
  session.state = 'batch-flushed';
  return emit(session, 'otel.batch_flushed', {
    batchSize: batch.length,
    remainingQueue: session.queue.length,
    maxBatchSize: input.maxBatchSize,
  });
}

export function detectResource(
  session: OtelAdvancedSession,
  attributes: Record<string, string>,
): AxisStep<OtelAdvancedState> {
  if (Object.keys(attributes).length === 0) {
    throw new Error('detectResource: attributes must not be empty');
  }
  session.resource = { ...session.resource, ...attributes };
  session.state = 'resource-detected';
  return emit(session, 'otel.resource_detected', {
    attributeCount: Object.keys(session.resource).length,
    addedKeys: Object.keys(attributes).join(','),
  });
}

export function propagateBaggage(
  session: OtelAdvancedSession,
  entries: Record<string, string>,
): AxisStep<OtelAdvancedState> {
  for (const [key, value] of Object.entries(entries)) {
    if (key.length === 0) {
      throw new Error('propagateBaggage: baggage key must not be empty');
    }
    if (value.length === 0) {
      throw new Error('propagateBaggage: baggage value must not be empty');
    }
  }
  session.baggage = { ...session.baggage, ...entries };
  session.state = 'baggage-propagated';
  return emit(session, 'otel.baggage_propagated', {
    entryCount: Object.keys(session.baggage).length,
    addedKeys: Object.keys(entries).join(','),
  });
}

export function extractW3CContext(
  session: OtelAdvancedSession,
  headers: { traceparent: string; tracestate?: string },
): AxisStep<OtelAdvancedState> {
  const parts = headers.traceparent.split('-');
  if (parts.length !== 4) {
    throw new Error(
      `extractW3CContext: invalid traceparent format (expected 4 parts, got ${parts.length})`,
    );
  }
  const [version, traceId, spanId, flags] = parts as [string, string, string, string];
  if (version !== '00') {
    throw new Error(`extractW3CContext: unsupported traceparent version ${version}`);
  }
  if (traceId.length !== 32) {
    throw new Error('extractW3CContext: traceId must be 32 hex chars');
  }
  if (spanId.length !== 16) {
    throw new Error('extractW3CContext: spanId must be 16 hex chars');
  }
  session.w3cTraceparent = headers.traceparent;
  session.w3cTracestate = headers.tracestate ?? null;
  session.state = 'w3c-extracted';
  return emit(session, 'otel.w3c_context_extracted', {
    version,
    traceId,
    spanId,
    flags,
    hasTracestate: headers.tracestate !== undefined,
  });
}

function emit(
  session: OtelAdvancedSession,
  neutralEvent: AxisStep<OtelAdvancedState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<OtelAdvancedState> {
  const step: AxisStep<OtelAdvancedState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, serviceName: session.serviceName, ...metadata },
  };
  session.history.push(step);
  return step;
}
