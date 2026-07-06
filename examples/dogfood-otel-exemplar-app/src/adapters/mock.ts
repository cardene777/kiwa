/**
 * Mock adapter — drives `@kiwa-test/observability` v2.1
 * `semantics/exemplar` + `semantics/otel-advanced` +
 * `semantics/log-correlation-advanced` state machines deterministically
 * without any backend. The same app code exercises a full OTel Collector
 * pipeline + exemplar + baggage + W3C context ceremony without launching
 * an OpenTelemetry Collector or Jaeger.
 *
 * State model — one {@link BucketSession} per bucket; sessions are
 * isolated so multi-profile harnesses can run traces / metrics / logs
 * side-by-side without state leakage. That mirrors how the OTel
 * Collector keeps per-pipeline state in production.
 *
 * The mock adapter piggy-backs on the same neutral event vocabulary
 * that `@kiwa-test/observability` v2.1 exemplar + otel-advanced semantics
 * emit — every op appends the matching neutral event onto the trace so
 * the fidelity harness can assert both adapters produce identical event
 * orderings.
 */

import { semantics } from '@kiwa-test/observability';
import {
  type DetectResourceResult,
  type EnqueueSpanResult,
  type ExemplarInput,
  type ExportOtlpResult,
  type ExtractW3CResult,
  type FlushBatchResult,
  type MetricToTraceResult,
  type ObservabilityTarget,
  type OtelExemplarAdapter,
  type PipelineConfig,
  type PipelineProfile,
  type PropagateBaggageResult,
  type QueryJaegerResult,
  type QueryPromExemplarsResult,
  type RecordExemplarResult,
  type StartPipelineResult,
  type TraceEvent,
  type TraceToMetricResult,
  type W3CContextInput,
} from './interface.js';

const {
  attachTraceToMetric: exemplarAttachTraceToMetric,
  detectResource: otelDetectResource,
  emitStructuredLog: logEmitStructuredLog,
  enqueueSpan: otelEnqueueSpan,
  extractW3CContext: otelExtractW3CContext,
  flushBatch: otelFlushBatch,
  propagateBaggage: otelPropagateBaggage,
  recordExemplarMetric: exemplarRecordMetric,
  resolveMetricToTrace: exemplarResolveMetricToTrace,
  resolveTraceToMetric: exemplarResolveTraceToMetric,
  startExemplarSession,
  startLogCorrelationAdvanced,
  startOtelAdvanced,
} = semantics;

type ExemplarSession = ReturnType<typeof startExemplarSession>;
type OtelAdvancedSession = ReturnType<typeof startOtelAdvanced>;
type LogSession = ReturnType<typeof startLogCorrelationAdvanced>;

/**
 * Per-bucket session state — one pipeline session per bucket, plus the
 * exemplar + log correlation sessions that ride alongside the OTel batch
 * processor. Buckets isolate profiles (traces / metrics / logs) so the
 * multi-profile fidelity matrix can drive 3 profiles without state
 * leakage.
 */
interface BucketSession {
  profile: PipelineProfile;
  receiver: string;
  processors: readonly string[];
  exporter: string;
  otel: OtelAdvancedSession;
  exemplar: ExemplarSession;
  logs: LogSession;
  /** Copies of exported items per profile (for real-adapter parity). */
  exports: Array<{ profile: PipelineProfile; itemCount: number }>;
}

const DEFAULT_COLLECTOR_ENDPOINT = 'in-memory://otel-collector';

/**
 * Build a mock OTel Collector adapter. `target` selects the provider
 * vocabulary in the emitted trace; the default `otel-collector` gives
 * the fidelity harness a natural label for the mock leg of the diff.
 */
export function makeMockAdapter(
  input: { target?: ObservabilityTarget } = {},
): OtelExemplarAdapter {
  const target: ObservabilityTarget = input.target ?? 'otel-collector';
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const emit = (
    op: string,
    bucket: string,
    session: BucketSession | null,
    neutralEvent: string,
    metadata: Record<string, string | number | boolean> = {},
  ) => {
    const providerEvent = providerEventFor(target, neutralEvent);
    traceLog.push({
      op,
      bucket,
      neutralEvent,
      providerEvent,
      target,
      state: session?.otel.state ?? 'idle',
      timestampMs: Date.now(),
      ok: true,
      metadata: { target, bucket, ...metadata },
    });
  };

  const requireBucket = (bucket: string): BucketSession => {
    const session = buckets.get(bucket);
    if (!session) {
      throw new Error(`mock adapter: bucket ${bucket} has not been started`);
    }
    return session;
  };

  return {
    target,

    async startPipeline(config: PipelineConfig): Promise<StartPipelineResult> {
      const bucket = config.profile;
      const session: BucketSession = {
        profile: config.profile,
        receiver: config.receiver,
        processors: config.processors,
        exporter: config.exporter,
        otel: startOtelAdvanced({ target, serviceName: `dogfood-${config.profile}` }),
        exemplar: startExemplarSession({ target, bucket }),
        logs: startLogCorrelationAdvanced({ target, namespace: bucket }),
        exports: [],
      };
      buckets.set(bucket, session);
      emit('startPipeline', bucket, session, 'otel.pipeline_started', {
        profile: config.profile,
        receiver: config.receiver,
        processorCount: config.processors.length,
        exporter: config.exporter,
      });
      return {
        profile: config.profile,
        receiver: config.receiver,
        processors: config.processors,
        exporter: config.exporter,
      };
    },

    async detectResource(input: {
      bucket: string;
      attributes: Record<string, string>;
    }): Promise<DetectResourceResult> {
      const session = requireBucket(input.bucket);
      const step = otelDetectResource(session.otel, input.attributes);
      emit('detectResource', input.bucket, session, step.neutralEvent, {
        attributeCount: Object.keys(session.otel.resource).length,
        addedKeys: Object.keys(input.attributes).join(','),
      });
      return {
        attributeCount: Object.keys(session.otel.resource).length,
        addedKeys: Object.freeze(Object.keys(input.attributes).slice()),
      };
    },

    async enqueueSpan(input: {
      bucket: string;
      spanId: string;
      parentId: string | null;
      attributes: Record<string, string>;
    }): Promise<EnqueueSpanResult> {
      const session = requireBucket(input.bucket);
      otelEnqueueSpan(session.otel, {
        spanId: input.spanId,
        parentId: input.parentId,
        attributes: input.attributes,
      });
      emit('enqueueSpan', input.bucket, session, 'otel.span_enqueued', {
        spanId: input.spanId,
        parentId: input.parentId ?? '',
        queueDepth: session.otel.queue.length,
      });
      return {
        spanId: input.spanId,
        parentId: input.parentId,
        queueDepth: session.otel.queue.length,
      };
    },

    async flushBatch(input: {
      bucket: string;
      maxBatchSize: number;
    }): Promise<FlushBatchResult> {
      const session = requireBucket(input.bucket);
      const step = otelFlushBatch(session.otel, { maxBatchSize: input.maxBatchSize });
      const lastBatch = session.otel.batches[session.otel.batches.length - 1] ?? [];
      emit('flushBatch', input.bucket, session, step.neutralEvent, {
        batchSize: lastBatch.length,
        remainingQueue: session.otel.queue.length,
        maxBatchSize: input.maxBatchSize,
      });
      return {
        batchSize: lastBatch.length,
        remainingQueue: session.otel.queue.length,
        maxBatchSize: input.maxBatchSize,
      };
    },

    async recordExemplar(
      input: ExemplarInput & { bucket: string },
    ): Promise<RecordExemplarResult> {
      const session = requireBucket(input.bucket);
      exemplarRecordMetric(session.exemplar, {
        metricName: input.metricName,
        value: input.value,
        traceId: input.traceId,
        spanId: input.spanId,
        timestampMs: input.timestampMs,
      });
      emit('recordExemplar', input.bucket, session, 'exemplar.metric_recorded', {
        metricName: input.metricName,
        value: input.value,
        traceId: input.traceId,
        spanId: input.spanId,
        exemplarCount: session.exemplar.exemplars.length,
      });
      return {
        metricName: input.metricName,
        value: input.value,
        traceId: input.traceId,
        spanId: input.spanId,
        exemplarCount: session.exemplar.exemplars.length,
      };
    },

    async attachTraceToMetric(input: {
      bucket: string;
      metricName: string;
      traceId: string;
      spanId: string;
    }): Promise<{ metricName: string; traceId: string; spanId: string }> {
      const session = requireBucket(input.bucket);
      exemplarAttachTraceToMetric(session.exemplar, {
        metricName: input.metricName,
        traceId: input.traceId,
        spanId: input.spanId,
      });
      emit('attachTraceToMetric', input.bucket, session, 'exemplar.trace_attached', {
        metricName: input.metricName,
        traceId: input.traceId,
        spanId: input.spanId,
      });
      return {
        metricName: input.metricName,
        traceId: input.traceId,
        spanId: input.spanId,
      };
    },

    async resolveMetricToTrace(input: {
      bucket: string;
      metricName: string;
    }): Promise<MetricToTraceResult> {
      const session = requireBucket(input.bucket);
      const { traceIds } = exemplarResolveMetricToTrace(session.exemplar, {
        metricName: input.metricName,
      });
      emit(
        'resolveMetricToTrace',
        input.bucket,
        session,
        'exemplar.metric_to_trace_resolved',
        {
          metricName: input.metricName,
          matchedCount: traceIds.length,
        },
      );
      return {
        metricName: input.metricName,
        traceIds: Object.freeze(traceIds.slice()),
        matchedCount: traceIds.length,
      };
    },

    async resolveTraceToMetric(input: {
      bucket: string;
      traceId: string;
    }): Promise<TraceToMetricResult> {
      const session = requireBucket(input.bucket);
      const { metricNames } = exemplarResolveTraceToMetric(session.exemplar, {
        traceId: input.traceId,
      });
      emit(
        'resolveTraceToMetric',
        input.bucket,
        session,
        'exemplar.trace_to_metric_resolved',
        {
          traceId: input.traceId,
          matchedCount: metricNames.length,
        },
      );
      return {
        traceId: input.traceId,
        metricNames: Object.freeze(metricNames.slice()),
        matchedCount: metricNames.length,
      };
    },

    async propagateBaggage(input: {
      bucket: string;
      entries: Record<string, string>;
    }): Promise<PropagateBaggageResult> {
      const session = requireBucket(input.bucket);
      const step = otelPropagateBaggage(session.otel, input.entries);
      emit('propagateBaggage', input.bucket, session, step.neutralEvent, {
        entryCount: Object.keys(session.otel.baggage).length,
        addedKeys: Object.keys(input.entries).join(','),
      });
      return {
        entryCount: Object.keys(session.otel.baggage).length,
        addedKeys: Object.freeze(Object.keys(input.entries).slice()),
      };
    },

    async extractW3CContext(input: {
      bucket: string;
      headers: W3CContextInput;
    }): Promise<ExtractW3CResult> {
      const session = requireBucket(input.bucket);
      const headers: { traceparent: string; tracestate?: string } = {
        traceparent: input.headers.traceparent,
      };
      if (input.headers.tracestate !== undefined) {
        headers.tracestate = input.headers.tracestate;
      }
      const step = otelExtractW3CContext(session.otel, headers);
      const [version, traceId, spanId, flags] = input.headers.traceparent.split('-') as [
        string,
        string,
        string,
        string,
      ];
      emit('extractW3CContext', input.bucket, session, step.neutralEvent, {
        version,
        traceId,
        spanId,
        flags,
        hasTracestate: input.headers.tracestate !== undefined,
      });
      return {
        version,
        traceId,
        spanId,
        flags,
        hasTracestate: input.headers.tracestate !== undefined,
      };
    },

    async exportOtlp(input: {
      bucket: string;
      profile: PipelineProfile;
      itemCount: number;
    }): Promise<ExportOtlpResult> {
      const session = requireBucket(input.bucket);
      session.exports.push({ profile: input.profile, itemCount: input.itemCount });
      const endpointUrl = mockCollectorUrlFor(input.profile);
      emit('exportOtlp', input.bucket, session, 'otel.otlp_exported', {
        profile: input.profile,
        endpointUrl,
        itemCount: input.itemCount,
        contentType: 'application/x-protobuf',
      });
      return {
        profile: input.profile,
        endpointUrl,
        itemCount: input.itemCount,
        contentType: 'application/x-protobuf',
      };
    },

    async queryJaegerTrace(input: {
      bucket: string;
      traceId: string;
    }): Promise<QueryJaegerResult> {
      const session = requireBucket(input.bucket);
      // The mock walks the enqueued spans to count how many belong to
      // this traceId — enough to make the query observable without a
      // real Jaeger. In production the real adapter hits the Jaeger
      // HTTP API.
      const spanCount = session.otel.batches
        .flat()
        .filter((s) => (s.attributes['trace.id'] ?? '') === input.traceId).length;
      emit('queryJaegerTrace', input.bucket, session, 'otel.jaeger_trace_queried', {
        traceId: input.traceId,
        serviceName: session.otel.serviceName,
        spanCount,
      });
      return {
        traceId: input.traceId,
        serviceName: session.otel.serviceName,
        spanCount,
      };
    },

    async queryPromExemplars(input: {
      bucket: string;
      metricName: string;
    }): Promise<QueryPromExemplarsResult> {
      const session = requireBucket(input.bucket);
      const traceIds = session.exemplar.exemplars
        .filter((e) => e.metricName === input.metricName)
        .map((e) => e.traceId);
      emit('queryPromExemplars', input.bucket, session, 'otel.prom_exemplars_scanned', {
        metricName: input.metricName,
        exemplarCount: traceIds.length,
      });
      return {
        metricName: input.metricName,
        exemplarCount: traceIds.length,
        traceIds: Object.freeze(traceIds.slice()),
      };
    },

    async emitCorrelatedLog(input: {
      bucket: string;
      traceId: string;
      message: string;
      level: 'info' | 'warn' | 'error';
    }): Promise<{ traceId: string; message: string; level: 'info' | 'warn' | 'error' }> {
      const session = requireBucket(input.bucket);
      logEmitStructuredLog(session.logs, {
        level: input.level,
        message: input.message,
        traceId: input.traceId,
        spanId: null,
        labels: { bucket: input.bucket },
        timestampMs: Date.now(),
      });
      emit('emitCorrelatedLog', input.bucket, session, 'logcorr.structured_log_emitted', {
        traceId: input.traceId,
        level: input.level,
        messageLength: input.message.length,
        logCount: session.logs.logs.length,
      });
      return {
        traceId: input.traceId,
        message: input.message,
        level: input.level,
      };
    },

    async reset(): Promise<void> {
      buckets.clear();
      traceLog.length = 0;
    },

    trace(): TraceEvent[] {
      return traceLog.slice();
    },
  };
}

/**
 * Map a neutral event to its provider-specific dialect. The observability
 * v2.1 package exposes `providerEventName` inside `types.ts` but that
 * symbol lives inside `semantics/` internals and is not re-exported. The
 * mock adapter uses its own minimal mapping — the fidelity harness only
 * needs the neutral event name for parity assertions, but the provider
 * event is emitted so the trace remains inspectable.
 */
function providerEventFor(target: ObservabilityTarget, neutralEvent: string): string {
  const prefix = target === 'grafana-oss' ? 'grafana' : target;
  return `${prefix}.${neutralEvent}`;
}

/**
 * Mock OTLP endpoint URL for a pipeline profile. Real adapter overrides
 * with the actual Collector URL from `KIWA_OTEL_COLLECTOR_URL`; mock
 * leaves an `in-memory://` scheme so the trace makes clear the export
 * did not hit a real backend.
 */
function mockCollectorUrlFor(profile: PipelineProfile): string {
  const suffix =
    profile === 'traces'
      ? 'v1/traces'
      : profile === 'metrics'
        ? 'v1/metrics'
        : 'v1/logs';
  return `${DEFAULT_COLLECTOR_ENDPOINT}/${suffix}`;
}
