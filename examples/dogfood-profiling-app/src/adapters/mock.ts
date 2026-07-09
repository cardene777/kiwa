/**
 * Mock adapter — drives `@kiwa-lab/observability` v2.1 `semantics/profiling`
 * + `semantics/cardinality` state machines deterministically without any
 * backend. The same app code exercises a full continuous-profiling
 * lifecycle (session start → resource → sample per kind → flame → drill
 * → compare → cardinality → export → query) without launching Pyroscope
 * or Parca.
 *
 * State model — one {@link BucketSession} per bucket; sessions are
 * isolated so multi-backend harnesses can run pyroscope / parca / ebpf
 * side-by-side without state leakage. That mirrors how production
 * continuous-profiling pipelines keep per-service state.
 *
 * The mock adapter piggy-backs on the same neutral event vocabulary
 * that `@kiwa-lab/observability` v2.1 profiling semantics emit — every
 * op appends the matching neutral event onto the trace so the fidelity
 * harness can assert both adapters produce identical event orderings.
 */

import { semantics } from '@kiwa-lab/observability';
import {
  type BuildFlameGraphResult,
  type CardinalityGuardResult,
  type CompareFlameGraphsResult,
  type DetectResourceResult,
  type DrillDownResult,
  type ExportResult,
  type IngestSampleResult,
  type LoadEbpfProgramResult,
  type ObservabilityTarget,
  type ProfileKind,
  type ProfilerBackend,
  type ProfilingAdapter,
  type ProfilingSessionConfig,
  type QueryParcaResult,
  type QueryPyroscopeResult,
  type SampleInput,
  type StartSessionResult,
  type TraceEvent,
} from './interface.js';

const {
  buildFlameGraph: profilingBuildFlameGraph,
  detectHighCardinality,
  flattenFlameGraph,
  sampleCpu: profilingSampleCpu,
  sampleMemory: profilingSampleMemory,
  sampleOffCpu: profilingSampleOffCpu,
  scanSeries,
  startCardinalitySession,
  startProfiling,
} = semantics;

type ProfilingSession = ReturnType<typeof startProfiling>;
type CardinalitySession = ReturnType<typeof startCardinalitySession>;

/**
 * Per-bucket session state — one profiling session per bucket, plus the
 * cardinality guard session that rides alongside. Buckets isolate
 * profiler backends (pyroscope / parca / ebpf) so the multi-backend
 * fidelity matrix can drive 3 backends without state leakage.
 */
interface BucketSession {
  backend: ProfilerBackend;
  serviceName: string;
  sampleRateHz: number;
  /** One profiling session per profile kind (cpu / off-cpu / memory / lock). */
  perKind: Map<ProfileKind, ProfilingSession>;
  cardinality: CardinalitySession;
  resource: Record<string, string>;
  /** Loaded eBPF programs (attach state). */
  ebpfPrograms: Map<string, number[]>;
  /** Baseline sample cache for compareFlameGraphs. */
  baseline: Map<ProfileKind, SampleInput[]>;
}

const DEFAULT_INGEST_ENDPOINT = 'in-memory://profiler-ingest';

/**
 * Build a mock profiling adapter. `target` selects the provider
 * vocabulary in the emitted trace; the default `grafana-oss` gives the
 * fidelity harness a natural label for the mock leg of the diff
 * (pyroscope is a Grafana-family product).
 */
export function makeMockAdapter(
  input: { target?: ObservabilityTarget } = {},
): ProfilingAdapter {
  const target: ObservabilityTarget = input.target ?? 'grafana-oss';
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
      state: session ? 'active' : 'idle',
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

  const kindSession = (session: BucketSession, kind: ProfileKind): ProfilingSession => {
    let s = session.perKind.get(kind);
    if (!s) {
      s = startProfiling({ target, serviceName: session.serviceName });
      session.perKind.set(kind, s);
    }
    return s;
  };

  return {
    target,

    async startSession(config: ProfilingSessionConfig): Promise<StartSessionResult> {
      if (config.sampleRateHz <= 0) {
        throw new Error('startSession: sampleRateHz must be positive');
      }
      const bucket = config.backend;
      const session: BucketSession = {
        backend: config.backend,
        serviceName: config.serviceName,
        sampleRateHz: config.sampleRateHz,
        perKind: new Map(),
        cardinality: startCardinalitySession({ target, scopeId: bucket }),
        resource: {},
        ebpfPrograms: new Map(),
        baseline: new Map(),
      };
      buckets.set(bucket, session);
      emit('startSession', bucket, session, 'profile.session_started', {
        backend: config.backend,
        serviceName: config.serviceName,
        sampleRateHz: config.sampleRateHz,
      });
      return {
        backend: config.backend,
        serviceName: config.serviceName,
        sampleRateHz: config.sampleRateHz,
      };
    },

    async detectResource(input: {
      bucket: string;
      attributes: Record<string, string>;
    }): Promise<DetectResourceResult> {
      const session = requireBucket(input.bucket);
      const addedKeys: string[] = [];
      for (const [key, value] of Object.entries(input.attributes)) {
        if (!(key in session.resource)) {
          addedKeys.push(key);
        }
        session.resource[key] = value;
      }
      emit('detectResource', input.bucket, session, 'profile.resource_detected', {
        attributeCount: Object.keys(session.resource).length,
        addedKeys: addedKeys.join(','),
      });
      return {
        attributeCount: Object.keys(session.resource).length,
        addedKeys: Object.freeze(addedKeys.slice()),
      };
    },

    async ingestCpuSample(input: {
      bucket: string;
      sample: SampleInput;
    }): Promise<IngestSampleResult> {
      return ingestSample(input, 'cpu', requireBucket, kindSession, emit, profilingSampleCpu);
    },

    async ingestOffCpuSample(input: {
      bucket: string;
      sample: SampleInput;
    }): Promise<IngestSampleResult> {
      return ingestSample(
        input,
        'off-cpu',
        requireBucket,
        kindSession,
        emit,
        profilingSampleOffCpu,
      );
    },

    async ingestMemorySample(input: {
      bucket: string;
      sample: SampleInput;
    }): Promise<IngestSampleResult> {
      return ingestSample(
        input,
        'memory',
        requireBucket,
        kindSession,
        emit,
        profilingSampleMemory,
      );
    },

    async ingestLockSample(input: {
      bucket: string;
      sample: SampleInput;
    }): Promise<IngestSampleResult> {
      // Lock samples reuse the off-cpu semantics helper — mutex contention
      // is by definition an off-CPU wait — but we surface it as a
      // separate op + kind so the app can budget it independently.
      const session = requireBucket(input.bucket);
      const s = kindSession(session, 'lock');
      profilingSampleOffCpu(s, {
        stack: [...input.sample.stack],
        valueBytes: input.sample.valueBytes,
        timestampMs: input.sample.timestampMs,
      });
      emit('ingestLockSample', input.bucket, session, 'profile.lock_sampled', {
        kind: 'lock',
        sampleCount: s.samples.length,
        stackDepth: input.sample.stack.length,
        valueBytes: input.sample.valueBytes,
      });
      return {
        kind: 'lock',
        sampleCount: s.samples.length,
        stackDepth: input.sample.stack.length,
        valueBytes: input.sample.valueBytes,
      };
    },

    async buildFlameGraph(input: {
      bucket: string;
      kind: ProfileKind;
    }): Promise<BuildFlameGraphResult> {
      const session = requireBucket(input.bucket);
      const s = kindSession(session, input.kind);
      const semanticsKind = input.kind === 'lock' ? 'off-cpu' : input.kind;
      profilingBuildFlameGraph(s, { kind: semanticsKind });
      const flame = s.flameGraph;
      if (!flame) {
        throw new Error(`buildFlameGraph: mock: flame graph not produced for ${input.kind}`);
      }
      const flattened = flattenFlameGraph(flame);
      const maxDepth = flattened.reduce((m, n) => Math.max(m, n.depth), 0);
      emit('buildFlameGraph', input.bucket, session, 'profile.flame_graph_built', {
        kind: input.kind,
        rootValue: flame.totalValue,
        sampleCount: s.samples.filter((sm) => sm.kind === semanticsKind).length,
        branchCount: flame.children.size,
        maxDepth,
      });
      return {
        kind: input.kind,
        rootValue: flame.totalValue,
        sampleCount: s.samples.filter((sm) => sm.kind === semanticsKind).length,
        branchCount: flame.children.size,
        maxDepth,
      };
    },

    async drillDown(input: {
      bucket: string;
      kind: ProfileKind;
      focusFrame: string;
    }): Promise<DrillDownResult> {
      const session = requireBucket(input.bucket);
      const s = kindSession(session, input.kind);
      if (!s.flameGraph) {
        throw new Error('drillDown: flame graph must be built first');
      }
      const flattened = flattenFlameGraph(s.flameGraph);
      const matched = flattened.filter((n) => n.frame === input.focusFrame);
      const totalValue = matched.reduce((sum, n) => sum + n.totalValue, 0);
      emit('drillDown', input.bucket, session, 'profile.drill_down_resolved', {
        kind: input.kind,
        focusFrame: input.focusFrame,
        matchedNodes: matched.length,
        totalValue,
      });
      return {
        kind: input.kind,
        focusFrame: input.focusFrame,
        matchedNodes: matched.length,
        totalValue,
      };
    },

    async compareFlameGraphs(input: {
      bucket: string;
      kind: ProfileKind;
      baselineSamples: readonly SampleInput[];
    }): Promise<CompareFlameGraphsResult> {
      const session = requireBucket(input.bucket);
      session.baseline.set(input.kind, input.baselineSamples.slice());
      const s = kindSession(session, input.kind);
      const semanticsKind = input.kind === 'lock' ? 'off-cpu' : input.kind;
      const currentSamples = s.samples.filter((sm) => sm.kind === semanticsKind);
      const baselineFrames = collectFrames(input.baselineSamples);
      const currentFrames = collectFrames(currentSamples);
      const addedFrames = [...currentFrames].filter((f) => !baselineFrames.has(f));
      const removedFrames = [...baselineFrames].filter((f) => !currentFrames.has(f));
      const regressedFrames = detectRegressions(input.baselineSamples, currentSamples);
      const baselineTotal = input.baselineSamples.reduce((sum, sm) => sum + sm.valueBytes, 0);
      const currentTotal = currentSamples.reduce((sum, sm) => sum + sm.valueBytes, 0);
      emit('compareFlameGraphs', input.bucket, session, 'profile.flame_graphs_compared', {
        kind: input.kind,
        baselineTotal,
        currentTotal,
        addedCount: addedFrames.length,
        removedCount: removedFrames.length,
        regressedCount: regressedFrames.length,
      });
      return {
        kind: input.kind,
        baselineTotal,
        currentTotal,
        addedFrames: Object.freeze(addedFrames.slice()),
        removedFrames: Object.freeze(removedFrames.slice()),
        regressedFrames: Object.freeze(regressedFrames.slice()),
      };
    },

    async guardCardinality(input: {
      bucket: string;
      labels: Record<string, readonly string[]>;
      seriesBudget: number;
    }): Promise<CardinalityGuardResult> {
      const session = requireBucket(input.bucket);
      const series = expandFingerprints(input.labels);
      if (series.length > 0) {
        scanSeries(session.cardinality, series);
      }
      // The observability semantics helper takes a per-label threshold —
      // we convert the series budget to a per-label threshold by dividing
      // by the number of distinct labels (naive but consistent).
      const perLabelThreshold = Math.max(
        1,
        Math.floor(input.seriesBudget / Math.max(1, Object.keys(input.labels).length)),
      );
      const { findings } =
        series.length > 0
          ? detectHighCardinality(session.cardinality, { threshold: perLabelThreshold })
          : { findings: [] };
      const breached = findings.length > 0 || series.length > input.seriesBudget;
      emit('guardCardinality', input.bucket, session, 'cardinality.high_cardinality_detected', {
        labelCount: Object.keys(input.labels).length,
        seriesCount: series.length,
        seriesBudget: input.seriesBudget,
        breached,
      });
      return {
        labelCount: Object.keys(input.labels).length,
        seriesCount: series.length,
        breached,
      };
    },

    async exportProfiles(input: {
      bucket: string;
      kind: ProfileKind;
      itemCount: number;
    }): Promise<ExportResult> {
      const session = requireBucket(input.bucket);
      const endpointUrl = mockIngestUrlFor(session.backend, input.kind);
      emit('exportProfiles', input.bucket, session, 'profile.exported', {
        backend: session.backend,
        kind: input.kind,
        endpointUrl,
        itemCount: input.itemCount,
      });
      return {
        backend: session.backend,
        endpointUrl,
        itemCount: input.itemCount,
        contentType: contentTypeFor(session.backend),
      };
    },

    async queryPyroscope(input: {
      bucket: string;
      serviceName: string;
      kind: ProfileKind;
    }): Promise<QueryPyroscopeResult> {
      const session = requireBucket(input.bucket);
      const s = kindSession(session, input.kind);
      const semanticsKind = input.kind === 'lock' ? 'off-cpu' : input.kind;
      const matched = s.samples.filter((sm) => sm.kind === semanticsKind).length;
      emit('queryPyroscope', input.bucket, session, 'profile.pyroscope_queried', {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: matched,
      });
      return {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: matched,
      };
    },

    async queryParca(input: {
      bucket: string;
      serviceName: string;
      kind: ProfileKind;
    }): Promise<QueryParcaResult> {
      const session = requireBucket(input.bucket);
      const s = kindSession(session, input.kind);
      const semanticsKind = input.kind === 'lock' ? 'off-cpu' : input.kind;
      const matched = s.samples.filter((sm) => sm.kind === semanticsKind).length;
      emit('queryParca', input.bucket, session, 'profile.parca_queried', {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: matched,
      });
      return {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: matched,
      };
    },

    async loadEbpfProgram(input: {
      bucket: string;
      programName: string;
      attachedPids: readonly number[];
    }): Promise<LoadEbpfProgramResult> {
      const session = requireBucket(input.bucket);
      session.ebpfPrograms.set(input.programName, input.attachedPids.slice());
      emit('loadEbpfProgram', input.bucket, session, 'profile.ebpf_program_loaded', {
        programName: input.programName,
        attachedPidCount: input.attachedPids.length,
      });
      return {
        programName: input.programName,
        attachedPidCount: input.attachedPids.length,
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
 * Shared helper for cpu / off-cpu / memory sample ingest. Wraps the
 * observability semantics helper and emits the neutral event on the
 * mock trace.
 */
async function ingestSample(
  input: { bucket: string; sample: SampleInput },
  kind: ProfileKind,
  requireBucket: (b: string) => BucketSession,
  kindSession: (s: BucketSession, k: ProfileKind) => ProfilingSession,
  emit: (
    op: string,
    bucket: string,
    session: BucketSession | null,
    neutralEvent: string,
    metadata?: Record<string, string | number | boolean>,
  ) => void,
  semanticsFn: (
    s: ProfilingSession,
    input: { stack: string[]; valueBytes: number; timestampMs: number },
  ) => unknown,
): Promise<IngestSampleResult> {
  const session = requireBucket(input.bucket);
  const s = kindSession(session, kind);
  semanticsFn(s, {
    stack: [...input.sample.stack],
    valueBytes: input.sample.valueBytes,
    timestampMs: input.sample.timestampMs,
  });
  const semanticsKind = kind === 'lock' ? 'off-cpu' : kind;
  const sampleCount = s.samples.filter((sm) => sm.kind === semanticsKind).length;
  const neutralEvent =
    kind === 'cpu'
      ? 'profile.cpu_sampled'
      : kind === 'off-cpu'
        ? 'profile.off_cpu_sampled'
        : 'profile.memory_sampled';
  const op =
    kind === 'cpu'
      ? 'ingestCpuSample'
      : kind === 'off-cpu'
        ? 'ingestOffCpuSample'
        : 'ingestMemorySample';
  emit(op, input.bucket, session, neutralEvent, {
    kind,
    sampleCount,
    stackDepth: input.sample.stack.length,
    valueBytes: input.sample.valueBytes,
  });
  return {
    kind,
    sampleCount,
    stackDepth: input.sample.stack.length,
    valueBytes: input.sample.valueBytes,
  };
}

/**
 * Collect the unique frame set across a sample array — used by
 * compareFlameGraphs to compute added / removed frames.
 */
function collectFrames(samples: readonly SampleInput[] | readonly {
  kind: string;
  stack: string[];
}[]): Set<string> {
  const s = new Set<string>();
  for (const sm of samples) {
    for (const frame of sm.stack) {
      s.add(frame);
    }
  }
  return s;
}

/**
 * Detect frames where the current value is at least 20% higher than the
 * baseline (naive threshold for the mock; production would run a
 * differential flame algorithm).
 */
function detectRegressions(
  baseline: readonly SampleInput[],
  current: readonly { kind: string; stack: string[]; valueBytes: number }[],
): string[] {
  const totals = new Map<string, { base: number; curr: number }>();
  for (const sm of baseline) {
    for (const frame of sm.stack) {
      const entry = totals.get(frame) ?? { base: 0, curr: 0 };
      entry.base += sm.valueBytes;
      totals.set(frame, entry);
    }
  }
  for (const sm of current) {
    for (const frame of sm.stack) {
      const entry = totals.get(frame) ?? { base: 0, curr: 0 };
      entry.curr += sm.valueBytes;
      totals.set(frame, entry);
    }
  }
  const regressed: string[] = [];
  for (const [frame, { base, curr }] of totals) {
    if (base === 0) continue;
    if (curr >= base * 1.2) {
      regressed.push(frame);
    }
  }
  return regressed;
}

/**
 * Expand a labels map { k -> [v1, v2, ...] } into series fingerprints
 * for the cardinality session — every combination of label values is a
 * distinct time series.
 */
function expandFingerprints(
  labels: Record<string, readonly string[]>,
): Array<{ metricName: string; labels: Record<string, string> }> {
  const keys = Object.keys(labels);
  if (keys.length === 0) return [];
  let combos: Array<Record<string, string>> = [{}];
  for (const key of keys) {
    const values = labels[key] ?? [];
    const next: Array<Record<string, string>> = [];
    for (const combo of combos) {
      for (const value of values) {
        next.push({ ...combo, [key]: value });
      }
    }
    combos = next;
  }
  return combos.map((c) => ({ metricName: 'profile.samples', labels: c }));
}

/**
 * Map a neutral event to its provider-specific dialect for the mock
 * trace. The observability v2.1 package exposes `providerEventName`
 * inside `types.ts` but that symbol lives inside `semantics/` internals
 * and is not re-exported. The mock adapter uses its own minimal mapping
 * — the fidelity harness only needs the neutral event name for parity
 * assertions, but the provider event is emitted so the trace remains
 * inspectable.
 */
function providerEventFor(target: ObservabilityTarget, neutralEvent: string): string {
  const prefix = target === 'grafana-oss' ? 'grafana' : target;
  return `${prefix}.${neutralEvent}`;
}

/**
 * Mock ingest endpoint URL for a profiler backend. Real adapter
 * overrides with the actual pyroscope / parca URL from env; mock leaves
 * an `in-memory://` scheme so the trace makes clear the export did not
 * hit a real backend.
 */
function mockIngestUrlFor(backend: ProfilerBackend, kind: ProfileKind): string {
  return `${DEFAULT_INGEST_ENDPOINT}/${backend}/${kind}`;
}

function contentTypeFor(backend: ProfilerBackend): string {
  switch (backend) {
    case 'pyroscope':
      return 'application/octet-stream';
    case 'parca':
      return 'application/vnd.google.protobuf';
    case 'ebpf':
      return 'application/x-perf-script';
  }
}

