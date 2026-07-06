/**
 * Multi-backend matrix tests — walk the same lifecycle across all 3
 * backends (pyroscope / parca / ebpf) and 4 kinds (cpu / off-cpu /
 * memory / lock) so the fidelity harness measures behavioural drift
 * across every canonical production combo (12 lifecycles per adapter).
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  ALL_BACKENDS,
  BACKEND_EBPF,
  BACKEND_PARCA,
  BACKEND_PYROSCOPE,
} from '../src/policies/backends.js';
import { ALL_KINDS } from '../src/policies/kinds.js';
import {
  STACK_DB_QUERY,
  STACK_HTTP_HOT,
  STACK_LOCK_CONTENTION,
  STACK_MEMORY_ALLOC,
  STACK_OFF_CPU_WAIT,
} from '../src/policies/stacks.js';
import {
  runFullProfilingLifecycle,
  runMultiBackendMatrix,
  OPS_UNDER_LIFECYCLE,
  type LifecycleInput,
} from '../src/flows/profiling-flows.js';
import type { ProfilingSessionConfig } from '../src/adapters/interface.js';

function inputFor(config: ProfilingSessionConfig): LifecycleInput {
  return {
    config,
    resourceAttributes: { 'service.name': config.serviceName, 'host.name': 'ci' },
    samples: {
      cpu: [STACK_HTTP_HOT, STACK_DB_QUERY],
      'off-cpu': [STACK_OFF_CPU_WAIT],
      memory: [STACK_MEMORY_ALLOC],
      lock: [STACK_LOCK_CONTENTION],
    },
    drillFocusFrame: 'main',
    baseline: [STACK_HTTP_HOT],
    cardinalityLabels: { kind: ['cpu', 'memory'], service: [config.serviceName] },
    seriesBudget: 100,
    ebpfProgramName: 'stack-sampler',
    ebpfAttachedPids: [1234],
  };
}

describe('dogfood-profiling-app — multi-backend matrix', () => {
  it('T-DFPROF-MB-001 lifecycle emits every op on the 14-op contract', async () => {
    const mock = makeMockAdapter();
    await runFullProfilingLifecycle(mock, inputFor(BACKEND_PYROSCOPE));
    const trace = mock.trace();
    for (const op of OPS_UNDER_LIFECYCLE) {
      const seen = trace.some((t) => t.op === op);
      expect(seen, `op ${op} was expected on the trace`).toBe(true);
    }
  });

  it('T-DFPROF-MB-002 lifecycle for pyroscope emits pyroscope bucket only', async () => {
    const mock = makeMockAdapter();
    await runFullProfilingLifecycle(mock, inputFor(BACKEND_PYROSCOPE));
    const trace = mock.trace();
    const pyroEvents = trace.filter((t) => t.bucket === 'pyroscope');
    expect(pyroEvents.length).toBeGreaterThan(0);
    const otherBuckets = trace.filter((t) => t.bucket !== 'pyroscope');
    expect(otherBuckets.length).toBe(0);
  });

  it('T-DFPROF-MB-003 multi-backend matrix runs all 3 backends', async () => {
    const mock = makeMockAdapter();
    const trace = await runMultiBackendMatrix(mock, ALL_BACKENDS, inputFor);
    const buckets = new Set(trace.map((t) => t.bucket));
    // Trace accumulates across backends since the lifecycle does not
    // auto-reset. Every backend should have contributed events.
    expect(buckets.has('pyroscope')).toBe(true);
    expect(buckets.has('parca')).toBe(true);
    expect(buckets.has('ebpf')).toBe(true);
  });

  it('T-DFPROF-MB-004 lifecycle for parca uses parca content type on export', async () => {
    const mock = makeMockAdapter();
    await runFullProfilingLifecycle(mock, inputFor(BACKEND_PARCA));
    const trace = mock.trace();
    const exports = trace.filter((t) => t.op === 'exportProfiles');
    for (const e of exports) {
      // Parca exports carry `backend=parca` in metadata.
      expect(e.metadata.backend).toBe('parca');
    }
  });

  it('T-DFPROF-MB-005 lifecycle for ebpf loads a bpf program', async () => {
    const mock = makeMockAdapter();
    await runFullProfilingLifecycle(mock, inputFor(BACKEND_EBPF));
    const trace = mock.trace();
    const load = trace.find((t) => t.op === 'loadEbpfProgram');
    expect(load?.metadata.programName).toBe('stack-sampler');
    expect(load?.metadata.attachedPidCount).toBe(1);
  });

  it('T-DFPROF-MB-006 lifecycle exports profiles for all 4 kinds', async () => {
    const mock = makeMockAdapter();
    await runFullProfilingLifecycle(mock, inputFor(BACKEND_PYROSCOPE));
    const trace = mock.trace();
    const exports = trace.filter((t) => t.op === 'exportProfiles');
    // 4 kinds, all had samples in the fixture.
    expect(exports.length).toBe(4);
    const kinds = new Set(exports.map((e) => String(e.metadata.kind)));
    for (const k of ALL_KINDS) {
      expect(kinds.has(k)).toBe(true);
    }
  });

  it('T-DFPROF-MB-007 lifecycle emits cardinality guard once regardless of kind count', async () => {
    const mock = makeMockAdapter();
    await runFullProfilingLifecycle(mock, inputFor(BACKEND_PYROSCOPE));
    const trace = mock.trace();
    const guards = trace.filter((t) => t.op === 'guardCardinality');
    expect(guards.length).toBe(1);
  });

  it('T-DFPROF-MB-008 lifecycle builds flame graph for every kind with samples', async () => {
    const mock = makeMockAdapter();
    await runFullProfilingLifecycle(mock, inputFor(BACKEND_PYROSCOPE));
    const trace = mock.trace();
    const builds = trace.filter((t) => t.op === 'buildFlameGraph');
    expect(builds.length).toBe(4);
  });

  it('T-DFPROF-MB-009 lifecycle skips kinds with no samples', async () => {
    const mock = makeMockAdapter();
    const partialInput: LifecycleInput = {
      ...inputFor(BACKEND_PYROSCOPE),
      samples: {
        cpu: [STACK_HTTP_HOT],
        'off-cpu': [],
        memory: [],
        lock: [],
      },
    };
    await runFullProfilingLifecycle(mock, partialInput);
    const trace = mock.trace();
    const builds = trace.filter((t) => t.op === 'buildFlameGraph');
    // Only cpu had samples → only 1 build.
    expect(builds.length).toBe(1);
    expect(builds[0]?.metadata.kind).toBe('cpu');
  });
});
