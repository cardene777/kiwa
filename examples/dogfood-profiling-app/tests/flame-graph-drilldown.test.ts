/**
 * Flame graph + drill-down + comparison tests — cover the analytical
 * operations that a production Grafana Pyroscope UI performs on top of
 * the raw sample stream. These are the ops a service-owner exercises
 * when interpreting a profile — build the flame, click a hot frame,
 * compare against a baseline.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { SampleInput } from '../src/adapters/interface.js';
import { BACKEND_PYROSCOPE } from '../src/policies/backends.js';

const HOT_CPU: SampleInput = {
  kind: 'cpu',
  stack: ['main', 'server.handle', 'handler.route.a', 'work.spin'],
  valueBytes: 900_000,
  timestampMs: 1_700_000_000_000,
};
const COLD_CPU: SampleInput = {
  kind: 'cpu',
  stack: ['main', 'server.handle', 'handler.route.b', 'work.sleep'],
  valueBytes: 100_000,
  timestampMs: 1_700_000_000_100,
};

describe('dogfood-profiling-app — flame graph + drill-down', () => {
  it('T-DFPROF-FG-001 buildFlameGraph rootValue equals sum of sample values', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: COLD_CPU });
    const result = await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    expect(result.rootValue).toBe(HOT_CPU.valueBytes + COLD_CPU.valueBytes);
  });

  it('T-DFPROF-FG-002 buildFlameGraph reports maxDepth = deepest stack length', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({
      bucket: 'pyroscope',
      sample: {
        kind: 'cpu',
        stack: ['a', 'b', 'c', 'd', 'e'],
        valueBytes: 100,
        timestampMs: 1,
      },
    });
    await mock.ingestCpuSample({
      bucket: 'pyroscope',
      sample: { kind: 'cpu', stack: ['a', 'b'], valueBytes: 100, timestampMs: 2 },
    });
    const result = await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    // maxDepth is depth of the deepest tree node = 5 leaf.
    expect(result.maxDepth).toBeGreaterThanOrEqual(5);
  });

  it('T-DFPROF-FG-003 buildFlameGraph builds per-kind flames independently', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    await mock.ingestMemorySample({
      bucket: 'pyroscope',
      sample: {
        kind: 'memory',
        stack: ['runtime.mallocgc'],
        valueBytes: 4096,
        timestampMs: 1,
      },
    });
    const cpu = await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    const mem = await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'memory' });
    expect(cpu.rootValue).toBe(HOT_CPU.valueBytes);
    expect(mem.rootValue).toBe(4096);
  });

  it('T-DFPROF-FG-004 drillDown on hot frame aggregates value across all matching stacks', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    // Both stacks share `server.handle` — drilling that frame should
    // aggregate both.
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: COLD_CPU });
    await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    const result = await mock.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'server.handle',
    });
    expect(result.matchedNodes).toBe(1);
    expect(result.totalValue).toBe(HOT_CPU.valueBytes + COLD_CPU.valueBytes);
  });

  it('T-DFPROF-FG-005 drillDown on divergent branch isolates its subtree', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: COLD_CPU });
    await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    const hotResult = await mock.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'handler.route.a',
    });
    const coldResult = await mock.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'handler.route.b',
    });
    expect(hotResult.totalValue).toBe(HOT_CPU.valueBytes);
    expect(coldResult.totalValue).toBe(COLD_CPU.valueBytes);
  });

  it('T-DFPROF-FG-006 compareFlameGraphs handles empty baseline gracefully', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    const result = await mock.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'cpu',
      baselineSamples: [],
    });
    expect(result.baselineTotal).toBe(0);
    expect(result.currentTotal).toBe(HOT_CPU.valueBytes);
    // Everything in current is added when baseline is empty.
    expect(result.addedFrames.length).toBe(HOT_CPU.stack.length);
    expect(result.removedFrames.length).toBe(0);
  });

  it('T-DFPROF-FG-007 compareFlameGraphs — identical baseline and current has no diffs', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    const result = await mock.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'cpu',
      baselineSamples: [HOT_CPU],
    });
    expect(result.addedFrames.length).toBe(0);
    expect(result.removedFrames.length).toBe(0);
    // Same value at exactly 1.0x → not >= 1.2x → no regressions.
    expect(result.regressedFrames.length).toBe(0);
  });

  it('T-DFPROF-FG-008 compareFlameGraphs — current 1.2x baseline flags every shared frame', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    const baseline: SampleInput = {
      kind: 'cpu',
      stack: ['shared.a', 'shared.b'],
      valueBytes: 1000,
      timestampMs: 1,
    };
    await mock.ingestCpuSample({
      bucket: 'pyroscope',
      sample: { ...baseline, valueBytes: 1200, timestampMs: 2 },
    });
    const result = await mock.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'cpu',
      baselineSamples: [baseline],
    });
    expect(result.regressedFrames).toContain('shared.a');
    expect(result.regressedFrames).toContain('shared.b');
  });

  it('T-DFPROF-FG-009 compareFlameGraphs — current 1.19x baseline does NOT flag regression', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    const baseline: SampleInput = {
      kind: 'cpu',
      stack: ['shared.a'],
      valueBytes: 1000,
      timestampMs: 1,
    };
    await mock.ingestCpuSample({
      bucket: 'pyroscope',
      sample: { ...baseline, valueBytes: 1190, timestampMs: 2 },
    });
    const result = await mock.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'cpu',
      baselineSamples: [baseline],
    });
    expect(result.regressedFrames).not.toContain('shared.a');
  });

  it('T-DFPROF-FG-010 compareFlameGraphs for memory kind runs off memory samples', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    const baseline: SampleInput = {
      kind: 'memory',
      stack: ['heap.small'],
      valueBytes: 4096,
      timestampMs: 1,
    };
    await mock.ingestMemorySample({
      bucket: 'pyroscope',
      sample: {
        kind: 'memory',
        stack: ['heap.big'],
        valueBytes: 65536,
        timestampMs: 2,
      },
    });
    const result = await mock.compareFlameGraphs({
      bucket: 'pyroscope',
      kind: 'memory',
      baselineSamples: [baseline],
    });
    expect(result.addedFrames).toContain('heap.big');
    expect(result.removedFrames).toContain('heap.small');
    expect(result.baselineTotal).toBe(4096);
    expect(result.currentTotal).toBe(65536);
  });

  it('T-DFPROF-FG-011 buildFlameGraph followed by drillDown emits both ops on trace', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    await mock.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'main',
    });
    const trace = mock.trace();
    const buildEvent = trace.find((t) => t.op === 'buildFlameGraph');
    const drillEvent = trace.find((t) => t.op === 'drillDown');
    expect(buildEvent?.neutralEvent).toBe('profile.flame_graph_built');
    expect(drillEvent?.neutralEvent).toBe('profile.drill_down_resolved');
  });

  it('T-DFPROF-FG-012 drillDown result trace metadata includes matchedNodes count', async () => {
    const mock = makeMockAdapter();
    await mock.startSession(BACKEND_PYROSCOPE);
    await mock.ingestCpuSample({ bucket: 'pyroscope', sample: HOT_CPU });
    await mock.buildFlameGraph({ bucket: 'pyroscope', kind: 'cpu' });
    await mock.drillDown({
      bucket: 'pyroscope',
      kind: 'cpu',
      focusFrame: 'main',
    });
    const trace = mock.trace();
    const drillEvent = trace.find((t) => t.op === 'drillDown');
    expect(drillEvent?.metadata.matchedNodes).toBe(1);
  });
});
