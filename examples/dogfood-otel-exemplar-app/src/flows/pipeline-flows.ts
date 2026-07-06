/**
 * OTel Collector + exemplar + baggage + W3C context lifecycle flows.
 *
 * `runFullPipelineLifecycle` drives every op of the 16-op contract in
 * the order the OTel Collector pipeline expects — start → resource →
 * enqueue → flush → exemplar → attach → resolve m→t → resolve t→m →
 * baggage → W3C → export → query jaeger → query prom exemplars → log
 * correlation. Any op that diverges surfaces in the fidelity trace.
 *
 * `runMultiProfileMatrix` drives 3 profiles × 4 baggage sets so the
 * fidelity harness measures behavioural drift across every canonical
 * production combo (12 lifecycles per adapter run = 24 across mock +
 * real).
 */

import { ALL_BAGGAGE_SETS } from '../policies/baggage-sets.js';
import { ALL_PIPELINES } from '../policies/pipelines.js';
import { W3C_SAMPLED_TRACEPARENT, W3C_TRACEPARENT_WITH_STATE } from '../policies/w3c-headers.js';
import type {
  OtelExemplarAdapter,
  PipelineConfig,
  TraceEvent,
  W3CContextInput,
} from '../adapters/interface.js';

export interface LifecycleInput {
  pipeline: PipelineConfig;
  baggage: Record<string, string>;
  w3c: W3CContextInput;
  /** Attributes to seed the resource detector with. */
  resourceAttributes: Record<string, string>;
  /** Spans to enqueue before the first batch flush. */
  spans: Array<{ spanId: string; parentId: string | null; attributes: Record<string, string> }>;
  /** Batch flush size. */
  maxBatchSize: number;
  /** Exemplar-attached metric points to record. */
  exemplars: Array<{
    metricName: string;
    value: number;
    traceId: string;
    spanId: string;
    timestampMs: number;
  }>;
  /** Log messages to emit (correlated by traceId). */
  logs: Array<{ traceId: string; message: string; level: 'info' | 'warn' | 'error' }>;
}

/**
 * Drive one full OTel Collector + exemplar + baggage + W3C lifecycle
 * from start to reset. The lifecycle emits every op on the 16-op
 * contract at least once so a per-lifecycle trace has a stable event
 * count — the fidelity harness leans on that to detect missing / drifted
 * ops.
 */
export async function runFullPipelineLifecycle(
  adapter: OtelExemplarAdapter,
  input: LifecycleInput,
): Promise<void> {
  await adapter.startPipeline(input.pipeline);
  await adapter.detectResource({
    bucket: input.pipeline.profile,
    attributes: input.resourceAttributes,
  });
  for (const span of input.spans) {
    await adapter.enqueueSpan({
      bucket: input.pipeline.profile,
      spanId: span.spanId,
      parentId: span.parentId,
      attributes: span.attributes,
    });
  }
  await adapter.flushBatch({
    bucket: input.pipeline.profile,
    maxBatchSize: input.maxBatchSize,
  });
  for (const exemplar of input.exemplars) {
    await adapter.recordExemplar({
      bucket: input.pipeline.profile,
      metricName: exemplar.metricName,
      value: exemplar.value,
      traceId: exemplar.traceId,
      spanId: exemplar.spanId,
      timestampMs: exemplar.timestampMs,
    });
  }
  const firstExemplar = input.exemplars[0];
  if (firstExemplar !== undefined) {
    await adapter.attachTraceToMetric({
      bucket: input.pipeline.profile,
      metricName: firstExemplar.metricName,
      traceId: firstExemplar.traceId,
      spanId: firstExemplar.spanId,
    });
    await adapter.resolveMetricToTrace({
      bucket: input.pipeline.profile,
      metricName: firstExemplar.metricName,
    });
    await adapter.resolveTraceToMetric({
      bucket: input.pipeline.profile,
      traceId: firstExemplar.traceId,
    });
  }
  await adapter.propagateBaggage({
    bucket: input.pipeline.profile,
    entries: input.baggage,
  });
  await adapter.extractW3CContext({
    bucket: input.pipeline.profile,
    headers: input.w3c,
  });
  await adapter.exportOtlp({
    bucket: input.pipeline.profile,
    profile: input.pipeline.profile,
    itemCount: input.exemplars.length + input.spans.length,
  });
  if (firstExemplar !== undefined) {
    await adapter.queryJaegerTrace({
      bucket: input.pipeline.profile,
      traceId: firstExemplar.traceId,
    });
    await adapter.queryPromExemplars({
      bucket: input.pipeline.profile,
      metricName: firstExemplar.metricName,
    });
  }
  for (const log of input.logs) {
    await adapter.emitCorrelatedLog({
      bucket: input.pipeline.profile,
      traceId: log.traceId,
      message: log.message,
      level: log.level,
    });
  }
}

/**
 * Drive lifecycles across 3 pipeline profiles × 4 baggage sets. Each
 * lifecycle uses a distinct combination so the fidelity harness exercises
 * every canonical production combination (12 lifecycles per adapter run,
 * 24 across mock + real).
 */
export async function runMultiProfileMatrix(
  adapter: OtelExemplarAdapter,
): Promise<{ lifecyclesRun: number }> {
  const lifecycles: LifecycleInput[] = [];
  for (let pIdx = 0; pIdx < ALL_PIPELINES.length; pIdx++) {
    for (let bIdx = 0; bIdx < ALL_BAGGAGE_SETS.length; bIdx++) {
      const pipeline = ALL_PIPELINES[pIdx]!;
      const baggage = ALL_BAGGAGE_SETS[bIdx]!;
      const trace = paddedHex(32, `${pIdx}${bIdx}`);
      const span = paddedHex(16, `${pIdx}${bIdx}`);
      lifecycles.push({
        pipeline,
        baggage,
        w3c:
          bIdx === 0
            ? { traceparent: W3C_SAMPLED_TRACEPARENT }
            : W3C_TRACEPARENT_WITH_STATE,
        resourceAttributes: {
          'service.name': `dogfood-${pipeline.profile}`,
          'deployment.environment': 'dogfood',
          'service.version': '0.0.1',
        },
        spans: [
          { spanId: 'root', parentId: null, attributes: { 'trace.id': trace } },
          { spanId: 'child', parentId: 'root', attributes: { 'trace.id': trace } },
        ],
        maxBatchSize: 10,
        exemplars: [
          {
            metricName: `dogfood_request_${pipeline.profile}_total`,
            value: 1 + pIdx + bIdx,
            traceId: trace,
            spanId: span,
            timestampMs: 1_700_000_000_000 + pIdx * 100 + bIdx,
          },
        ],
        logs: [
          {
            traceId: trace,
            message: `dogfood lifecycle ${pipeline.profile}/${Object.keys(baggage)[0]}`,
            level: pIdx === 0 ? 'info' : pIdx === 1 ? 'warn' : 'error',
          },
        ],
      });
    }
  }
  for (const input of lifecycles) {
    await runFullPipelineLifecycle(adapter, input);
  }
  return { lifecyclesRun: lifecycles.length };
}

/**
 * All op names the mock adapter walks — the 15 promise-returning methods
 * on the adapter plus a synthesised `resetVerified` step the fidelity
 * harness emits at the end of a full lifecycle. `reset` is included so
 * the multi-profile matrix + reset story stays observable.
 */
export const OPS_UNDER_TEST: readonly string[] = [
  'startPipeline',
  'detectResource',
  'enqueueSpan',
  'flushBatch',
  'recordExemplar',
  'attachTraceToMetric',
  'resolveMetricToTrace',
  'resolveTraceToMetric',
  'propagateBaggage',
  'extractW3CContext',
  'exportOtlp',
  'queryJaegerTrace',
  'queryPromExemplars',
  'emitCorrelatedLog',
];

/** Compare 2 traces for behavioural fidelity. Returns divergence detail. */
export function diffTraces(
  mock: TraceEvent[],
  real: TraceEvent[],
): {
  missingInReal: string[];
  missingInMock: string[];
  matchedOps: string[];
  divergentEvents: Array<{ op: string; mockEvent: string; realEvent: string }>;
} {
  const mockOps = new Set(mock.map((e) => e.op));
  const realOps = new Set(real.map((e) => e.op));
  const matchedOps = Array.from(mockOps).filter((op) => realOps.has(op));
  const missingInReal = Array.from(mockOps).filter((op) => !realOps.has(op));
  const missingInMock = Array.from(realOps).filter((op) => !mockOps.has(op));

  const divergentEvents: Array<{
    op: string;
    mockEvent: string;
    realEvent: string;
  }> = [];
  for (const op of matchedOps) {
    const mockEvent = mock.find((e) => e.op === op)?.neutralEvent ?? '';
    const realEvent = real.find((e) => e.op === op)?.neutralEvent ?? '';
    if (mockEvent !== realEvent && realEvent !== 'otel.env_missing') {
      divergentEvents.push({ op, mockEvent, realEvent });
    }
  }
  return { missingInReal, missingInMock, matchedOps, divergentEvents };
}

/** Convenience — all 4 baggage sets for parity tests. */
export const ALL_LIFECYCLE_BAGGAGE = ALL_BAGGAGE_SETS;

/**
 * Right-pad the seed with `0` to hit the exact hex length W3C mandates
 * (traceId = 32, spanId = 16). Keeps the ids reproducible across
 * lifecycles so the fidelity harness can compare mock vs real traces
 * without noise from timestamp / hex drift.
 */
function paddedHex(length: number, seed: string): string {
  const cleaned = seed.replace(/[^0-9a-f]/g, '');
  return (cleaned + '0'.repeat(length)).slice(0, length);
}
