/**
 * Provider-neutral continuous profiling + pyroscope + eBPF profiler surface
 * for the dogfood app.
 *
 * The dogfood app drives a continuous profiling harness through this
 * contract only. Two implementations exist —
 *  - {@link makeMockAdapter} — walks the `@kiwa/observability` v2.1
 *    `semantics/profiling` state machine deterministically without any
 *    backend. Every op emits the matching neutral event onto the trace so
 *    the fidelity harness can diff ordering against the real adapter.
 *  - {@link makeRealAdapter} — issues pyroscope ingest + Parca gRPC +
 *    eBPF profiler pipeline requests against the `KIWA_MODE=real`
 *    testcontainers-driven Pyroscope + Parca stack when
 *    `KIWA_PYROSCOPE_URL` / `KIWA_PARCA_URL` are wired; otherwise every
 *    op reports the sentinel {@link KIWA_PROFILING_ENV_MISSING} so the
 *    app can budget the fallback path.
 *
 * The AC anchors this contract on 4 profile kinds that production
 * continuous profiling deployments commonly ship —
 *  - cpu ... on-CPU sampling (pyroscope default, 100Hz sampling)
 *  - off-cpu ... off-CPU sampling (eBPF profiler wakeup / sleep tracking)
 *  - memory ... alloc profile (heap growth per stack)
 *  - lock ... mutex / contention profile (blocking stack traces)
 * × 3 profiler backends (pyroscope / parca / ebpf). The 16 ops below
 * cover the profiling lifecycle end-to-end (session start → resource
 * detection → sample ingest per kind → flame graph build → drill-down →
 * comparison → export → query) so the fidelity harness can point at the
 * exact op that drifted between mock semantics and the real Pyroscope +
 * Parca + eBPF stack.
 */

import type { semantics } from '@kiwa/observability';

/** Re-export from observability semantics namespace. */
export type ObservabilityTarget = semantics.ObservabilityTarget;

/** Profiler backend — pyroscope (Grafana), parca (Polar Signals), or bare eBPF. */
export type ProfilerBackend = 'pyroscope' | 'parca' | 'ebpf';

/** Profile kind — the 4 canonical continuous-profiling axes. */
export type ProfileKind = 'cpu' | 'off-cpu' | 'memory' | 'lock';

/** Profiling session configuration (backend + service name + sample rate). */
export interface ProfilingSessionConfig {
  backend: ProfilerBackend;
  serviceName: string;
  sampleRateHz: number;
}

/** Result of starting a profiling session. */
export interface StartSessionResult {
  backend: ProfilerBackend;
  serviceName: string;
  sampleRateHz: number;
}

/** Sample ingest input — one stack trace + value + timestamp. */
export interface SampleInput {
  kind: ProfileKind;
  stack: readonly string[];
  valueBytes: number;
  timestampMs: number;
}

/** Result of ingesting a sample. */
export interface IngestSampleResult {
  kind: ProfileKind;
  sampleCount: number;
  stackDepth: number;
  valueBytes: number;
}

/** Result of detecting profiler resource attributes. */
export interface DetectResourceResult {
  attributeCount: number;
  addedKeys: readonly string[];
}

/** Result of building a flame graph for the given profile kind. */
export interface BuildFlameGraphResult {
  kind: ProfileKind;
  rootValue: number;
  sampleCount: number;
  branchCount: number;
  maxDepth: number;
}

/** Result of drilling down into a subtree of the flame graph. */
export interface DrillDownResult {
  kind: ProfileKind;
  focusFrame: string;
  matchedNodes: number;
  totalValue: number;
}

/** Result of comparing two flame graphs (baseline vs current). */
export interface CompareFlameGraphsResult {
  kind: ProfileKind;
  baselineTotal: number;
  currentTotal: number;
  addedFrames: readonly string[];
  removedFrames: readonly string[];
  regressedFrames: readonly string[];
}

/** Result of an export to the profiler ingest endpoint. */
export interface ExportResult {
  backend: ProfilerBackend;
  endpointUrl: string;
  itemCount: number;
  contentType: string;
}

/** Result of a pyroscope render (flame-graph JSON) query. */
export interface QueryPyroscopeResult {
  serviceName: string;
  kind: ProfileKind;
  matchedSampleCount: number;
}

/** Result of a Parca query (arrow / protobuf) for merged profiles. */
export interface QueryParcaResult {
  serviceName: string;
  kind: ProfileKind;
  matchedSampleCount: number;
}

/** Result of loading an eBPF profiler program (BPF stack sampler). */
export interface LoadEbpfProgramResult {
  programName: string;
  attachedPidCount: number;
}

/** Result of a cardinality guard check on stack labels. */
export interface CardinalityGuardResult {
  labelCount: number;
  seriesCount: number;
  breached: boolean;
}

/** Neutral trace event emitted by both adapters. */
export interface TraceEvent {
  op: string;
  bucket: string;
  neutralEvent: string;
  providerEvent: string;
  target: ObservabilityTarget;
  state: string;
  timestampMs: number;
  /**
   * Whether the op completed against a functional backend. Mock adapter
   * ops are always `ok: true` (in-memory state machine); real adapter
   * ops are `ok: false` with `errorKind: KIWA_PROFILING_ENV_MISSING`
   * when the env vars are missing. The fidelity harness surfaces this
   * asymmetry as a behavioural divergence.
   */
  ok: boolean;
  errorKind?: string | undefined;
  metadata: Record<string, string | number | boolean>;
}

/**
 * The 16-op continuous-profiling + pyroscope + eBPF harness contract that
 * both adapters satisfy.
 *
 * Ordering — a full run flows through 16 ops so an app / test can drive
 * the entire profiling lifecycle once and both adapters emit the same
 * neutral event trace.
 */
export interface ProfilingAdapter {
  /** Provider target identifier. */
  readonly target: ObservabilityTarget;

  /** Start a profiling session for the given backend + service. */
  startSession(config: ProfilingSessionConfig): Promise<StartSessionResult>;

  /** Detect profiler resource attributes (service / host / process id). */
  detectResource(input: {
    bucket: string;
    attributes: Record<string, string>;
  }): Promise<DetectResourceResult>;

  /** Ingest an on-CPU sample (default pyroscope sampler). */
  ingestCpuSample(input: { bucket: string; sample: SampleInput }): Promise<IngestSampleResult>;

  /** Ingest an off-CPU sample (eBPF wakeup / sleep tracker). */
  ingestOffCpuSample(input: {
    bucket: string;
    sample: SampleInput;
  }): Promise<IngestSampleResult>;

  /** Ingest a memory / alloc sample (heap growth per stack). */
  ingestMemorySample(input: { bucket: string; sample: SampleInput }): Promise<IngestSampleResult>;

  /** Ingest a lock / mutex contention sample. */
  ingestLockSample(input: { bucket: string; sample: SampleInput }): Promise<IngestSampleResult>;

  /** Build a flame graph for the given profile kind. */
  buildFlameGraph(input: {
    bucket: string;
    kind: ProfileKind;
  }): Promise<BuildFlameGraphResult>;

  /** Drill down into a subtree focused on the given frame. */
  drillDown(input: {
    bucket: string;
    kind: ProfileKind;
    focusFrame: string;
  }): Promise<DrillDownResult>;

  /**
   * Compare two flame graphs (baseline vs current) for the given kind.
   * Surfaces added / removed / regressed frames so consumers can wire
   * up a diff report.
   */
  compareFlameGraphs(input: {
    bucket: string;
    kind: ProfileKind;
    baselineSamples: readonly SampleInput[];
  }): Promise<CompareFlameGraphsResult>;

  /**
   * Guard the label cardinality budget — production continuous profiling
   * turns into a Prometheus label-cardinality problem when service names
   * or trace IDs leak into labels.
   */
  guardCardinality(input: {
    bucket: string;
    labels: Record<string, readonly string[]>;
    seriesBudget: number;
  }): Promise<CardinalityGuardResult>;

  /** Export the current samples through the profiler ingest endpoint. */
  exportProfiles(input: {
    bucket: string;
    kind: ProfileKind;
    itemCount: number;
  }): Promise<ExportResult>;

  /** Query the Pyroscope backend for a merged flame-graph render (real path only). */
  queryPyroscope(input: {
    bucket: string;
    serviceName: string;
    kind: ProfileKind;
  }): Promise<QueryPyroscopeResult>;

  /** Query the Parca backend for merged profiles (real path only). */
  queryParca(input: {
    bucket: string;
    serviceName: string;
    kind: ProfileKind;
  }): Promise<QueryParcaResult>;

  /** Load an eBPF profiler program (BPF stack sampler / off-CPU tracer). */
  loadEbpfProgram(input: {
    bucket: string;
    programName: string;
    attachedPids: readonly number[];
  }): Promise<LoadEbpfProgramResult>;

  /** Reset the adapter (drop all state, resettable across tests). */
  reset(): Promise<void>;

  /** Trace transcript for fidelity diffing. */
  trace(): TraceEvent[];
}

/**
 * The full 16 op names — used both to drive the fidelity harness and to
 * assert both adapters implement the same surface.
 *
 * The list mirrors the 15 Promise-returning methods on the adapter plus
 * a synthesised `resetVerified` step the fidelity harness emits at the
 * end of a lifecycle. `reset` itself is on the interface but is not
 * exercised in the multi-backend matrix (reset happens at the top of
 * each lifecycle, not per-lifecycle) so the OP list intentionally
 * captures the sequence a single lifecycle traces.
 */
export const PROFILING_HARNESS_OPS = [
  'startSession',
  'detectResource',
  'ingestCpuSample',
  'ingestOffCpuSample',
  'ingestMemorySample',
  'ingestLockSample',
  'buildFlameGraph',
  'drillDown',
  'compareFlameGraphs',
  'guardCardinality',
  'exportProfiles',
  'queryPyroscope',
  'queryParca',
  'loadEbpfProgram',
  'reset',
  'resetVerified',
] as const;

export type ProfilingHarnessOp = (typeof PROFILING_HARNESS_OPS)[number];

/** Sentinel error thrown by the real adapter when env is missing. */
export const KIWA_PROFILING_ENV_MISSING = 'KIWA_PROFILING_ENV_MISSING';
