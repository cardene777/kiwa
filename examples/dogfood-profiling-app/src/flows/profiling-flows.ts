/**
 * Continuous-profiling lifecycle flows.
 *
 * `runFullProfilingLifecycle` drives every op of the 16-op contract in
 * the order a production pyroscope + Parca + eBPF pipeline expects —
 * session start → resource detection → sample per kind (cpu / off-cpu /
 * memory / lock) → flame graph build → drill-down → compare → cardinality
 * guard → export → query pyroscope → query parca → load eBPF program.
 * Any op that diverges surfaces in the fidelity trace.
 *
 * `runMultiBackendMatrix` drives 3 backends × 4 kinds so the fidelity
 * harness measures behavioural drift across every canonical production
 * combo (12 lifecycles per adapter run = 24 across mock + real).
 */

import type {
  ProfileKind,
  ProfilingAdapter,
  ProfilingSessionConfig,
  SampleInput,
  TraceEvent,
} from '../adapters/interface.js';

export interface LifecycleInput {
  config: ProfilingSessionConfig;
  resourceAttributes: Record<string, string>;
  /** Per-kind sample sets — the harness ingests each set through the matching op. */
  samples: {
    cpu: readonly SampleInput[];
    'off-cpu': readonly SampleInput[];
    memory: readonly SampleInput[];
    lock: readonly SampleInput[];
  };
  /** Frame to drill down into (must exist in the built flame graph). */
  drillFocusFrame: string;
  /** Baseline samples for compareFlameGraphs (one baseline per kind exercised). */
  baseline: readonly SampleInput[];
  /** Labels to feed the cardinality guard. */
  cardinalityLabels: Record<string, readonly string[]>;
  /** Series budget for the cardinality guard. */
  seriesBudget: number;
  /** eBPF program to load. */
  ebpfProgramName: string;
  /** PIDs the eBPF program should attach to. */
  ebpfAttachedPids: readonly number[];
}

/**
 * Drive one full continuous-profiling lifecycle from start to reset.
 * The lifecycle emits every op on the 16-op contract at least once so
 * a per-lifecycle trace has a stable event count — the fidelity harness
 * leans on that to detect missing / drifted ops.
 */
export async function runFullProfilingLifecycle(
  adapter: ProfilingAdapter,
  input: LifecycleInput,
): Promise<void> {
  await adapter.startSession(input.config);
  await adapter.detectResource({
    bucket: input.config.backend,
    attributes: input.resourceAttributes,
  });
  for (const sample of input.samples.cpu) {
    await adapter.ingestCpuSample({ bucket: input.config.backend, sample });
  }
  for (const sample of input.samples['off-cpu']) {
    await adapter.ingestOffCpuSample({ bucket: input.config.backend, sample });
  }
  for (const sample of input.samples.memory) {
    await adapter.ingestMemorySample({ bucket: input.config.backend, sample });
  }
  for (const sample of input.samples.lock) {
    await adapter.ingestLockSample({ bucket: input.config.backend, sample });
  }
  const kinds: ProfileKind[] = ['cpu', 'off-cpu', 'memory', 'lock'];
  for (const kind of kinds) {
    if (input.samples[kind].length === 0) continue;
    await adapter.buildFlameGraph({ bucket: input.config.backend, kind });
    await adapter.drillDown({
      bucket: input.config.backend,
      kind,
      focusFrame: input.drillFocusFrame,
    });
    await adapter.compareFlameGraphs({
      bucket: input.config.backend,
      kind,
      baselineSamples: input.baseline,
    });
  }
  await adapter.guardCardinality({
    bucket: input.config.backend,
    labels: input.cardinalityLabels,
    seriesBudget: input.seriesBudget,
  });
  for (const kind of kinds) {
    if (input.samples[kind].length === 0) continue;
    await adapter.exportProfiles({
      bucket: input.config.backend,
      kind,
      itemCount: input.samples[kind].length,
    });
  }
  await adapter.queryPyroscope({
    bucket: input.config.backend,
    serviceName: input.config.serviceName,
    kind: 'cpu',
  });
  await adapter.queryParca({
    bucket: input.config.backend,
    serviceName: input.config.serviceName,
    kind: 'cpu',
  });
  await adapter.loadEbpfProgram({
    bucket: input.config.backend,
    programName: input.ebpfProgramName,
    attachedPids: input.ebpfAttachedPids,
  });
  // Note — reset is intentionally NOT called at the end of the lifecycle
  // so downstream fidelity harnesses / integration tests can inspect the
  // trace transcript. Callers that need a clean slate between lifecycles
  // should call `adapter.reset()` explicitly.
}

/**
 * Drive the multi-backend matrix — 3 backends (pyroscope / parca / ebpf)
 * × N configured lifecycle inputs. Returns the neutral event trace
 * captured while walking the matrix so the fidelity harness can diff
 * mock vs real ordering per backend.
 */
export async function runMultiBackendMatrix(
  adapter: ProfilingAdapter,
  configs: readonly ProfilingSessionConfig[],
  perConfigInput: (config: ProfilingSessionConfig) => LifecycleInput,
): Promise<TraceEvent[]> {
  for (const config of configs) {
    await runFullProfilingLifecycle(adapter, perConfigInput(config));
  }
  return adapter.trace();
}

/**
 * The 15 lifecycle op names that a full run of `runFullProfilingLifecycle`
 * emits at least once. Not identical to `PROFILING_HARNESS_OPS` — this
 * one drops `reset` / `resetVerified` since the lifecycle harness resets
 * at the top instead of at the bottom.
 */
export const OPS_UNDER_LIFECYCLE = [
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
] as const;
