/**
 * v1.17-5 docs 補強 (Issue #782) — tutorial code snippet 検証。
 *
 * `docs/tutorials/22-observability-dashboard.md` /
 * `docs/tutorials/23-alert-orchestrator.md` /
 * `docs/tutorials/24-trace-flame-graph.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import {
  AlertRouter,
  DashboardMock,
  LogCorrelationIndex,
  buildSpanTree,
  createOtelMock,
  defaultRoute,
  drillDown,
  escalation_pagerDutyTwoStep,
  flattenFlame,
  logs_forHttpTrace,
  panel_httpErrorRate,
  panel_p99Latency,
  panel_queueDepth,
  renderFlameGraph,
  rule_errorRateCritical,
  rule_latencyDegraded,
  rule_queueBackpressure,
  trace_fanoutParallel,
  trace_httpHandler,
} from '../src/index.js';

/**
 * Tutorial 22 — Observability dashboard の src/dashboard.ts factory と
 * 同一 shape。 tutorial に載っている 3 panel + threshold の挙動を確認。
 */
function buildSREDashboard(now: () => number = () => 1_000) {
  const otel = createOtelMock({ now });
  const collector = otel.collector;
  const dashboard = new DashboardMock(
    {
      id: 'sre',
      title: 'SRE overview',
      panels: [
        panel_httpErrorRate(),
        panel_p99Latency(),
        panel_queueDepth('panel-queue-depth', 'jobs'),
      ],
    },
    collector,
    { now },
  );
  return { collector, dashboard, otel };
}

describe('tutorial 22 — observability dashboard snippets', () => {
  it('refresh() re-evaluates every panel and increments the refresh count', () => {
    const { dashboard, otel } = buildSREDashboard();
    for (let i = 0; i < 4; i++) otel.meter.createCounter('http.errors').add(1);

    const results = dashboard.refresh();
    expect(results).toHaveLength(3);
    expect(dashboard.getRefreshCount()).toBe(1);

    const errorPanel = dashboard.panel('panel-http-error-rate');
    expect(errorPanel?.value).toBe(4);
    expect(errorPanel?.matchedRecords).toBe(4);
  });

  it('threshold badges: 12 errors → critical', () => {
    const { dashboard, otel } = buildSREDashboard();
    for (let i = 0; i < 12; i++) otel.meter.createCounter('http.errors').add(1);
    dashboard.refresh();
    expect(dashboard.panel('panel-http-error-rate')?.badge).toBe('critical');
  });

  it('p99 latency panel uses max aggregation', () => {
    const { dashboard, otel } = buildSREDashboard();
    otel.meter.createHistogram('http.latency.ms').record(80);
    otel.meter.createHistogram('http.latency.ms').record(510);
    otel.meter.createHistogram('http.latency.ms').record(1_100);
    otel.meter.createHistogram('http.latency.ms').record(200);
    dashboard.refresh();
    const latency = dashboard.panel('panel-p99-latency');
    expect(latency?.value).toBe(1_100);
    expect(latency?.badge).toBe('critical');
  });

  it('queue depth panel filters by tag { queue: "jobs" } and uses last-sample aggregation', () => {
    const { dashboard, otel } = buildSREDashboard();
    otel.meter.createGauge('queue.depth').record(500, { queue: 'ingest' });
    otel.meter.createGauge('queue.depth').record(120, { queue: 'jobs' });
    otel.meter.createGauge('queue.depth').record(1_500, { queue: 'jobs' });
    dashboard.refresh();
    const queue = dashboard.panel('panel-queue-depth');
    expect(queue?.value).toBe(1_500);
    expect(queue?.matchedRecords).toBe(2);
    expect(queue?.badge).toBe('warn');
  });

  it('a second refresh with no new samples increments the refresh count', () => {
    const { dashboard, otel } = buildSREDashboard();
    otel.meter.createCounter('http.errors').add(3);
    dashboard.refresh();
    dashboard.refresh();
    expect(dashboard.getRefreshCount()).toBe(2);
    expect(dashboard.panel('panel-http-error-rate')?.value).toBe(3);
  });
});

/**
 * Tutorial 23 — Alert orchestrator の src/orchestrator.ts factory と
 * 同一 shape。 3 rule + route + escalation + silence の挙動を検証。
 */
function buildOrchestrator(now: () => number) {
  const otel = createOtelMock({ now });
  const collector = otel.collector;
  const router = new AlertRouter(collector, { now });

  router.registerRule(rule_errorRateCritical());
  router.registerRule(rule_latencyDegraded());
  router.registerRule(rule_queueBackpressure('rule-queue-backpressure', 'ingest'));
  router.setRoute(defaultRoute());
  router.setEscalation('rule-error-rate-critical', escalation_pagerDutyTwoStep());
  return { collector, router, otel };
}

describe('tutorial 23 — alert orchestrator snippets', () => {
  it('deepest matching route wins: critical + platform → pagerduty-platform', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);
    otel.meter.createCounter('http.errors').add(12);
    const events = router.evaluate();

    expect(events).toHaveLength(1);
    expect(events[0]?.receiver).toBe('pagerduty-platform');
    expect(events[0]?.fire.state).toBe('firing');
  });

  it('forSamples requires N consecutive holds before pending → firing', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);

    otel.meter.createHistogram('http.latency.ms').record(600);
    expect(router.evaluate()).toHaveLength(0);
    otel.meter.createHistogram('http.latency.ms').record(700);
    expect(router.evaluate()).toHaveLength(0);
    otel.meter.createHistogram('http.latency.ms').record(800);
    const events = router.evaluate();
    expect(events).toHaveLength(1);
    expect(events[0]?.fire.severity).toBe('warn');
  });

  it('an active silence with matching labels suppresses the fire', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);
    router.addSilence({
      id: 'maintenance-window',
      match: { team: 'platform' },
      expiresAt: 60_000,
    });

    otel.meter.createCounter('http.errors').add(12);
    const events = router.evaluate();
    expect(events).toHaveLength(0);
  });

  it('escalation walks the ladder as `now()` moves past afterMs boundaries', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);
    otel.meter.createCounter('http.errors').add(12);
    router.evaluate();

    clock = 1_000 + 5 * 60 * 1_000;
    let ladder = router.tickEscalation();
    expect(ladder).toHaveLength(1);
    expect(ladder[0]?.receiver).toBe('pagerduty-secondary');
    expect(ladder[0]?.fire.state).toBe('escalated');

    clock = 1_000 + 15 * 60 * 1_000;
    ladder = router.tickEscalation();
    expect(ladder).toHaveLength(1);
    expect(ladder[0]?.receiver).toBe('pagerduty-lead');
  });

  it('a resolved rule (predicate flips to false) transitions active fires to `resolved`', () => {
    let clock = 1_000;
    const { router, otel } = buildOrchestrator(() => clock);
    otel.meter.createCounter('http.errors').add(12);
    router.evaluate();
    expect(router.getActive()).toHaveLength(1);

    // Fresh sample with value below threshold flips predicate false.
    otel.meter.createCounter('http.errors').add(1);
    router.evaluate();
    expect(router.getActive()).toHaveLength(0);
  });
});

/**
 * Tutorial 24 — Trace flame graph の src/trace.ts factory と同一 shape。
 * span tree + flame + drill-down + log correlation の挙動を検証。
 */
function buildHttpHandlerScene() {
  const otel = createOtelMock();
  const collector = otel.collector;
  for (const s of trace_httpHandler()) collector.spans.push(s);
  for (const s of trace_fanoutParallel(2_000)) collector.spans.push(s);
  for (const l of logs_forHttpTrace()) collector.logs.push(l);

  const roots = buildSpanTree(collector.spans);
  const flame = renderFlameGraph(roots);
  const index = new LogCorrelationIndex({
    logs: collector.logs,
    spans: collector.spans,
  });
  return { collector, roots, flame, index };
}

describe('tutorial 24 — trace flame graph snippets', () => {
  it('buildSpanTree groups spans by parentSpanName and computes selfMs', () => {
    const { roots } = buildHttpHandlerScene();
    expect(roots).toHaveLength(2);

    const http = roots.find((n) => n.name === 'http.request');
    expect(http).toBeDefined();
    expect(http?.children.map((c) => c.name)).toEqual(['db.query', 'cache.get']);
    expect(http?.totalMs).toBe(100);
    expect(http?.selfMs).toBe(40);
  });

  it('renderFlameGraph collapses same-name siblings and sums their samples', () => {
    const { flame } = buildHttpHandlerScene();
    const handler = flame.find((n) => n.name === 'handler');
    expect(handler).toBeDefined();
    const worker = handler?.children.find((c) => c.name === 'worker');
    expect(worker?.samples).toBe(3);
    expect(worker?.totalMs).toBe(270);
  });

  it('drillDown extracts a subtree rooted at db.query and normalises depth to 0', () => {
    const { flame } = buildHttpHandlerScene();
    const sub = drillDown(flame, 'db.query');
    expect(sub).not.toBeNull();
    expect(sub?.name).toBe('db.query');
    expect(sub?.depth).toBe(0);
    expect(sub?.children).toEqual([]);
  });

  it('flattenFlame walks the tree depth-first for iteration', () => {
    const { flame } = buildHttpHandlerScene();
    const names = flattenFlame(flame).map((n) => n.name);
    expect(names).toEqual([
      'http.request',
      'db.query',
      'cache.get',
      'handler',
      'worker',
    ]);
  });

  it('LogCorrelationIndex.logsForSpan returns logs whose span_id matches', () => {
    const { index } = buildHttpHandlerScene();
    const dbLogs = index.logsForSpan('sp-2');
    expect(dbLogs.map((l) => l.message)).toEqual(['db query start']);
  });

  it('LogCorrelationIndex.logsForTrace returns every log for a given trace_id', () => {
    const { index } = buildHttpHandlerScene();
    const httpLogs = index.logsForTrace('trace-http-handler');
    expect(httpLogs).toHaveLength(4);
    expect(httpLogs.map((l) => l.level).sort()).toEqual(['debug', 'info', 'info', 'warn']);
  });

  it('correlatedCount reports every log that carries a span_id or trace_id', () => {
    const { index } = buildHttpHandlerScene();
    expect(index.correlatedCount()).toBe(4);
  });
});
