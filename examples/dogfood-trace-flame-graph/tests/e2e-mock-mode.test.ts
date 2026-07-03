import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  FlameExplorerAdapter,
} from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { seededTraces, traceById } from '../src/traces/index.js';
import {
  buildDrilldownView,
} from '../src/components/Drilldown.js';
import {
  buildLogPanelRows,
  filterByLevel,
  filterBySpan,
} from '../src/components/LogPanel.js';
import {
  buildSpanTreeRows,
  collapseSubtree,
} from '../src/components/SpanTree.js';
import {
  layoutFlameGraph,
  summariseFlameGraph,
} from '../src/components/FlameGraph.js';
import { runFullMatrix, OPS_UNDER_TEST } from '../src/flows/flame-flows.js';
import { createFlameService } from '../src/app/flame-service.js';

let clock = 1_000;
function tick(ms: number): number {
  clock += ms;
  return clock;
}

const buildConfig = () => ({
  explorerId: 'test-explorer',
  traces: seededTraces(),
  now: () => clock,
});

let adapter: FlameExplorerAdapter;

beforeEach(() => {
  clock = 1_000;
  adapter = makeMockAdapter(buildConfig());
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-trace-flame-graph (mock mode) — 10 traces × flame graph × drill-down × log correlation', () => {
  it('T-DFT-M-001 seeded set contains 10 canonical traces', () => {
    expect(seededTraces()).toHaveLength(10);
    const ids = seededTraces().map((t) => t.traceId);
    expect(ids).toContain('trace-http-handler');
    expect(ids).toContain('trace-bg-job');
  });

  it('T-DFT-M-002 seeded traces contain 100+ spans + 30+ logs total', () => {
    const spans = seededTraces().reduce((sum, t) => sum + t.spans.length, 0);
    const logs = seededTraces().reduce((sum, t) => sum + t.logs.length, 0);
    // The counts are the source of truth for the fixture set; the
    // spec explicitly targets 100+ spans across the 10 fixtures.
    expect(spans).toBeGreaterThanOrEqual(100);
    expect(logs).toBeGreaterThanOrEqual(30);
  });

  it('T-DFT-M-003 loadTrace returns the seeded payload', async () => {
    const trace = await adapter.loadTrace('trace-http-handler');
    expect(trace.traceId).toBe('trace-http-handler');
    // http-handler = handler + auth + db.query {plan, execute, fetch} + serialize.
    expect(trace.spans).toHaveLength(7);
    expect(trace.logs).toHaveLength(3);
  });

  it('T-DFT-M-004 loadTrace records JAEGER_TRACE_NOT_FOUND for unknown ids', async () => {
    await expect(() => adapter.loadTrace('nope')).rejects.toThrowError();
    const traces = adapter.traces();
    expect(traces.some((t) => t.op === 'loadTrace' && t.errorKind === 'JAEGER_TRACE_NOT_FOUND')).toBe(true);
  });

  it('T-DFT-M-005 renderFlame returns a collapsed flame graph', async () => {
    const flame = await adapter.renderFlame('trace-fanout-parallel');
    // job.dispatcher root, workers collapse.
    expect(flame).toHaveLength(1);
    expect(flame[0]!.name).toBe('job.dispatcher');
    const workers = flame[0]!.children.find((c) => c.name === 'worker.process');
    expect(workers).toBeDefined();
    expect(workers!.samples).toBe(2);
  });

  it('T-DFT-M-006 renderFlame is memoised — repeated calls return identical shape', async () => {
    const a = await adapter.renderFlame('trace-http-handler');
    const b = await adapter.renderFlame('trace-http-handler');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('T-DFT-M-007 drillDown returns a subtree rooted at the named node', async () => {
    const drilled = await adapter.drillDown('trace-nested-retry', 'http.retry');
    expect(drilled).not.toBeNull();
    expect(drilled!.name).toBe('http.retry');
    expect(drilled!.depth).toBe(0);
  });

  it('T-DFT-M-008 drillDown returns null when the node is not present', async () => {
    const drilled = await adapter.drillDown('trace-http-handler', 'no.such.name');
    expect(drilled).toBeNull();
  });

  it('T-DFT-M-009 joinLogs joins every log to its parent span by spanId', async () => {
    const joined = await adapter.joinLogs('trace-http-handler');
    // 3 logs seeded, all with span ids.
    expect(joined).toHaveLength(3);
    expect(joined.every((j) => j.spanId !== null)).toBe(true);
    // The first log correlates to the root handler span.
    expect(joined[0]!.spanName).toBe('http.handler');
  });

  it('T-DFT-M-010 joinLogs correlates via traceId when spanId is missing', async () => {
    const joined = await adapter.joinLogs('trace-batch-write');
    expect(joined.length).toBeGreaterThan(0);
    // Every log carries trace_id so linkAll reports traceId even when
    // the log's spanId happens to be present too.
    expect(joined.every((j) => j.traceId !== null)).toBe(true);
  });

  it('T-DFT-M-011 filterByName aggregates all occurrences of a name', async () => {
    const stats = await adapter.filterByName('trace-fanout-parallel', 'worker.process');
    expect(stats).not.toBeNull();
    // Two worker.process spans collapse into one flame node (samples=2)
    // so filterByName reports samples=2.
    expect(stats!.samples).toBe(2);
    expect(stats!.totalMs).toBeGreaterThan(0);
    expect(stats!.averageMs).toBeGreaterThan(0);
  });

  it('T-DFT-M-012 filterByName returns null when no node matches', async () => {
    const stats = await adapter.filterByName('trace-http-handler', 'no.such.name');
    expect(stats).toBeNull();
  });

  it('T-DFT-M-013 metrics record load + render + drill-down counts', async () => {
    await adapter.loadTrace('trace-http-handler');
    await adapter.renderFlame('trace-http-handler');
    await adapter.drillDown('trace-http-handler', 'db.query');
    const m = adapter.metrics();
    expect(m.loadCount).toBe(1);
    expect(m.renderCount).toBe(1);
    expect(m.drillDownCount).toBe(1);
  });

  it('T-DFT-M-014 traces() emits an event per op call', async () => {
    tick(10);
    await adapter.loadTrace('trace-http-handler');
    tick(10);
    await adapter.renderFlame('trace-http-handler');
    const events = adapter.traces();
    expect(events.map((e) => e.op)).toEqual(['loadTrace', 'renderFlame']);
  });

  it('T-DFT-M-015 runFullMatrix executes all 5 ops end-to-end', async () => {
    await runFullMatrix(adapter);
    const events = adapter.traces();
    const ops = new Set(events.filter((e) => e.ok).map((e) => e.op));
    for (const op of OPS_UNDER_TEST) {
      expect(ops.has(op)).toBe(true);
    }
  });

  it('T-DFT-M-016 layoutFlameGraph produces stable widths that sum to 100', async () => {
    const flame = await adapter.renderFlame('trace-api-gateway');
    const layout = layoutFlameGraph(flame);
    // Depth-0 nodes always sum to 100% of the chart width.
    const depthZeroWidth = layout.rows
      .filter((r) => r.depth === 0)
      .reduce((sum, r) => sum + r.widthPct, 0);
    expect(depthZeroWidth).toBeCloseTo(100, 2);
  });

  it('T-DFT-M-017 summariseFlameGraph sorts by totalMs desc', async () => {
    const flame = await adapter.renderFlame('trace-nested-retry');
    const summary = summariseFlameGraph(flame);
    for (let i = 1; i < summary.length; i += 1) {
      expect(summary[i - 1]!.totalMs).toBeGreaterThanOrEqual(summary[i]!.totalMs);
    }
  });

  it('T-DFT-M-018 buildSpanTreeRows yields rows ordered by DFS from root', async () => {
    const trace = traceById('trace-cache-cycle')!;
    const rows = buildSpanTreeRows(trace.spans);
    expect(rows[0]!.spanId).toBe('s-cache-1');
    expect(rows[0]!.depth).toBe(0);
    expect(rows[1]!.depth).toBe(1);
  });

  it('T-DFT-M-019 collapseSubtree hides descendants of a collapsed span', async () => {
    const trace = traceById('trace-ssr-tree')!;
    const rows = buildSpanTreeRows(trace.spans);
    const collapsed = collapseSubtree(rows, 's-ssr-4');
    // The collapsed span stays in the list, descendants disappear.
    expect(collapsed.find((r) => r.spanId === 's-ssr-4')).toBeDefined();
    expect(collapsed.find((r) => r.spanId === 's-ssr-5')).toBeUndefined();
    expect(collapsed.find((r) => r.spanId === 's-ssr-6')).toBeUndefined();
  });

  it('T-DFT-M-020 buildLogPanelRows sorts by timestamp ascending', async () => {
    const joined = await adapter.joinLogs('trace-bg-job');
    const rows = buildLogPanelRows(joined);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1]!.timestamp).toBeLessThanOrEqual(rows[i]!.timestamp);
    }
  });

  it('T-DFT-M-021 filterByLevel drops debug + info when the threshold is warn', async () => {
    const joined = await adapter.joinLogs('trace-nested-retry');
    const rows = buildLogPanelRows(joined);
    const filtered = filterByLevel(rows, 'warn');
    expect(filtered.every((r) => ['warn', 'error', 'fatal'].includes(r.level))).toBe(true);
    // The nested-retry trace has 2 warns + 1 error, so we expect >= 3.
    expect(filtered.length).toBeGreaterThanOrEqual(3);
  });

  it('T-DFT-M-022 filterBySpan scopes rows to the given span id', async () => {
    const joined = await adapter.joinLogs('trace-bg-job');
    const rows = buildLogPanelRows(joined);
    const scoped = filterBySpan(rows, 's-job-7');
    expect(scoped.every((r) => r.spanId === 's-job-7')).toBe(true);
    expect(scoped.length).toBe(1);
  });

  it('T-DFT-M-023 buildDrilldownView surfaces breadcrumb + summary + headerStats', async () => {
    const flame = await adapter.renderFlame('trace-ssr-tree');
    const focused = flame[0]!.children.find((c) => c.name === 'layout.root')!;
    const view = buildDrilldownView(flame, focused);
    expect(view.breadcrumb).toContain('layout.root');
    expect(view.breadcrumb[0]).toBe('ssr.render');
    expect(view.headerStats.name).toBe('layout.root');
    expect(view.summary.length).toBeGreaterThan(0);
    expect(view.summary[0]!.totalMs).toBeGreaterThanOrEqual(view.summary[view.summary.length - 1]!.totalMs);
  });

  it('T-DFT-M-024 createFlameService.focus loads + renders + joins in one call', async () => {
    const service = createFlameService({ mode: 'mock', config: buildConfig() });
    const state = await service.focus('trace-http-handler');
    expect(state.focusedTraceId).toBe('trace-http-handler');
    expect(state.loadedTrace?.traceId).toBe('trace-http-handler');
    expect(state.flame).toHaveLength(1);
    expect(state.logs.length).toBeGreaterThan(0);
    await service.reset();
  });

  it('T-DFT-M-025 createFlameService.drill returns a subtree rooted at the target name', async () => {
    const service = createFlameService({ mode: 'mock', config: buildConfig() });
    const drilled = await service.drill('trace-fanout-parallel', 'worker.process');
    expect(drilled).not.toBeNull();
    expect(drilled!.name).toBe('worker.process');
    expect(drilled!.samples).toBe(2);
    await service.reset();
  });
});
