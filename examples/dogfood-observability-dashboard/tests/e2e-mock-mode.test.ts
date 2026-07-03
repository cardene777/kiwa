import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DashboardAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { seededPanels, panelByChartType } from '../src/panels/index.js';
import {
  errorRateQuery,
  p99LatencyQuery,
  queueDepthQuery,
  requestRateQuery,
} from '../src/queries/index.js';
import {
  runFullMatrix,
  runInitialLoadFlow,
  runQueryMatrixFlow,
  runRefreshCycleFlow,
} from '../src/flows/dashboard-flows.js';
import { createDashboardPageController } from '../src/app/dashboard-page.js';

const buildConfig = () => ({
  dashboardId: 'test-dashboard',
  title: 'test',
  panels: seededPanels,
});

let adapter: DashboardAdapter;

beforeEach(() => {
  adapter = makeMockAdapter(buildConfig());
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-observability-dashboard (mock mode) — 5 panels + refresh + query + badge', () => {
  it('T-DFO-M-001 initial load renders all 5 panel chart_types (line/bar/gauge/stat/table)', async () => {
    await runInitialLoadFlow(adapter);
    const rendered = adapter.getPanel('panel-p99-latency-line');
    expect(rendered?.chartType).toBe('line');
    const kinds = new Set<string>();
    for (const p of seededPanels) {
      const r = adapter.getPanel(p.id);
      expect(r).toBeDefined();
      kinds.add(r!.chartType);
    }
    expect(Array.from(kinds).sort()).toEqual(
      ['bar', 'gauge', 'line', 'stat', 'table'],
    );
  });

  it('T-DFO-M-002 refresh cycle increments getRefreshCount monotonically', async () => {
    expect(adapter.getRefreshCount()).toBe(0);
    await runRefreshCycleFlow(adapter);
    expect(adapter.getRefreshCount()).toBe(3);
  });

  it('T-DFO-M-003 stat panel badge fires "critical" when http.errors sum ≥ 5', async () => {
    await runInitialLoadFlow(adapter);
    const stat = adapter.getPanel('panel-error-rate-stat');
    // Seeded errors sum: 3 + 2 + 5 = 10 (all records with status=500,
    // regardless of route), which crosses the critical threshold (>= 5).
    expect(stat?.value).toBe(10);
    expect(stat?.badge).toBe('critical');
  });

  it('T-DFO-M-004 line panel badge fires "critical" when p99 latency max ≥ 300 ms', async () => {
    await runInitialLoadFlow(adapter);
    const line = adapter.getPanel('panel-p99-latency-line');
    // Seeded p99 gauges: max(120, 280, 340) = 340 → critical (>= 300).
    expect(line?.value).toBe(340);
    expect(line?.badge).toBe('critical');
  });

  it('T-DFO-M-005 gauge panel badge fires "critical" when queue.depth last ≥ 20', async () => {
    await runInitialLoadFlow(adapter);
    const gauge = adapter.getPanel('panel-queue-depth-gauge');
    // Seeded queue depths: last() → 24 → critical (>= 20).
    expect(gauge?.value).toBe(24);
    expect(gauge?.badge).toBe('critical');
  });

  it('T-DFO-M-006 bar panel has no threshold badge (informational chart)', async () => {
    await runInitialLoadFlow(adapter);
    const bar = adapter.getPanel('panel-request-count-bar');
    expect(bar?.chartType).toBe('bar');
    expect(bar?.badge).toBeNull();
    // Seeded requests sum: 100 + 150 + 120 = 370.
    expect(bar?.value).toBe(370);
  });

  it('T-DFO-M-007 table panel counts samples via count aggregation', async () => {
    await runInitialLoadFlow(adapter);
    const table = adapter.getPanel('panel-request-count-table');
    expect(table?.chartType).toBe('table');
    // Seeded requests: 3 sample records.
    expect(table?.value).toBe(3);
    expect(table?.matchedSamples).toBe(3);
  });

  it('T-DFO-M-008 runQuery aggregates label-filtered http.errors correctly', async () => {
    const result = await adapter.runQuery(errorRateQuery());
    expect(result.metricName).toBe('http.errors');
    // status=500 filter matches all 3 seeded records: 3 + 2 + 5 = 10.
    expect(result.value).toBe(10);
    expect(result.matchedSamples).toBe(3);
  });

  it('T-DFO-M-009 runQuery aggregates p99 latency max via label filter', async () => {
    const result = await adapter.runQuery(p99LatencyQuery());
    expect(result.value).toBe(340);
    expect(result.matchedSamples).toBe(3);
  });

  it('T-DFO-M-010 runQuery aggregates queue.depth last via label filter', async () => {
    const result = await adapter.runQuery(queueDepthQuery());
    expect(result.value).toBe(24);
  });

  it('T-DFO-M-011 runQuery aggregates request rate sum without label filter', async () => {
    const result = await adapter.runQuery(requestRateQuery());
    expect(result.value).toBe(370);
    expect(result.matchedSamples).toBe(3);
  });

  it('T-DFO-M-012 metrics.queryCount tracks the number of runQuery calls', async () => {
    await runQueryMatrixFlow(adapter);
    expect(adapter.metrics().queryCount).toBe(4);
    expect(adapter.metrics().refreshCount).toBe(0);
  });

  it('T-DFO-M-013 metrics.refreshLatencySamplesMs records one sample per refresh', async () => {
    await runRefreshCycleFlow(adapter);
    expect(adapter.metrics().refreshLatencySamplesMs.length).toBe(3);
  });

  it('T-DFO-M-014 reset clears traces, metrics, and query counters', async () => {
    await runFullMatrix(adapter);
    expect(adapter.traces().length).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toEqual([]);
    expect(adapter.metrics().queryCount).toBe(0);
    // refreshCount is owned by the DashboardMock instance so it is not
    // affected by adapter.reset() — dashboard identity is preserved
    // across resets so tests can measure absolute refresh cadence.
    // runFullMatrix invokes refreshDashboard 5 times (1 initial load +
    // 3 refresh cycle + 1 alert badge).
    expect(adapter.metrics().refreshCount).toBe(5);
  });

  it('T-DFO-M-015 controller.load returns 5 panels + refresh_count=1', async () => {
    const controller = createDashboardPageController({
      mode: 'mock',
      panels: seededPanels,
    });
    const state = await controller.load();
    expect(state.mode).toBe('mock');
    expect(state.panels.length).toBe(5);
    expect(state.refreshCount).toBe(1);
    await controller.reset();
  });

  it('T-DFO-M-016 controller.refresh increments refresh_count', async () => {
    const controller = createDashboardPageController({
      mode: 'mock',
      panels: seededPanels,
    });
    await controller.load();
    const state = await controller.refresh();
    expect(state.refreshCount).toBe(2);
    await controller.reset();
  });

  it('T-DFO-M-017 unmatched label filter yields value=0 + matchedSamples=0', async () => {
    const result = await adapter.runQuery({
      metricName: 'http.errors',
      aggregation: 'sum',
      labels: { route: '/does-not-exist' },
    });
    expect(result.value).toBe(0);
    expect(result.matchedSamples).toBe(0);
  });

  it('T-DFO-M-018 panelByChartType returns the seeded panel for each chart_type', () => {
    for (const kind of ['line', 'bar', 'gauge', 'stat', 'table'] as const) {
      expect(panelByChartType(kind).chartType).toBe(kind);
    }
  });
});
