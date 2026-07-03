import { describe, expect, it } from 'vitest';
import {
  AlertRouter,
  createOtelMock,
  defaultRoute,
  escalation_pagerDutyTwoStep,
  metricsForRule,
  rule_errorRateCritical,
  rule_latencyDegraded,
  rule_queueBackpressure,
  silence_maintenanceWindow,
  type AlertRule,
} from '../src/index.js';

function newRouter(now = 1_000) {
  let clock = now;
  const otel = createOtelMock({ now: () => clock });
  const router = new AlertRouter(otel.collector, { now: () => clock });
  return {
    router,
    otel,
    tick(ms: number): void {
      clock += ms;
    },
    setClock(v: number): void {
      clock = v;
    },
    now(): number {
      return clock;
    },
  };
}

describe('AlertRouter — rule evaluate + fire', () => {
  it('fires when latest metric crosses threshold', () => {
    const h = newRouter();
    const rule = rule_errorRateCritical();
    h.router.registerRule(rule);
    h.router.setRoute(defaultRoute());
    h.otel.meter.createCounter('http.errors').add(15);
    const events = h.router.evaluate();
    expect(events).toHaveLength(1);
    expect(events[0]!.fire.state).toBe('firing');
    expect(events[0]!.fire.severity).toBe('critical');
    expect(events[0]!.fire.value).toBe(15);
  });

  it('does not fire when latest metric stays below threshold', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.otel.meter.createCounter('http.errors').add(3);
    const events = h.router.evaluate();
    expect(events).toHaveLength(0);
  });

  it('forSamples > 1 requires consecutive threshold hits before firing', () => {
    const h = newRouter();
    h.router.registerRule(rule_latencyDegraded()); // forSamples: 3
    h.router.setRoute(defaultRoute());
    h.otel.meter.createHistogram('http.latency.ms').record(600);
    let events = h.router.evaluate();
    expect(events).toHaveLength(0);
    h.otel.meter.createHistogram('http.latency.ms').record(600);
    events = h.router.evaluate();
    expect(events).toHaveLength(0);
    h.otel.meter.createHistogram('http.latency.ms').record(600);
    events = h.router.evaluate();
    expect(events).toHaveLength(1);
  });

  it('resets pending count when metric drops back below threshold', () => {
    const h = newRouter();
    h.router.registerRule(rule_latencyDegraded());
    h.router.setRoute(defaultRoute());
    h.otel.meter.createHistogram('http.latency.ms').record(600);
    h.router.evaluate();
    h.otel.meter.createHistogram('http.latency.ms').record(100); // reset
    h.router.evaluate();
    h.otel.meter.createHistogram('http.latency.ms').record(600); // needs 3 again
    expect(h.router.evaluate()).toHaveLength(0);
  });

  it('transitions active fire back to resolved when metric drops', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.otel.meter.createCounter('http.errors').add(20);
    h.router.evaluate();
    expect(h.router.getActive()).toHaveLength(1);
    h.otel.meter.createCounter('http.errors').add(-100); // net becomes -80
    h.router.evaluate();
    expect(h.router.getActive()).toHaveLength(0);
  });
});

describe('AlertRouter — routing tree', () => {
  it('critical + team=platform routes to pagerduty-platform', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.otel.meter.createCounter('http.errors').add(20);
    const events = h.router.evaluate();
    expect(events[0]!.receiver).toBe('pagerduty-platform');
  });

  it('warn + team=data routes to slack-data', () => {
    const h = newRouter();
    h.router.registerRule(rule_queueBackpressure());
    h.router.setRoute(defaultRoute());
    h.otel.meter.createGauge('queue.depth').record(2000, { queue: 'default' });
    const events = h.router.evaluate();
    expect(events[0]!.receiver).toBe('slack-data');
  });

  it('unknown label combination falls to top-level route receiver', () => {
    const h = newRouter();
    const rule: AlertRule = {
      id: 'x',
      metricName: 'x.hits',
      operator: 'gte',
      threshold: 1,
      forSamples: 1,
      labels: { team: 'unknown' },
      severity: 'info',
    };
    h.router.registerRule(rule);
    h.router.setRoute(defaultRoute());
    h.otel.meter.createCounter('x.hits').add(1);
    const events = h.router.evaluate();
    expect(events[0]!.receiver).toBe('default');
  });

  it('no route set produces no delivery', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.otel.meter.createCounter('http.errors').add(20);
    const events = h.router.evaluate();
    expect(events).toHaveLength(0);
  });
});

describe('AlertRouter — silence suppression', () => {
  it('active silence with matching labels suppresses the fire', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.router.addSilence(silence_maintenanceWindow('s1', 60, h.now()));
    h.otel.meter.createCounter('http.errors').add(20);
    expect(h.router.evaluate()).toHaveLength(0);
    // Fire is still tracked as active for internal state.
    expect(h.router.getActive()).toHaveLength(1);
  });

  it('expired silence no longer suppresses', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.router.addSilence({ id: 's1', match: { team: 'platform' }, expiresAt: h.now() + 10 });
    h.tick(20);
    h.otel.meter.createCounter('http.errors').add(20);
    expect(h.router.evaluate()).toHaveLength(1);
  });

  it('silence with non-matching label does not suppress', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.router.addSilence({ id: 's1', match: { team: 'data' }, expiresAt: h.now() + 3600000 });
    h.otel.meter.createCounter('http.errors').add(20);
    expect(h.router.evaluate()).toHaveLength(1);
  });
});

describe('AlertRouter — escalation state machine', () => {
  it('does not escalate before the first step threshold', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.router.setEscalation('rule-error-rate-critical', escalation_pagerDutyTwoStep());
    h.otel.meter.createCounter('http.errors').add(20);
    h.router.evaluate();
    h.tick(60 * 1000);
    const events = h.router.tickEscalation();
    expect(events).toHaveLength(0);
  });

  it('routes to pagerduty-secondary after 5 min', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.router.setEscalation('rule-error-rate-critical', escalation_pagerDutyTwoStep());
    h.otel.meter.createCounter('http.errors').add(20);
    h.router.evaluate();
    h.tick(5 * 60 * 1000);
    const events = h.router.tickEscalation();
    expect(events).toHaveLength(1);
    expect(events[0]!.receiver).toBe('pagerduty-secondary');
    expect(events[0]!.reason).toBe('escalation');
    expect(events[0]!.fire.state).toBe('escalated');
  });

  it('routes to pagerduty-lead after 15 min, plus previous step', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.router.setEscalation('rule-error-rate-critical', escalation_pagerDutyTwoStep());
    h.otel.meter.createCounter('http.errors').add(20);
    h.router.evaluate();
    h.tick(15 * 60 * 1000);
    const events = h.router.tickEscalation();
    const receivers = events.map((e) => e.receiver).sort();
    expect(receivers).toEqual(['pagerduty-lead', 'pagerduty-secondary']);
  });

  it('does not double-deliver the same escalation step', () => {
    const h = newRouter();
    h.router.registerRule(rule_errorRateCritical());
    h.router.setRoute(defaultRoute());
    h.router.setEscalation('rule-error-rate-critical', escalation_pagerDutyTwoStep());
    h.otel.meter.createCounter('http.errors').add(20);
    h.router.evaluate();
    h.tick(5 * 60 * 1000);
    h.router.tickEscalation();
    h.tick(1 * 60 * 1000);
    const events = h.router.tickEscalation();
    expect(events).toHaveLength(0);
  });
});

describe('metricsForRule — collector filter helper', () => {
  it('returns only records matching the rule metric name', () => {
    const h = newRouter();
    h.otel.meter.createCounter('a').add(1);
    h.otel.meter.createCounter('b').add(1);
    h.otel.meter.createCounter('a').add(2);
    const rule = {
      id: 'r',
      metricName: 'a',
      operator: 'gte' as const,
      threshold: 1,
      labels: {},
      severity: 'info' as const,
    };
    expect(metricsForRule(h.otel.collector, rule)).toHaveLength(2);
  });
});
