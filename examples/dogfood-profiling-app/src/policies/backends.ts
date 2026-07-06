/**
 * The 3 canonical profiler backends the dogfood app targets.
 *
 * The trio (pyroscope / parca / ebpf) covers the continuous-profiling
 * ecosystem end-to-end — a `pyroscope` session drives the Grafana
 * Pyroscope OSS ingest API, a `parca` session drives the Polar Signals
 * Parca gRPC + arrow protocol, and an `ebpf` session drives a bare BPF
 * stack sampler (perf_event_open / perf script pipeline). Each backend
 * is exercised end-to-end so the fidelity harness diffs mock vs real
 * semantics across every canonical production surface.
 */

import type { ProfilingSessionConfig } from '../adapters/interface.js';

/**
 * Pyroscope backend — Grafana Pyroscope OSS ingest, 100Hz sampling.
 * Production default for continuous profiling of Go / Rust / Python
 * services.
 */
export const BACKEND_PYROSCOPE: ProfilingSessionConfig = {
  backend: 'pyroscope',
  serviceName: 'dogfood-pyroscope',
  sampleRateHz: 100,
};

/**
 * Parca backend — Polar Signals Parca, 97Hz sampling (Parca default is
 * an odd number to reduce lockstep alias with 100Hz clocks).
 */
export const BACKEND_PARCA: ProfilingSessionConfig = {
  backend: 'parca',
  serviceName: 'dogfood-parca',
  sampleRateHz: 97,
};

/**
 * eBPF backend — bare BPF stack sampler, 99Hz sampling (perf_event_open
 * uses 99Hz to reduce vDSO alias).
 */
export const BACKEND_EBPF: ProfilingSessionConfig = {
  backend: 'ebpf',
  serviceName: 'dogfood-ebpf',
  sampleRateHz: 99,
};

/** All 3 backends — used by the fidelity harness to walk every backend. */
export const ALL_BACKENDS: readonly ProfilingSessionConfig[] = [
  BACKEND_PYROSCOPE,
  BACKEND_PARCA,
  BACKEND_EBPF,
];
