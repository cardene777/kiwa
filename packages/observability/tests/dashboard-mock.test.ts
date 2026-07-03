import { describe, expect, it } from 'vitest';
import {
  DashboardMock,
  buildDashboardMock,
  createOtelMock,
  panel_httpErrorRate,
  panel_p99Latency,
  panel_queueDepth,
  type PanelConfig,
} from '../src/index.js';

function newCollector(now = () => 1_000) {
  return createOtelMock({ now });
}

describe('DashboardMock — metric query + panel evaluation', () => {
  it('sum aggregation over http.errors counters', () => {
    const otel = newCollector(() => 100);
    otel.meter.createCounter('http.errors').add(3);
    otel.meter.createCounter('http.errors').add(4);
    const dash = buildDashboardMock({
      id: 'd1',
      title: 'test',
      panels: [panel_httpErrorRate()],
      collector: otel.collector,
    });
    const results = dash.refresh();
    expect(results).toHaveLength(1);
    expect(results[0]!.value).toBe(7);
    expect(results[0]!.matchedRecords).toBe(2);
  });

  it('max aggregation picks the largest histogram sample', () => {
    let clock = 100;
    const otel = createOtelMock({ now: () => clock });
    otel.meter.createHistogram('http.latency.ms').record(200);
    clock = 110;
    otel.meter.createHistogram('http.latency.ms').record(800);
    clock = 120;
    otel.meter.createHistogram('http.latency.ms').record(400);
    const dash = buildDashboardMock({
      id: 'd1',
      title: 'test',
      panels: [panel_p99Latency()],
      collector: otel.collector,
    });
    const results = dash.refresh();
    expect(results[0]!.value).toBe(800);
  });

  it('avg aggregation divides sum by sample count', () => {
    const otel = newCollector();
    otel.meter.createGauge('mem.mb').record(100);
    otel.meter.createGauge('mem.mb').record(200);
    otel.meter.createGauge('mem.mb').record(300);
    const panel: PanelConfig = {
      id: 'avg',
      title: 'avg mem',
      kind: 'stat',
      query: { metricName: 'mem.mb', aggregation: 'avg' },
    };
    const dash = new DashboardMock({ id: 'd', title: 'd', panels: [panel] }, otel.collector);
    expect(dash.refresh()[0]!.value).toBe(200);
  });

  it('min aggregation picks the smallest sample', () => {
    const otel = newCollector();
    otel.meter.createGauge('rate').record(5);
    otel.meter.createGauge('rate').record(1);
    otel.meter.createGauge('rate').record(9);
    const panel: PanelConfig = {
      id: 'min',
      title: 'min rate',
      kind: 'stat',
      query: { metricName: 'rate', aggregation: 'min' },
    };
    const dash = new DashboardMock({ id: 'd', title: 'd', panels: [panel] }, otel.collector);
    expect(dash.refresh()[0]!.value).toBe(1);
  });

  it('count aggregation returns sample cardinality', () => {
    const otel = newCollector();
    otel.meter.createCounter('hit').add(1);
    otel.meter.createCounter('hit').add(1);
    otel.meter.createCounter('hit').add(1);
    const panel: PanelConfig = {
      id: 'cnt',
      title: 'cnt',
      kind: 'stat',
      query: { metricName: 'hit', aggregation: 'count' },
    };
    const dash = new DashboardMock({ id: 'd', title: 'd', panels: [panel] }, otel.collector);
    expect(dash.refresh()[0]!.value).toBe(3);
  });

  it('last aggregation returns the newest inserted value', () => {
    const otel = newCollector();
    otel.meter.createGauge('cpu').record(20);
    otel.meter.createGauge('cpu').record(50);
    otel.meter.createGauge('cpu').record(30);
    const panel: PanelConfig = {
      id: 'last',
      title: 'last',
      kind: 'stat',
      query: { metricName: 'cpu', aggregation: 'last' },
    };
    const dash = new DashboardMock({ id: 'd', title: 'd', panels: [panel] }, otel.collector);
    expect(dash.refresh()[0]!.value).toBe(30);
  });

  it('empty match returns 0 with matchedRecords=0', () => {
    const otel = newCollector();
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_httpErrorRate()],
      collector: otel.collector,
    });
    const r = dash.refresh()[0]!;
    expect(r.value).toBe(0);
    expect(r.matchedRecords).toBe(0);
  });
});

describe('DashboardMock — tag filter + time window', () => {
  it('tagFilter suppresses non-matching records', () => {
    const otel = newCollector();
    otel.meter.createGauge('queue.depth').record(500, { queue: 'default' });
    otel.meter.createGauge('queue.depth').record(1500, { queue: 'priority' });
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_queueDepth('p', 'default')],
      collector: otel.collector,
    });
    expect(dash.refresh()[0]!.value).toBe(500);
  });

  it('sinceMs / untilMs bound the time window', () => {
    let clock = 100;
    const otel = createOtelMock({ now: () => clock });
    otel.meter.createGauge('cpu').record(1);
    clock = 200;
    otel.meter.createGauge('cpu').record(2);
    clock = 300;
    otel.meter.createGauge('cpu').record(3);
    const panel: PanelConfig = {
      id: 'w',
      title: 'w',
      kind: 'stat',
      query: { metricName: 'cpu', aggregation: 'sum', sinceMs: 150, untilMs: 250 },
    };
    const dash = new DashboardMock({ id: 'd', title: 'd', panels: [panel] }, otel.collector);
    expect(dash.refresh()[0]!.value).toBe(2);
  });
});

describe('DashboardMock — thresholds + badge', () => {
  it('picks critical badge over warn when both operators match', () => {
    const otel = newCollector();
    otel.meter.createCounter('http.errors').add(50);
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_httpErrorRate()],
      collector: otel.collector,
    });
    expect(dash.refresh()[0]!.badge).toBe('critical');
  });

  it('picks warn badge when only warn threshold matches', () => {
    const otel = newCollector();
    otel.meter.createCounter('http.errors').add(1);
    // warn: gte 0.01, critical: gte 0.1; sum is 1 which passes critical.
    // Add a scenario for latency instead where value sits between thresholds.
    const panel: PanelConfig = {
      id: 'p',
      title: 'p',
      kind: 'timeseries',
      query: { metricName: 'http.latency.ms', aggregation: 'max' },
      thresholds: [
        { operator: 'gte', value: 1000, label: 'critical' },
        { operator: 'gte', value: 500, label: 'warn' },
      ],
    };
    otel.meter.createHistogram('http.latency.ms').record(700);
    const dash = new DashboardMock({ id: 'd', title: 'd', panels: [panel] }, otel.collector);
    expect(dash.refresh()[0]!.badge).toBe('warn');
  });

  it('returns null badge when no threshold matches', () => {
    const otel = newCollector();
    otel.meter.createHistogram('http.latency.ms').record(100);
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_p99Latency()],
      collector: otel.collector,
    });
    expect(dash.refresh()[0]!.badge).toBeNull();
  });

  it('returns null badge when thresholds is undefined', () => {
    const otel = newCollector();
    otel.meter.createGauge('rate').record(9999);
    const panel: PanelConfig = {
      id: 'p',
      title: 'p',
      kind: 'stat',
      query: { metricName: 'rate', aggregation: 'last' },
    };
    const dash = new DashboardMock({ id: 'd', title: 'd', panels: [panel] }, otel.collector);
    expect(dash.refresh()[0]!.badge).toBeNull();
  });
});

describe('DashboardMock — refresh lifecycle', () => {
  it('refreshCount increments per refresh call', () => {
    const otel = newCollector();
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_httpErrorRate()],
      collector: otel.collector,
    });
    dash.refresh();
    dash.refresh();
    dash.refresh();
    expect(dash.getRefreshCount()).toBe(3);
  });

  it('lastResults reflect data added between refreshes', () => {
    const otel = newCollector();
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_httpErrorRate()],
      collector: otel.collector,
    });
    dash.refresh();
    otel.meter.createCounter('http.errors').add(5);
    const r2 = dash.refresh();
    expect(r2[0]!.value).toBe(5);
  });

  it('panel() looks up by id from most recent results', () => {
    const otel = newCollector();
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_httpErrorRate('err'), panel_p99Latency('lat')],
      collector: otel.collector,
    });
    dash.refresh();
    expect(dash.panel('err')?.title).toBe('HTTP error rate');
    expect(dash.panel('lat')?.title).toBe('p99 request latency (ms)');
    expect(dash.panel('missing')).toBeUndefined();
  });

  it('refreshedAt tracks the injected clock', () => {
    let clock = 500;
    const otel = createOtelMock({ now: () => clock });
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_httpErrorRate()],
      collector: otel.collector,
      now: () => clock,
    });
    clock = 750;
    expect(dash.refresh()[0]!.refreshedAt).toBe(750);
  });

  it('getLastResults returns empty array before first refresh', () => {
    const otel = newCollector();
    const dash = buildDashboardMock({
      id: 'd',
      title: 'd',
      panels: [panel_httpErrorRate()],
      collector: otel.collector,
    });
    expect(dash.getLastResults()).toEqual([]);
  });
});
