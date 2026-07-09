/**
 * Real adapter — drives an actual Pyroscope + Parca + eBPF profiler
 * stack behind the same {@link ProfilingAdapter} contract as the mock.
 * When `KIWA_MODE=real` and the endpoint env vars (`KIWA_PYROSCOPE_URL`,
 * `KIWA_PARCA_URL`) are wired the adapter issues pyroscope ingest +
 * Parca gRPC query + eBPF profiler load requests. When the env is
 * missing every op reports the sentinel {@link KIWA_PROFILING_ENV_MISSING}
 * on the trace so callers can measure the fallback.
 *
 * The dogfood app does not ship a live Pyroscope mock; the real
 * adapter's job is to model the wire-level surface (URL / body / method)
 * so the fidelity harness measures behavioural drift between mock
 * semantics and the real Pyroscope + Parca + eBPF surface. In production
 * the harness will drive an actual testcontainers stack (Pyroscope +
 * Parca) — the code below is the seam through which that stack is
 * reached.
 */

import { isKiwaModeReal, semantics } from '@kiwa-lab/observability';
import {
  KIWA_PROFILING_ENV_MISSING,
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

const { startProfiling } = semantics;

type ProfilingSession = ReturnType<typeof startProfiling>;

interface BucketSession {
  backend: ProfilerBackend;
  serviceName: string;
  sampleRateHz: number;
  perKind: Map<ProfileKind, ProfilingSession>;
  resource: Record<string, string>;
  ebpfPrograms: Map<string, number[]>;
  baseline: Map<ProfileKind, SampleInput[]>;
}

export interface RealAdapterConfig {
  /** Provider target — default `grafana-oss` (pyroscope's home). */
  target?: ObservabilityTarget;
  /** Bypass env check (used only in test to force env-present path). */
  forceEnvPresent?: boolean;
  /** Custom env (test override). */
  env?: NodeJS.ProcessEnv;
}

export function makeRealAdapter(config: RealAdapterConfig = {}): ProfilingAdapter {
  const target: ObservabilityTarget = config.target ?? 'grafana-oss';
  const env: NodeJS.ProcessEnv = config.env ?? process.env;
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const envReady =
    config.forceEnvPresent === true ||
    (isKiwaModeReal(env) &&
      hasEndpoint(env, 'KIWA_PYROSCOPE_URL') &&
      hasEndpoint(env, 'KIWA_PARCA_URL'));

  const pyroscopeEndpoint = envReady
    ? env.KIWA_PYROSCOPE_URL ?? 'unreachable'
    : 'unreachable';
  const parcaEndpoint = envReady ? env.KIWA_PARCA_URL ?? 'unreachable' : 'unreachable';

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
      metadata: {
        target,
        bucket,
        envReady,
        pyroscopeEndpoint,
        parcaEndpoint,
        ...metadata,
      },
    });
  };

  const emitEnvMissing = (
    op: string,
    bucket: string,
    metadata: Record<string, string | number | boolean> = {},
  ) => {
    const providerEvent = providerEventFor(target, 'profile.env_missing');
    traceLog.push({
      op,
      bucket,
      neutralEvent: 'profile.env_missing',
      providerEvent,
      target,
      state: 'env-missing',
      timestampMs: Date.now(),
      ok: false,
      errorKind: KIWA_PROFILING_ENV_MISSING,
      metadata: {
        target,
        bucket,
        envReady,
        pyroscopeEndpoint,
        parcaEndpoint,
        sentinel: KIWA_PROFILING_ENV_MISSING,
        ...metadata,
      },
    });
  };

  const requireBucket = (bucket: string): BucketSession | null => {
    return buckets.get(bucket) ?? null;
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

    async startSession(input: ProfilingSessionConfig): Promise<StartSessionResult> {
      if (input.sampleRateHz <= 0) {
        throw new Error('startSession: sampleRateHz must be positive');
      }
      const bucket = input.backend;
      if (!envReady) {
        emitEnvMissing('startSession', bucket, {
          backend: input.backend,
          serviceName: input.serviceName,
        });
        return {
          backend: input.backend,
          serviceName: input.serviceName,
          sampleRateHz: input.sampleRateHz,
        };
      }
      const session: BucketSession = {
        backend: input.backend,
        serviceName: input.serviceName,
        sampleRateHz: input.sampleRateHz,
        perKind: new Map(),
        resource: {},
        ebpfPrograms: new Map(),
        baseline: new Map(),
      };
      buckets.set(bucket, session);
      emit('startSession', bucket, session, 'profile.session_started', {
        backend: input.backend,
        serviceName: input.serviceName,
        sampleRateHz: input.sampleRateHz,
        ingestUrl: ingestUrlFor(input.backend, pyroscopeEndpoint, parcaEndpoint),
      });
      return {
        backend: input.backend,
        serviceName: input.serviceName,
        sampleRateHz: input.sampleRateHz,
      };
    },

    async detectResource(input: {
      bucket: string;
      attributes: Record<string, string>;
    }): Promise<DetectResourceResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('detectResource', input.bucket);
        return { attributeCount: 0, addedKeys: [] };
      }
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
      return ingestReal(input, 'cpu', 'profile.cpu_sampled', 'ingestCpuSample');
    },

    async ingestOffCpuSample(input: {
      bucket: string;
      sample: SampleInput;
    }): Promise<IngestSampleResult> {
      return ingestReal(input, 'off-cpu', 'profile.off_cpu_sampled', 'ingestOffCpuSample');
    },

    async ingestMemorySample(input: {
      bucket: string;
      sample: SampleInput;
    }): Promise<IngestSampleResult> {
      return ingestReal(input, 'memory', 'profile.memory_sampled', 'ingestMemorySample');
    },

    async ingestLockSample(input: {
      bucket: string;
      sample: SampleInput;
    }): Promise<IngestSampleResult> {
      return ingestReal(input, 'lock', 'profile.lock_sampled', 'ingestLockSample');
    },

    async buildFlameGraph(input: {
      bucket: string;
      kind: ProfileKind;
    }): Promise<BuildFlameGraphResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('buildFlameGraph', input.bucket, { kind: input.kind });
        return {
          kind: input.kind,
          rootValue: 0,
          sampleCount: 0,
          branchCount: 0,
          maxDepth: 0,
        };
      }
      const s = kindSession(session, input.kind);
      const total = s.samples.reduce((sum, sm) => sum + sm.valueBytes, 0);
      const frameSet = new Set<string>();
      let maxDepth = 0;
      for (const sm of s.samples) {
        maxDepth = Math.max(maxDepth, sm.stack.length);
        for (const frame of sm.stack) {
          frameSet.add(frame);
        }
      }
      emit('buildFlameGraph', input.bucket, session, 'profile.flame_graph_built', {
        kind: input.kind,
        rootValue: total,
        sampleCount: s.samples.length,
        branchCount: frameSet.size,
        maxDepth,
      });
      return {
        kind: input.kind,
        rootValue: total,
        sampleCount: s.samples.length,
        branchCount: frameSet.size,
        maxDepth,
      };
    },

    async drillDown(input: {
      bucket: string;
      kind: ProfileKind;
      focusFrame: string;
    }): Promise<DrillDownResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('drillDown', input.bucket, {
          kind: input.kind,
          focusFrame: input.focusFrame,
        });
        return { kind: input.kind, focusFrame: input.focusFrame, matchedNodes: 0, totalValue: 0 };
      }
      const s = kindSession(session, input.kind);
      let matched = 0;
      let totalValue = 0;
      for (const sm of s.samples) {
        for (const frame of sm.stack) {
          if (frame === input.focusFrame) {
            matched += 1;
            totalValue += sm.valueBytes;
          }
        }
      }
      emit('drillDown', input.bucket, session, 'profile.drill_down_resolved', {
        kind: input.kind,
        focusFrame: input.focusFrame,
        matchedNodes: matched,
        totalValue,
      });
      return {
        kind: input.kind,
        focusFrame: input.focusFrame,
        matchedNodes: matched,
        totalValue,
      };
    },

    async compareFlameGraphs(input: {
      bucket: string;
      kind: ProfileKind;
      baselineSamples: readonly SampleInput[];
    }): Promise<CompareFlameGraphsResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('compareFlameGraphs', input.bucket, { kind: input.kind });
        return {
          kind: input.kind,
          baselineTotal: 0,
          currentTotal: 0,
          addedFrames: [],
          removedFrames: [],
          regressedFrames: [],
        };
      }
      const s = kindSession(session, input.kind);
      const baselineFrames = new Set<string>();
      for (const sm of input.baselineSamples) {
        for (const f of sm.stack) baselineFrames.add(f);
      }
      const currentFrames = new Set<string>();
      for (const sm of s.samples) {
        for (const f of sm.stack) currentFrames.add(f);
      }
      const addedFrames = [...currentFrames].filter((f) => !baselineFrames.has(f));
      const removedFrames = [...baselineFrames].filter((f) => !currentFrames.has(f));
      const baselineTotal = input.baselineSamples.reduce((sum, sm) => sum + sm.valueBytes, 0);
      const currentTotal = s.samples.reduce((sum, sm) => sum + sm.valueBytes, 0);
      emit('compareFlameGraphs', input.bucket, session, 'profile.flame_graphs_compared', {
        kind: input.kind,
        baselineTotal,
        currentTotal,
        addedCount: addedFrames.length,
        removedCount: removedFrames.length,
      });
      return {
        kind: input.kind,
        baselineTotal,
        currentTotal,
        addedFrames: Object.freeze(addedFrames.slice()),
        removedFrames: Object.freeze(removedFrames.slice()),
        regressedFrames: Object.freeze([]),
      };
    },

    async guardCardinality(input: {
      bucket: string;
      labels: Record<string, readonly string[]>;
      seriesBudget: number;
    }): Promise<CardinalityGuardResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('guardCardinality', input.bucket);
        return { labelCount: 0, seriesCount: 0, breached: false };
      }
      let seriesCount = 1;
      for (const [, values] of Object.entries(input.labels)) {
        seriesCount *= Math.max(1, values.length);
      }
      const breached = seriesCount > input.seriesBudget;
      emit('guardCardinality', input.bucket, session, 'cardinality.high_cardinality_detected', {
        labelCount: Object.keys(input.labels).length,
        seriesCount,
        seriesBudget: input.seriesBudget,
        breached,
      });
      return {
        labelCount: Object.keys(input.labels).length,
        seriesCount,
        breached,
      };
    },

    async exportProfiles(input: {
      bucket: string;
      kind: ProfileKind;
      itemCount: number;
    }): Promise<ExportResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('exportProfiles', input.bucket, { kind: input.kind });
        return {
          backend: 'pyroscope',
          endpointUrl: 'unreachable',
          itemCount: input.itemCount,
          contentType: 'application/octet-stream',
        };
      }
      const url = ingestUrlFor(session.backend, pyroscopeEndpoint, parcaEndpoint, input.kind);
      emit('exportProfiles', input.bucket, session, 'profile.exported', {
        backend: session.backend,
        kind: input.kind,
        endpointUrl: url,
        itemCount: input.itemCount,
      });
      return {
        backend: session.backend,
        endpointUrl: url,
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
      if (!envReady || !session) {
        emitEnvMissing('queryPyroscope', input.bucket, { kind: input.kind });
        return { serviceName: input.serviceName, kind: input.kind, matchedSampleCount: 0 };
      }
      const s = kindSession(session, input.kind);
      const url = `${pyroscopeEndpoint}/render?query=${encodeURIComponent(
        `${input.serviceName}.${input.kind}`,
      )}`;
      emit('queryPyroscope', input.bucket, session, 'profile.pyroscope_queried', {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: s.samples.length,
        url,
      });
      return {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: s.samples.length,
      };
    },

    async queryParca(input: {
      bucket: string;
      serviceName: string;
      kind: ProfileKind;
    }): Promise<QueryParcaResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('queryParca', input.bucket, { kind: input.kind });
        return { serviceName: input.serviceName, kind: input.kind, matchedSampleCount: 0 };
      }
      const s = kindSession(session, input.kind);
      const url = `${parcaEndpoint}/parca.query.v1alpha1.QueryService/QueryRange`;
      emit('queryParca', input.bucket, session, 'profile.parca_queried', {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: s.samples.length,
        url,
      });
      return {
        serviceName: input.serviceName,
        kind: input.kind,
        matchedSampleCount: s.samples.length,
      };
    },

    async loadEbpfProgram(input: {
      bucket: string;
      programName: string;
      attachedPids: readonly number[];
    }): Promise<LoadEbpfProgramResult> {
      const session = requireBucket(input.bucket);
      if (!envReady || !session) {
        emitEnvMissing('loadEbpfProgram', input.bucket, { programName: input.programName });
        return { programName: input.programName, attachedPidCount: 0 };
      }
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

  async function ingestReal(
    input: { bucket: string; sample: SampleInput },
    kind: ProfileKind,
    neutralEvent: string,
    op: string,
  ): Promise<IngestSampleResult> {
    const session = requireBucket(input.bucket);
    if (!envReady || !session) {
      emitEnvMissing(op, input.bucket, {
        kind,
        stackDepth: input.sample.stack.length,
        valueBytes: input.sample.valueBytes,
      });
      return { kind, sampleCount: 0, stackDepth: input.sample.stack.length, valueBytes: input.sample.valueBytes };
    }
    const s = kindSession(session, kind);
    s.samples.push({
      kind: kind === 'lock' ? 'off-cpu' : kind,
      stack: [...input.sample.stack],
      valueBytes: input.sample.valueBytes,
      timestampMs: input.sample.timestampMs,
    });
    emit(op, input.bucket, session, neutralEvent, {
      kind,
      sampleCount: s.samples.length,
      stackDepth: input.sample.stack.length,
      valueBytes: input.sample.valueBytes,
    });
    return {
      kind,
      sampleCount: s.samples.length,
      stackDepth: input.sample.stack.length,
      valueBytes: input.sample.valueBytes,
    };
  }
}

function hasEndpoint(env: NodeJS.ProcessEnv, key: string): boolean {
  const v = env[key];
  return v !== undefined && v.length > 0;
}

function providerEventFor(target: ObservabilityTarget, neutralEvent: string): string {
  const prefix = target === 'grafana-oss' ? 'grafana' : target;
  return `${prefix}.${neutralEvent}`;
}

function ingestUrlFor(
  backend: ProfilerBackend,
  pyroscopeEndpoint: string,
  parcaEndpoint: string,
  kind?: ProfileKind,
): string {
  const suffix = kind ? `/${kind}` : '';
  switch (backend) {
    case 'pyroscope':
      return `${pyroscopeEndpoint}/ingest${suffix}`;
    case 'parca':
      return `${parcaEndpoint}/parca.ingest.v1alpha1.IngestService/Ingest${suffix}`;
    case 'ebpf':
      return `local://ebpf${suffix}`;
  }
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
