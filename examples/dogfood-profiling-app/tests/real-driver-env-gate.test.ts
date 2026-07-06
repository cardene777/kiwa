/**
 * Real-driver env-gate tests — cover the KIWA_MODE=real testcontainers
 * gate. When env vars are missing the real adapter emits a
 * KIWA_PROFILING_ENV_MISSING sentinel on the trace instead of crashing;
 * when env vars are wired (or `forceEnvPresent` in test) it walks the
 * same neutral event ordering as the mock. This is the seam the fidelity
 * harness uses to measure behavioural drift between mock semantics and
 * the real Pyroscope + Parca + eBPF stack.
 */

import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../src/adapters/real.js';
import { KIWA_PROFILING_ENV_MISSING } from '../src/adapters/interface.js';
import {
  BACKEND_EBPF,
  BACKEND_PARCA,
  BACKEND_PYROSCOPE,
} from '../src/policies/backends.js';
import { STACK_HTTP_HOT } from '../src/policies/stacks.js';

describe('dogfood-profiling-app — real driver env-gate', () => {
  it('T-DFPROF-EG-001 env missing → startSession emits KIWA_PROFILING_ENV_MISSING', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSession(BACKEND_PYROSCOPE);
    const trace = real.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_PROFILING_ENV_MISSING);
  });

  it('T-DFPROF-EG-002 env missing → every op reports the sentinel on the trace', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSession(BACKEND_PYROSCOPE);
    await real.detectResource({
      bucket: 'pyroscope',
      attributes: { 'service.name': 'x' },
    });
    await real.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    await real.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    const trace = real.trace();
    for (const entry of trace) {
      expect(entry.ok).toBe(false);
      expect(entry.errorKind).toBe(KIWA_PROFILING_ENV_MISSING);
    }
  });

  it('T-DFPROF-EG-003 forceEnvPresent → startSession executes and emits ok=true', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startSession(BACKEND_PYROSCOPE);
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(true);
    expect(trace[0]?.errorKind).toBeUndefined();
  });

  it('T-DFPROF-EG-004 forceEnvPresent → all 3 backends start without errors', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startSession(BACKEND_PYROSCOPE);
    await real.startSession(BACKEND_PARCA);
    await real.startSession(BACKEND_EBPF);
    const trace = real.trace();
    const startOps = trace.filter((t) => t.op === 'startSession');
    expect(startOps).toHaveLength(3);
    for (const entry of startOps) {
      expect(entry.ok).toBe(true);
    }
  });

  it('T-DFPROF-EG-005 KIWA_MODE=real requires all 2 endpoint vars', async () => {
    const partial = {
      KIWA_MODE: 'real',
      KIWA_PYROSCOPE_URL: 'http://localhost:4040',
      // Missing KIWA_PARCA_URL.
    };
    const real = makeRealAdapter({ env: partial });
    await real.startSession(BACKEND_PYROSCOPE);
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_PROFILING_ENV_MISSING);
  });

  it('T-DFPROF-EG-006 KIWA_MODE=real with both endpoints wired flips envReady=true', async () => {
    const full = {
      KIWA_MODE: 'real',
      KIWA_PYROSCOPE_URL: 'http://localhost:4040',
      KIWA_PARCA_URL: 'http://localhost:7070',
    };
    const real = makeRealAdapter({ env: full });
    await real.startSession(BACKEND_PYROSCOPE);
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(true);
    expect(trace[0]?.metadata.envReady).toBe(true);
  });

  it('T-DFPROF-EG-007 exportProfiles uses the pyroscope endpoint from env when ready', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_PYROSCOPE_URL: 'http://pyroscope.example:4040',
      KIWA_PARCA_URL: 'http://parca.example:7070',
    };
    const real = makeRealAdapter({ env });
    await real.startSession(BACKEND_PYROSCOPE);
    const result = await real.exportProfiles({
      bucket: 'pyroscope',
      kind: 'cpu',
      itemCount: 5,
    });
    expect(result.endpointUrl).toContain('pyroscope.example:4040');
    expect(result.endpointUrl).toContain('/ingest');
  });

  it('T-DFPROF-EG-008 queryPyroscope url points at PYROSCOPE endpoint', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_PYROSCOPE_URL: 'http://pyro.example:4040',
      KIWA_PARCA_URL: 'http://p:7070',
    };
    const real = makeRealAdapter({ env });
    await real.startSession(BACKEND_PYROSCOPE);
    await real.queryPyroscope({
      bucket: 'pyroscope',
      serviceName: 'dogfood',
      kind: 'cpu',
    });
    const trace = real.trace();
    const queryEntry = trace.find((t) => t.op === 'queryPyroscope');
    expect(String(queryEntry?.metadata.url ?? '')).toContain('pyro.example');
    expect(String(queryEntry?.metadata.url ?? '')).toContain('/render');
  });

  it('T-DFPROF-EG-009 queryParca url points at PARCA endpoint', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_PYROSCOPE_URL: 'http://p:4040',
      KIWA_PARCA_URL: 'http://parca.example:7070',
    };
    const real = makeRealAdapter({ env });
    await real.startSession(BACKEND_PARCA);
    await real.queryParca({
      bucket: 'parca',
      serviceName: 'dogfood',
      kind: 'cpu',
    });
    const trace = real.trace();
    const parcaEntry = trace.find((t) => t.op === 'queryParca');
    expect(String(parcaEntry?.metadata.url ?? '')).toContain('parca.example:7070');
    expect(String(parcaEntry?.metadata.url ?? '')).toContain(
      '/parca.query.v1alpha1.QueryService/QueryRange',
    );
  });

  it('T-DFPROF-EG-010 buildFlameGraph under forceEnvPresent runs without error', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startSession(BACKEND_PYROSCOPE);
    await real.ingestCpuSample({ bucket: 'pyroscope', sample: STACK_HTTP_HOT });
    const result = await real.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    expect(result.kind).toBe('cpu');
    expect(result.rootValue).toBeGreaterThan(0);
  });

  it('T-DFPROF-EG-011 drillDown under env-missing returns zeroed result without throwing', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSession(BACKEND_PYROSCOPE);
    const result = await real.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'main',
    });
    expect(result.matchedNodes).toBe(0);
    expect(result.totalValue).toBe(0);
    const trace = real.trace();
    const drillEntry = trace.find((t) => t.op === 'drillDown');
    expect(drillEntry?.ok).toBe(false);
    expect(drillEntry?.errorKind).toBe(KIWA_PROFILING_ENV_MISSING);
  });

  it('T-DFPROF-EG-012 reset clears env-missing trace as well', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSession(BACKEND_PYROSCOPE);
    await real.reset();
    expect(real.trace()).toHaveLength(0);
  });

  it('T-DFPROF-EG-013 real adapter re-emits envReady=false in metadata for the trace consumer', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSession(BACKEND_PYROSCOPE);
    const trace = real.trace();
    expect(trace[0]?.metadata.envReady).toBe(false);
    expect(trace[0]?.metadata.sentinel).toBe(KIWA_PROFILING_ENV_MISSING);
  });

  it('T-DFPROF-EG-014 loadEbpfProgram under forceEnvPresent tracks attached PIDs', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startSession(BACKEND_EBPF);
    const result = await real.loadEbpfProgram({
      bucket: 'ebpf',
      programName: 'stack-sampler',
      attachedPids: [1234, 5678, 9012],
    });
    expect(result.attachedPidCount).toBe(3);
  });

  it('T-DFPROF-EG-015 compareFlameGraphs under env-missing returns zeroed result', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSession(BACKEND_PYROSCOPE);
    const result = await real.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'cpu',
      baselineSamples: [STACK_HTTP_HOT],
    });
    expect(result.baselineTotal).toBe(0);
    expect(result.currentTotal).toBe(0);
    expect(result.addedFrames).toHaveLength(0);
  });

  it('T-DFPROF-EG-016 guardCardinality under env-missing skips computation', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSession(BACKEND_PYROSCOPE);
    const result = await real.guardCardinality({
      bucket: 'pyroscope',
      labels: { kind: ['cpu', 'memory'] },
      seriesBudget: 10,
    });
    expect(result.seriesCount).toBe(0);
    expect(result.breached).toBe(false);
  });
});
