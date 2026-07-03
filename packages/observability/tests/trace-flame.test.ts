import { describe, expect, it } from 'vitest';
import {
  buildSpanTree,
  drillDown,
  flattenFlame,
  renderFlameGraph,
  trace_fanoutParallel,
  trace_httpHandler,
  trace_nestedRetry,
  type SpanNode,
} from '../src/index.js';
import type { SpanRecord } from '../src/index.js';

describe('buildSpanTree — flat spans → tree', () => {
  it('http handler trace has 1 root with 2 children', () => {
    const tree = buildSpanTree(trace_httpHandler());
    expect(tree).toHaveLength(1);
    expect(tree[0]!.name).toBe('http.request');
    expect(tree[0]!.children).toHaveLength(2);
    expect(tree[0]!.children.map((c) => c.name).sort()).toEqual(['cache.get', 'db.query']);
  });

  it('root totalMs is endedAt - startedAt', () => {
    const tree = buildSpanTree(trace_httpHandler());
    expect(tree[0]!.totalMs).toBe(100);
  });

  it('open span (endedAt=null) yields totalMs=null and selfMs=null', () => {
    const open: SpanRecord = {
      name: 'ongoing',
      attributes: {},
      startedAt: 100,
      endedAt: null,
      parentSpanName: null,
      events: [],
    };
    const tree = buildSpanTree([open]);
    expect(tree[0]!.totalMs).toBeNull();
    expect(tree[0]!.selfMs).toBeNull();
  });

  it('depth increments per child level', () => {
    const tree = buildSpanTree(trace_nestedRetry());
    const root = tree[0]!;
    const retry = root.children[0]!;
    const httpFetch = retry.children[0]!;
    expect(root.depth).toBe(0);
    expect(retry.depth).toBe(1);
    expect(httpFetch.depth).toBe(2);
  });

  it('selfMs = totalMs - sum(child totalMs)', () => {
    const tree = buildSpanTree(trace_httpHandler());
    // root total 100, db.query 50, cache.get 10 → self 40
    expect(tree[0]!.selfMs).toBe(40);
  });

  it('orphan span (parent not found) treated as root', () => {
    const orphan: SpanRecord = {
      name: 'child',
      attributes: {},
      startedAt: 0,
      endedAt: 10,
      parentSpanName: 'missing-parent',
      events: [],
    };
    const tree = buildSpanTree([orphan]);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.name).toBe('child');
  });
});

describe('renderFlameGraph — collapse siblings by name', () => {
  it('3 sibling workers collapse into a single flame node with samples=3', () => {
    const tree = buildSpanTree(trace_fanoutParallel());
    const flame = renderFlameGraph(tree);
    expect(flame).toHaveLength(1);
    expect(flame[0]!.name).toBe('handler');
    expect(flame[0]!.children).toHaveLength(1);
    expect(flame[0]!.children[0]!.name).toBe('worker');
    expect(flame[0]!.children[0]!.samples).toBe(3);
  });

  it('sums totalMs across collapsed siblings', () => {
    const tree = buildSpanTree(trace_fanoutParallel());
    const flame = renderFlameGraph(tree);
    // 3 workers of 90ms each = 270ms
    expect(flame[0]!.children[0]!.totalMs).toBe(270);
  });

  it('nested retry pattern produces 2 samples on retry, 2 on http.fetch', () => {
    const tree = buildSpanTree(trace_nestedRetry());
    const flame = renderFlameGraph(tree);
    const retry = flame[0]!.children.find((c) => c.name === 'retry')!;
    expect(retry.samples).toBe(2);
    expect(retry.children[0]!.name).toBe('http.fetch');
    expect(retry.children[0]!.samples).toBe(2);
  });

  it('siblings with distinct names stay separate', () => {
    const tree = buildSpanTree(trace_httpHandler());
    const flame = renderFlameGraph(tree);
    expect(flame[0]!.children.map((c) => c.name).sort()).toEqual(['cache.get', 'db.query']);
  });

  it('empty span array produces empty flame graph', () => {
    expect(renderFlameGraph(buildSpanTree([]))).toEqual([]);
  });
});

describe('drillDown — subtree extraction', () => {
  it('returns subtree rooted at named node with depth normalized to 0', () => {
    const tree = buildSpanTree(trace_httpHandler());
    const flame = renderFlameGraph(tree);
    const drilled = drillDown(flame, 'db.query');
    expect(drilled).not.toBeNull();
    expect(drilled!.name).toBe('db.query');
    expect(drilled!.depth).toBe(0);
  });

  it('drilled node preserves totalMs and selfMs', () => {
    const tree = buildSpanTree(trace_httpHandler());
    const flame = renderFlameGraph(tree);
    const original = flame[0]!.children.find((c) => c.name === 'db.query')!;
    const drilled = drillDown(flame, 'db.query')!;
    expect(drilled.totalMs).toBe(original.totalMs);
    expect(drilled.selfMs).toBe(original.selfMs);
  });

  it('drilled subtree children keep relative depth', () => {
    const tree = buildSpanTree(trace_nestedRetry());
    const flame = renderFlameGraph(tree);
    const drilled = drillDown(flame, 'retry')!;
    expect(drilled.depth).toBe(0);
    expect(drilled.children[0]!.depth).toBe(1);
  });

  it('returns null when name not found', () => {
    const tree = buildSpanTree(trace_httpHandler());
    const flame = renderFlameGraph(tree);
    expect(drillDown(flame, 'nonexistent')).toBeNull();
  });

  it('excludes sibling branches from the drilled subtree', () => {
    const tree = buildSpanTree(trace_httpHandler());
    const flame = renderFlameGraph(tree);
    const drilled = drillDown(flame, 'db.query')!;
    const names = flattenFlame([drilled]).map((n) => n.name);
    expect(names).not.toContain('cache.get');
  });
});

describe('flattenFlame — depth-first walk', () => {
  it('http handler produces 3 nodes flattened', () => {
    const tree = buildSpanTree(trace_httpHandler());
    const flame = renderFlameGraph(tree);
    const flat = flattenFlame(flame);
    expect(flat).toHaveLength(3);
    expect(flat.map((n) => n.name)).toEqual(['http.request', 'db.query', 'cache.get']);
  });

  it('preserves depth ordering', () => {
    const tree = buildSpanTree(trace_nestedRetry());
    const flame = renderFlameGraph(tree);
    const flat = flattenFlame(flame);
    const depths = flat.map((n) => n.depth);
    // root=0, retry=1, http.fetch=2 in depth-first order
    expect(depths[0]).toBe(0);
    expect(depths).toContain(2);
  });
});

// selfMs / totalMs typed access sanity — ensures the SpanNode surface
// is stable for downstream consumers.
describe('SpanNode surface', () => {
  it('exposes name / totalMs / selfMs / children as typed fields', () => {
    const tree = buildSpanTree(trace_httpHandler());
    const first: SpanNode = tree[0]!;
    expect(typeof first.name).toBe('string');
    expect(typeof first.totalMs).toBe('number');
    expect(typeof first.selfMs).toBe('number');
    expect(Array.isArray(first.children)).toBe(true);
  });
});
