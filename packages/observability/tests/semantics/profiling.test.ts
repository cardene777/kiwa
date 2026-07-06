import { describe, expect, it } from 'vitest';
import {
  buildFlameGraph,
  flattenFlameGraph,
  sampleCpu,
  sampleMemory,
  sampleOffCpu,
  startProfiling,
} from '../../src/semantics/index.js';

describe('profiling axis — happy path', () => {
  it('records cpu samples with stack depth', () => {
    const s = startProfiling({ target: 'prometheus', serviceName: 'api' });
    const step = sampleCpu(s, {
      stack: ['main', 'handler', 'query', 'db'],
      valueBytes: 100,
      timestampMs: 1,
    });
    expect(step.metadata.kind).toBe('cpu');
    expect(step.metadata.stackDepth).toBe(4);
  });

  it('records memory samples independently', () => {
    const s = startProfiling({ target: 'grafana-oss', serviceName: 'x' });
    sampleMemory(s, { stack: ['alloc'], valueBytes: 4096, timestampMs: 1 });
    expect(s.samples.filter((v) => v.kind === 'memory')).toHaveLength(1);
  });

  it('records off-cpu samples', () => {
    const s = startProfiling({ target: 'loki', serviceName: 'x' });
    sampleOffCpu(s, { stack: ['sleep'], valueBytes: 10, timestampMs: 1 });
    expect(s.samples[0]?.kind).toBe('off-cpu');
  });

  it('builds flame graph aggregating same-frame stacks', () => {
    const s = startProfiling({ target: 'prometheus', serviceName: 'x' });
    sampleCpu(s, { stack: ['main', 'a', 'b'], valueBytes: 10, timestampMs: 1 });
    sampleCpu(s, { stack: ['main', 'a', 'c'], valueBytes: 20, timestampMs: 2 });
    sampleCpu(s, { stack: ['main', 'd'], valueBytes: 30, timestampMs: 3 });
    const step = buildFlameGraph(s, { kind: 'cpu' });
    expect(step.metadata.rootValue).toBe(60);
    expect(step.metadata.branchCount).toBe(1);
    const flat = flattenFlameGraph(s.flameGraph);
    const main = flat.find((f) => f.frame === 'main');
    expect(main?.totalValue).toBe(60);
    const a = flat.find((f) => f.frame === 'a');
    expect(a?.totalValue).toBe(30);
  });

  it('flame graph filters by kind', () => {
    const s = startProfiling({ target: 'otel-collector', serviceName: 'x' });
    sampleCpu(s, { stack: ['main'], valueBytes: 10, timestampMs: 1 });
    sampleMemory(s, { stack: ['alloc'], valueBytes: 100, timestampMs: 2 });
    const step = buildFlameGraph(s, { kind: 'memory' });
    expect(step.metadata.rootValue).toBe(100);
  });

  it('flattenFlameGraph returns empty array for null root', () => {
    expect(flattenFlameGraph(null)).toEqual([]);
  });

  it('translates provider event for each target', () => {
    for (const target of ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const) {
      const s = startProfiling({ target, serviceName: 'x' });
      const step = sampleCpu(s, { stack: ['x'], valueBytes: 1, timestampMs: 1 });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('profiling axis — invariant guards', () => {
  it('rejects empty serviceName', () => {
    expect(() => startProfiling({ target: 'prometheus', serviceName: '' })).toThrow(/serviceName/);
  });

  it('rejects empty stack in cpu sample', () => {
    const s = startProfiling({ target: 'prometheus', serviceName: 'x' });
    expect(() => sampleCpu(s, { stack: [], valueBytes: 1, timestampMs: 1 })).toThrow(/stack/);
  });

  it('rejects negative valueBytes in memory sample', () => {
    const s = startProfiling({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      sampleMemory(s, { stack: ['x'], valueBytes: -1, timestampMs: 1 }),
    ).toThrow(/valueBytes/);
  });

  it('rejects empty stack in off-cpu sample', () => {
    const s = startProfiling({ target: 'prometheus', serviceName: 'x' });
    expect(() => sampleOffCpu(s, { stack: [], valueBytes: 1, timestampMs: 1 })).toThrow(/stack/);
  });

  it('build flame graph fails when no samples of kind', () => {
    const s = startProfiling({ target: 'prometheus', serviceName: 'x' });
    sampleCpu(s, { stack: ['x'], valueBytes: 1, timestampMs: 1 });
    expect(() => buildFlameGraph(s, { kind: 'memory' })).toThrow(/no samples/);
  });

  it('records each sample independently in history', () => {
    const s = startProfiling({ target: 'prometheus', serviceName: 'x' });
    sampleCpu(s, { stack: ['a'], valueBytes: 1, timestampMs: 1 });
    sampleCpu(s, { stack: ['b'], valueBytes: 1, timestampMs: 2 });
    expect(s.history).toHaveLength(2);
  });
});
