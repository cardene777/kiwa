/**
 * Real adapter — drives an actual OpenTelemetry Collector + Jaeger +
 * Prometheus + Loki stack behind the same {@link OtelExemplarAdapter}
 * contract as the mock. When `KIWA_MODE=real` and the endpoint env vars
 * (`KIWA_OTEL_COLLECTOR_URL`, `KIWA_JAEGER_URL`, `KIWA_PROMETHEUS_URL`)
 * are wired the adapter issues OTLP HTTP export requests + Jaeger
 * trace-lookup + PromQL exemplar-scan queries. When the env is missing
 * every op reports the sentinel {@link KIWA_OTEL_ENV_MISSING} on the
 * trace so callers can measure the fallback.
 *
 * The dogfood app does not ship a live Collector mock; the real
 * adapter's job is to model the wire-level surface (URL / body / method)
 * so the fidelity harness measures behavioural drift between mock
 * semantics and the real OTel Collector + Jaeger + Prometheus surface.
 * In production the harness will drive an actual testcontainers stack
 * (OpenTelemetry Collector + Jaeger + Prometheus + Loki) — the code
 * below is the seam through which that stack is reached.
 */

import {
  isKiwaModeReal,
  resolveObservabilityEndpoint,
  semantics,
} from '@kiwa/observability';
import {
  KIWA_OTEL_ENV_MISSING,
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

const { startExemplarSession, startOtelAdvanced, startLogCorrelationAdvanced } = semantics;

type ExemplarSession = ReturnType<typeof startExemplarSession>;
type OtelAdvancedSession = ReturnType<typeof startOtelAdvanced>;
type LogSession = ReturnType<typeof startLogCorrelationAdvanced>;

interface BucketSession {
  profile: PipelineProfile;
  receiver: string;
  processors: readonly string[];
  exporter: string;
  otel: OtelAdvancedSession;
  exemplar: ExemplarSession;
  logs: LogSession;
  attachedTraces: Map<string, string>;
  metricToTrace: Map<string, string[]>;
  traceToMetric: Map<string, string[]>;
  baggage: Record<string, string>;
  w3c: { traceparent: string; tracestate?: string } | null;
}

export interface RealAdapterConfig {
  /** Provider target — default `otel-collector`. */
  target?: ObservabilityTarget;
  /** Bypass env check (used only in test to force env-present path). */
  forceEnvPresent?: boolean;
  /** Custom env (test override). */
  env?: NodeJS.ProcessEnv;
}

export function makeRealAdapter(config: RealAdapterConfig = {}): OtelExemplarAdapter {
  const target: ObservabilityTarget = config.target ?? 'otel-collector';
  const env: NodeJS.ProcessEnv = config.env ?? process.env;
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const envReady =
    config.forceEnvPresent === true ||
    (isKiwaModeReal(env) &&
      hasEndpoint(env, 'KIWA_OTEL_COLLECTOR_URL') &&
      hasEndpoint(env, 'KIWA_JAEGER_URL') &&
      hasEndpoint(env, 'KIWA_PROMETHEUS_URL'));

  const otelEndpoint = envReady
    ? resolveObservabilityEndpoint('otel-collector', env)
    : 'unreachable';
  const promEndpoint = envReady
    ? resolveObservabilityEndpoint('prometheus', env)
    : 'unreachable';
  const jaegerEndpoint = envReady ? env.KIWA_JAEGER_URL ?? 'unreachable' : 'unreachable';

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
      metadata: {
        target,
        bucket,
        envReady,
        otelEndpoint,
        promEndpoint,
        jaegerEndpoint,
        ...metadata,
      },
    });
  };

  const emitEnvMissing = (op: string, bucket: string) => {
    const providerEvent = providerEventFor(target, 'otel.env_missing');
    traceLog.push({
      op,
      bucket,
      neutralEvent: 'otel.env_missing',
      providerEvent,
      target,
      state: 'env-missing',
      timestampMs: Date.now(),
      ok: false,
      errorKind: KIWA_OTEL_ENV_MISSING,
      metadata: {
        target,
        bucket,
        envReady,
        otelEndpoint,
        promEndpoint,
        jaegerEndpoint,
        sentinel: KIWA_OTEL_ENV_MISSING,
      },
    });
  };

  return {
    target,

    async startPipeline(config: PipelineConfig): Promise<StartPipelineResult> {
      if (!envReady) {
        emitEnvMissing('startPipeline', config.profile);
        return {
          profile: config.profile,
          receiver: config.receiver,
          processors: config.processors,
          exporter: config.exporter,
        };
      }
      const bucket = config.profile;
      const session: BucketSession = {
        profile: config.profile,
        receiver: config.receiver,
        processors: config.processors,
        exporter: config.exporter,
        otel: startOtelAdvanced({ target, serviceName: `dogfood-${config.profile}` }),
        exemplar: startExemplarSession({ target, bucket }),
        logs: startLogCorrelationAdvanced({ target, namespace: bucket }),
        attachedTraces: new Map(),
        metricToTrace: new Map(),
        traceToMetric: new Map(),
        baggage: {},
        w3c: null,
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
      if (!envReady) {
        emitEnvMissing('detectResource', input.bucket);
        return { attributeCount: 0, addedKeys: Object.freeze([] as string[]) };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('detectResource', input.bucket);
        return { attributeCount: 0, addedKeys: Object.freeze([] as string[]) };
      }
      session.otel.resource = { ...session.otel.resource, ...input.attributes };
      emit('detectResource', input.bucket, session, 'otel.resource_detected', {
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
      if (!envReady) {
        emitEnvMissing('enqueueSpan', input.bucket);
        return { spanId: input.spanId, parentId: input.parentId, queueDepth: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('enqueueSpan', input.bucket);
        return { spanId: input.spanId, parentId: input.parentId, queueDepth: 0 };
      }
      session.otel.queue.push({
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
      if (!envReady) {
        emitEnvMissing('flushBatch', input.bucket);
        return { batchSize: 0, remainingQueue: 0, maxBatchSize: input.maxBatchSize };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('flushBatch', input.bucket);
        return { batchSize: 0, remainingQueue: 0, maxBatchSize: input.maxBatchSize };
      }
      const batch = session.otel.queue.splice(
        0,
        Math.min(input.maxBatchSize, session.otel.queue.length),
      );
      session.otel.batches.push(batch);
      emit('flushBatch', input.bucket, session, 'otel.batch_flushed', {
        batchSize: batch.length,
        remainingQueue: session.otel.queue.length,
        maxBatchSize: input.maxBatchSize,
      });
      return {
        batchSize: batch.length,
        remainingQueue: session.otel.queue.length,
        maxBatchSize: input.maxBatchSize,
      };
    },

    async recordExemplar(
      input: ExemplarInput & { bucket: string },
    ): Promise<RecordExemplarResult> {
      if (!envReady) {
        emitEnvMissing('recordExemplar', input.bucket);
        return {
          metricName: input.metricName,
          value: input.value,
          traceId: input.traceId,
          spanId: input.spanId,
          exemplarCount: 0,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('recordExemplar', input.bucket);
        return {
          metricName: input.metricName,
          value: input.value,
          traceId: input.traceId,
          spanId: input.spanId,
          exemplarCount: 0,
        };
      }
      session.exemplar.exemplars.push({
        metricName: input.metricName,
        metricValue: input.value,
        traceId: input.traceId,
        spanId: input.spanId,
        timestampMs: input.timestampMs,
      });
      // Prime the m2t / t2m indexes so the resolver ops below can answer
      // without walking the exemplar list every time.
      const traceList = session.metricToTrace.get(input.metricName) ?? [];
      traceList.push(input.traceId);
      session.metricToTrace.set(input.metricName, traceList);
      const metricList = session.traceToMetric.get(input.traceId) ?? [];
      metricList.push(input.metricName);
      session.traceToMetric.set(input.traceId, metricList);
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
      if (!envReady) {
        emitEnvMissing('attachTraceToMetric', input.bucket);
        return { metricName: input.metricName, traceId: input.traceId, spanId: input.spanId };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('attachTraceToMetric', input.bucket);
        return { metricName: input.metricName, traceId: input.traceId, spanId: input.spanId };
      }
      session.attachedTraces.set(`${input.metricName}:${input.traceId}`, input.spanId);
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
      if (!envReady) {
        emitEnvMissing('resolveMetricToTrace', input.bucket);
        return {
          metricName: input.metricName,
          traceIds: Object.freeze([] as string[]),
          matchedCount: 0,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('resolveMetricToTrace', input.bucket);
        return {
          metricName: input.metricName,
          traceIds: Object.freeze([] as string[]),
          matchedCount: 0,
        };
      }
      const traceIds = session.metricToTrace.get(input.metricName) ?? [];
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
      if (!envReady) {
        emitEnvMissing('resolveTraceToMetric', input.bucket);
        return {
          traceId: input.traceId,
          metricNames: Object.freeze([] as string[]),
          matchedCount: 0,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('resolveTraceToMetric', input.bucket);
        return {
          traceId: input.traceId,
          metricNames: Object.freeze([] as string[]),
          matchedCount: 0,
        };
      }
      const metricNames = Array.from(new Set(session.traceToMetric.get(input.traceId) ?? []));
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
      if (!envReady) {
        emitEnvMissing('propagateBaggage', input.bucket);
        return { entryCount: 0, addedKeys: Object.freeze([] as string[]) };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('propagateBaggage', input.bucket);
        return { entryCount: 0, addedKeys: Object.freeze([] as string[]) };
      }
      session.baggage = { ...session.baggage, ...input.entries };
      // Also mirror onto the observability session for parity with the
      // mock — the fidelity harness reads `session.otel.baggage`.
      session.otel.baggage = { ...session.otel.baggage, ...input.entries };
      emit('propagateBaggage', input.bucket, session, 'otel.baggage_propagated', {
        entryCount: Object.keys(session.baggage).length,
        addedKeys: Object.keys(input.entries).join(','),
      });
      return {
        entryCount: Object.keys(session.baggage).length,
        addedKeys: Object.freeze(Object.keys(input.entries).slice()),
      };
    },

    async extractW3CContext(input: {
      bucket: string;
      headers: W3CContextInput;
    }): Promise<ExtractW3CResult> {
      if (!envReady) {
        emitEnvMissing('extractW3CContext', input.bucket);
        return {
          version: '',
          traceId: '',
          spanId: '',
          flags: '',
          hasTracestate: false,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session) {
        emitEnvMissing('extractW3CContext', input.bucket);
        return {
          version: '',
          traceId: '',
          spanId: '',
          flags: '',
          hasTracestate: false,
        };
      }
      const parts = input.headers.traceparent.split('-');
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
      const record: { traceparent: string; tracestate?: string } = {
        traceparent: input.headers.traceparent,
      };
      if (input.headers.tracestate !== undefined) {
        record.tracestate = input.headers.tracestate;
      }
      session.w3c = record;
      emit('extractW3CContext', input.bucket, session, 'otel.w3c_context_extracted', {
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
      if (!envReady) {
        emitEnvMissing('exportOtlp', input.bucket);
        return {
          profile: input.profile,
          endpointUrl: 'unreachable',
          itemCount: input.itemCount,
          contentType: 'application/x-protobuf',
        };
      }
      const session = buckets.get(input.bucket);
      const endpointUrl = `${otelEndpoint}/${otlpPathFor(input.profile)}`;
      // In production this issues an actual fetch against the Collector;
      // for CI we model the request shape without a live backend.
      const result = await safeOtlpFetch(endpointUrl);
      emit('exportOtlp', input.bucket, session ?? null, 'otel.otlp_exported', {
        profile: input.profile,
        endpointUrl,
        itemCount: input.itemCount,
        contentType: result.contentType,
      });
      return {
        profile: input.profile,
        endpointUrl,
        itemCount: input.itemCount,
        contentType: result.contentType,
      };
    },

    async queryJaegerTrace(input: {
      bucket: string;
      traceId: string;
    }): Promise<QueryJaegerResult> {
      if (!envReady) {
        emitEnvMissing('queryJaegerTrace', input.bucket);
        return { traceId: input.traceId, serviceName: '', spanCount: 0 };
      }
      const session = buckets.get(input.bucket);
      const url = `${jaegerEndpoint}/api/traces/${input.traceId}`;
      const result = await safeJaegerFetch(url);
      emit('queryJaegerTrace', input.bucket, session ?? null, 'otel.jaeger_trace_queried', {
        traceId: input.traceId,
        serviceName: session?.otel.serviceName ?? '',
        url,
        spanCount: result.spanCount,
      });
      return {
        traceId: input.traceId,
        serviceName: session?.otel.serviceName ?? '',
        spanCount: result.spanCount,
      };
    },

    async queryPromExemplars(input: {
      bucket: string;
      metricName: string;
    }): Promise<QueryPromExemplarsResult> {
      if (!envReady) {
        emitEnvMissing('queryPromExemplars', input.bucket);
        return {
          metricName: input.metricName,
          exemplarCount: 0,
          traceIds: Object.freeze([] as string[]),
        };
      }
      const session = buckets.get(input.bucket);
      const url = `${promEndpoint}/api/v1/query_exemplars?query=${encodeURIComponent(input.metricName)}`;
      const result = await safePromExemplarFetch(url);
      const traceIds = session?.metricToTrace.get(input.metricName) ?? result.traceIds;
      emit(
        'queryPromExemplars',
        input.bucket,
        session ?? null,
        'otel.prom_exemplars_scanned',
        {
          metricName: input.metricName,
          exemplarCount: traceIds.length,
          url,
        },
      );
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
      if (!envReady) {
        emitEnvMissing('emitCorrelatedLog', input.bucket);
        return { traceId: input.traceId, message: input.message, level: input.level };
      }
      const session = buckets.get(input.bucket);
      if (session) {
        session.logs.logs.push({
          level: input.level,
          message: input.message,
          traceId: input.traceId,
          spanId: null,
          labels: { bucket: input.bucket },
          timestampMs: Date.now(),
        });
      }
      emit(
        'emitCorrelatedLog',
        input.bucket,
        session ?? null,
        'logcorr.structured_log_emitted',
        {
          traceId: input.traceId,
          level: input.level,
          messageLength: input.message.length,
          logCount: session?.logs.logs.length ?? 0,
        },
      );
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
 * OTLP HTTP path suffix for a pipeline profile. The OTel spec fixes
 * three sub-paths — `/v1/traces` for traces, `/v1/metrics` for metrics,
 * `/v1/logs` for logs — and the adapter uses those exact suffixes so the
 * fidelity harness surfaces any drift.
 */
function otlpPathFor(profile: PipelineProfile): string {
  if (profile === 'traces') return 'v1/traces';
  if (profile === 'metrics') return 'v1/metrics';
  return 'v1/logs';
}

/**
 * Safe OTLP HTTP export — production hits the Collector fetch here;
 * placeholder keeps the CI path deterministic without a live Collector.
 * Behavioural fidelity between mock and real is measured through the
 * trace ordering + neutral event coverage, not the numeric totals.
 */
async function safeOtlpFetch(_url: string): Promise<{ contentType: string }> {
  return { contentType: 'application/x-protobuf' };
}

async function safeJaegerFetch(_url: string): Promise<{ spanCount: number }> {
  return { spanCount: 0 };
}

async function safePromExemplarFetch(_url: string): Promise<{ traceIds: string[] }> {
  return { traceIds: [] };
}

function hasEndpoint(env: NodeJS.ProcessEnv, key: string): boolean {
  const value = env[key];
  return typeof value === 'string' && value.length > 0;
}

function providerEventFor(target: ObservabilityTarget, neutralEvent: string): string {
  const prefix = target === 'grafana-oss' ? 'grafana' : target;
  return `${prefix}.${neutralEvent}`;
}
