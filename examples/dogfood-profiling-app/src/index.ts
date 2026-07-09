/**
 * Public surface for dogfood-profiling-app v0.0.1 (v1.35-4).
 *
 * A dogfood app that drives the `@kiwa-lab/observability` v2.1
 * profiling axis (session start → resource detection → cpu / off-cpu /
 * memory / lock sample ingest → flame graph build → drill-down → compare
 * → cardinality guard → export → pyroscope query → parca query → eBPF
 * program load) behind a provider-neutral 16-op contract, satisfied by
 * both a deterministic mock adapter and a `KIWA_MODE=real`
 * testcontainers-driven Pyroscope + Parca + eBPF profiler real adapter.
 * The fidelity harness diffs both traces and feeds the divergence count
 * into the `@kiwa-lab/quality-metrics` 13-axis release gate.
 */

export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, type RealAdapterConfig } from './adapters/real.js';
export {
  KIWA_PROFILING_ENV_MISSING,
  PROFILING_HARNESS_OPS,
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
  type ProfilingHarnessOp,
  type ProfilingSessionConfig,
  type QueryParcaResult,
  type QueryPyroscopeResult,
  type SampleInput,
  type StartSessionResult,
  type TraceEvent,
} from './adapters/interface.js';

export {
  ALL_BACKENDS,
  BACKEND_EBPF,
  BACKEND_PARCA,
  BACKEND_PYROSCOPE,
} from './policies/backends.js';

export {
  ALL_KINDS,
  KIND_CPU,
  KIND_LOCK,
  KIND_MEMORY,
  KIND_OFF_CPU,
} from './policies/kinds.js';

export {
  ALL_STACKS,
  STACK_DB_QUERY,
  STACK_HTTP_HOT,
  STACK_LOCK_CONTENTION,
  STACK_MEMORY_ALLOC,
  STACK_OFF_CPU_WAIT,
} from './policies/stacks.js';

export {
  OPS_UNDER_LIFECYCLE,
  runFullProfilingLifecycle,
  runMultiBackendMatrix,
  type LifecycleInput,
} from './flows/profiling-flows.js';

export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
