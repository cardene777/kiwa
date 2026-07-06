/**
 * Profiling lifecycle tests — walk one full continuous-profiling
 * lifecycle end-to-end and assert every op appears exactly once on the
 * neutral trace and returns the expected result shape. These tests cover
 * the mock adapter path (state-machine walk) so the observability v2.1
 * profiling axis semantics remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { ProfilingAdapter, SampleInput } from '../src/adapters/interface.js';
import {
  BACKEND_EBPF,
  BACKEND_PARCA,
  BACKEND_PYROSCOPE,
} from '../src/policies/backends.js';
import {
  STACK_DB_QUERY,
  STACK_HTTP_HOT,
  STACK_LOCK_CONTENTION,
  STACK_MEMORY_ALLOC,
  STACK_OFF_CPU_WAIT,
} from '../src/policies/stacks.js';

function newMock(): ProfilingAdapter {
  return makeMockAdapter();
}

describe('dogfood-profiling-app — profiling lifecycle', () => {
  it('T-DFPROF-LC-001 startSession returns the requested backend config', async () => {
    const mock = newMock();
    const result = await mock.startSession(BACKEND_PYROSCOPE);
    expect(result.backend).toBe('pyroscope');
    expect(result.serviceName).toBe('dogfood-pyroscope');
    expect(result.sampleRateHz).toBe(100);
  });

  it('T-DFPROF-LC-002 startSession emits profile.session_started onto the trace', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startSession');
    expect(trace[0]?.neutralEvent).toBe('profile.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFPROF-LC-003 startSession rejects zero or negative sampleRateHz', async () => {
    const mock = newMock();
    await expect(
      mock.startSession({ backend: 'pyroscope', serviceName: 'x', sampleRateHz: 0 }),
    ).rejects.toThrow(/sampleRateHz/);
    await expect(
      mock.startSession({ backend: 'pyroscope', serviceName: 'x', sampleRateHz: -1 }),
    ).rejects.toThrow(/sampleRateHz/);
  });

  it('T-DFPROF-LC-004 detectResource accumulates attributes onto the session', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    const r1 = await mock.detectResource({
      bucket: 'pyroscope',
      attributes: { 'service.name': 'dogfood', 'host.name': 'ci' },
    });
    expect(r1.attributeCount).toBe(2);
    const r2 = await mock.detectResource({
      bucket: 'pyroscope',
      attributes: { 'service.version': '0.0.1' },
    });
    expect(r2.attributeCount).toBe(3);
  });

  it('T-DFPROF-LC-005 ingestCpuSample raises the sampleCount by 1 each call', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    const r1 = await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    expect(r1.sampleCount).toBe(1);
    const r2 = await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_DB_QUERY });
    expect(r2.sampleCount).toBe(2);
  });

  it('T-DFPROF-LC-006 ingestOffCpuSample tracks off-cpu waits independently', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    const r = await mock.ingestOffCpuSample({
      bucket: 'pyroscope',
      sample: STACK_OFF_CPU_WAIT,
    });
    expect(r.kind).toBe('off-cpu');
    expect(r.sampleCount).toBe(1);
  });

  it('T-DFPROF-LC-007 ingestMemorySample records heap growth per stack', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    const r = await mock.ingestMemorySample({
      bucket: 'pyroscope',
      sample: STACK_MEMORY_ALLOC,
    });
    expect(r.kind).toBe('memory');
    expect(r.valueBytes).toBe(STACK_MEMORY_ALLOC.valueBytes);
  });

  it('T-DFPROF-LC-008 ingestLockSample records mutex contention', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    const r = await mock.ingestLockSample({
      bucket: 'pyroscope',
      sample: STACK_LOCK_CONTENTION,
    });
    expect(r.kind).toBe('lock');
    expect(r.stackDepth).toBe(STACK_LOCK_CONTENTION.stack.length);
  });

  it('T-DFPROF-LC-009 buildFlameGraph aggregates cpu samples into a flame root', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_DB_QUERY });
    const result = await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    expect(result.kind).toBe('cpu');
    expect(result.rootValue).toBe(
      STACK_HTTP_HOT.valueBytes + STACK_DB_QUERY.valueBytes,
    );
    expect(result.sampleCount).toBe(2);
    expect(result.branchCount).toBeGreaterThan(0);
  });

  it('T-DFPROF-LC-010 buildFlameGraph rejects when no samples for kind', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    // No memory samples yet.
    await expect(
      mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'memory' }),
    ).rejects.toThrow(/no samples/);
  });

  it('T-DFPROF-LC-011 drillDown returns matched nodes for a focus frame', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_DB_QUERY });
    await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    const result = await mock.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'http.handler',
    });
    expect(result.focusFrame).toBe('http.handler');
    expect(result.matchedNodes).toBeGreaterThanOrEqual(1);
    expect(result.totalValue).toBeGreaterThan(0);
  });

  it('T-DFPROF-LC-012 drillDown returns 0 matches for unknown frame', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    const result = await mock.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'nonexistent.frame',
    });
    expect(result.matchedNodes).toBe(0);
    expect(result.totalValue).toBe(0);
  });

  it('T-DFPROF-LC-013 compareFlameGraphs reports added / removed frames', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_DB_QUERY });
    const baseline: SampleInput[] = [STACK_HTTP_HOT];
    const result = await mock.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'cpu',
      baselineSamples: baseline,
    });
    expect(result.baselineTotal).toBe(STACK_HTTP_HOT.valueBytes);
    expect(result.currentTotal).toBe(STACK_DB_QUERY.valueBytes);
    // db.query / sql.parse should appear in `added` (baseline has http.handler / json.encode).
    expect(result.addedFrames.length).toBeGreaterThan(0);
    expect(result.removedFrames.length).toBeGreaterThan(0);
  });

  it('T-DFPROF-LC-014 compareFlameGraphs surfaces regressed frames when current >= 1.2x baseline', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    // Shared frame `common.frame` doubled from baseline (100) to current (300).
    const baseline: SampleInput[] = [
      {
        kind: 'cpu',
        stack: ['common.frame'],
        valueBytes: 100,
        timestampMs: 1,
      },
    ];
    await mock.ingestCpuSample({
      bucket: 'pyroscope',
      sample: { kind: 'cpu', stack: ['common.frame'], valueBytes: 300, timestampMs: 2 },
    });
    const result = await mock.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'cpu',
      baselineSamples: baseline,
    });
    expect(result.regressedFrames).toContain('common.frame');
  });

  it('T-DFPROF-LC-015 guardCardinality flags breach when series > budget', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    // 3 kinds × 3 services × 3 tenants = 27 series, budget 10 → breach.
    const result = await mock.guardCardinality({
      bucket: 'pyroscope',
      labels: {
        kind: ['cpu', 'memory', 'lock'],
        service: ['s1', 's2', 's3'],
        tenant: ['t1', 't2', 't3'],
      },
      seriesBudget: 10,
    });
    expect(result.seriesCount).toBe(27);
    expect(result.breached).toBe(true);
  });

  it('T-DFPROF-LC-016 guardCardinality passes when series <= budget', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    const result = await mock.guardCardinality({
      bucket: 'pyroscope',
      labels: { kind: ['cpu'] },
      seriesBudget: 100,
    });
    expect(result.seriesCount).toBe(1);
    expect(result.breached).toBe(false);
  });

  it('T-DFPROF-LC-017 exportProfiles returns backend-specific endpoint URL', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    const result = await mock.exportProfiles({
      bucket: 'pyroscope',
      kind: 'cpu',
      itemCount: 1,
    });
    expect(result.backend).toBe('pyroscope');
    expect(result.endpointUrl).toContain('pyroscope');
    expect(result.contentType).toBe('application/octet-stream');
  });

  it('T-DFPROF-LC-018 exportProfiles uses parca content type when backend=parca', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PARCA);
    const result = await mock.exportProfiles({
      bucket: 'parca',
      kind: 'cpu',
      itemCount: 0,
    });
    expect(result.contentType).toBe('application/vnd.google.protobuf');
  });

  it('T-DFPROF-LC-019 exportProfiles uses ebpf content type when backend=ebpf', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_EBPF);
    const result = await mock.exportProfiles({
      bucket: 'ebpf',
      kind: 'cpu',
      itemCount: 0,
    });
    expect(result.contentType).toBe('application/x-perf-script');
  });

  it('T-DFPROF-LC-020 queryPyroscope surfaces the matched sample count', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_DB_QUERY });
    const result = await mock.queryPyroscope({
      bucket: 'pyroscope',
      serviceName: 'dogfood',
      kind: 'cpu',
    });
    expect(result.matchedSampleCount).toBe(2);
  });

  it('T-DFPROF-LC-021 queryParca isolates the kind slice', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PARCA);
    await mock.ingestCpuSample({ bucket: 'parca', sample: STACK_HTTP_HOT });
    await mock.ingestMemorySample({ bucket: 'parca', sample: STACK_MEMORY_ALLOC });
    const cpuResult = await mock.queryParca({
      bucket: 'parca',
      serviceName: 'dogfood',
      kind: 'cpu',
    });
    const memResult = await mock.queryParca({
      bucket: 'parca',
      serviceName: 'dogfood',
      kind: 'memory',
    });
    expect(cpuResult.matchedSampleCount).toBe(1);
    expect(memResult.matchedSampleCount).toBe(1);
  });

  it('T-DFPROF-LC-022 loadEbpfProgram tracks attached PIDs', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_EBPF);
    const result = await mock.loadEbpfProgram({
      bucket: 'ebpf',
      programName: 'stack-sampler',
      attachedPids: [1234, 5678],
    });
    expect(result.programName).toBe('stack-sampler');
    expect(result.attachedPidCount).toBe(2);
  });

  it('T-DFPROF-LC-023 reset clears buckets and trace', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    await mock.reset();
    expect(mock.trace()).toHaveLength(0);
    // Subsequent op on stale bucket should reject.
    await expect(
      mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT }),
    ).rejects.toThrow(/not been started/);
  });

  it('T-DFPROF-LC-024 op on unstarted bucket rejects', async () => {
    const mock = newMock();
    await expect(
      mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT }),
    ).rejects.toThrow(/not been started/);
  });

  it('T-DFPROF-LC-025 drillDown before buildFlameGraph rejects', async () => {
    const mock = newMock();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    await expect(
      mock.drillDown({ bucket: 'pyroscope', kind: 'cpu', focusFrame: 'main' }),
    ).rejects.toThrow(/flame graph/);
  });
});
