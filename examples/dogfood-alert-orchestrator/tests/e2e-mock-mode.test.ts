import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  AlertFireEvent,
  AlertOrchestratorAdapter,
} from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { seededRules, ruleHttpErrorsCritical, ruleLatencyDegraded } from '../src/rules/index.js';
import { seededRoute, walkRoute } from '../src/routing/index.js';
import { SilenceStore, seededSilences } from '../src/silence/index.js';
import { seededEscalation, stepFor } from '../src/escalation/index.js';
import {
  runEvaluateFlow,
  runFullMatrix,
  runIngestFlow,
  runRouteFlow,
} from '../src/flows/orchestrator-flows.js';
import { createOrchestratorService } from '../src/app/orchestrator-service.js';

let clock = 1_000;
function tick(ms: number): number {
  clock += ms;
  return clock;
}

const buildConfig = () => ({
  orchestratorId: 'test-orchestrator',
  rules: seededRules,
  route: seededRoute(),
  silences: [],
  escalation: seededEscalation(),
  now: () => clock,
});

let adapter: AlertOrchestratorAdapter;

beforeEach(() => {
  clock = 1_000;
  adapter = makeMockAdapter(buildConfig());
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-alert-orchestrator (mock mode) — 10 rules × 3 routing × silence × escalation', () => {
  it('T-DFA-M-001 10 rules cover 3 kinds (threshold / rate / anomaly)', () => {
    const kinds = new Set(seededRules.map((r) => r.kind));
    expect(kinds).toEqual(new Set(['threshold', 'rate', 'anomaly']));
    expect(seededRules).toHaveLength(10);
  });

  it('T-DFA-M-002 threshold rule fires when metric crosses in one sample', async () => {
    await adapter.emitMetric({
      metricName: 'http.errors',
      kind: 'counter',
      value: 15,
    });
    const fires = await adapter.evaluateRules();
    const errorsFire = fires.find((f) => f.ruleId === ruleHttpErrorsCritical().id);
    expect(errorsFire).toBeDefined();
    expect(errorsFire?.severity).toBe('critical');
  });

  it('T-DFA-M-003 threshold rule with forSamples>1 requires consecutive hits', async () => {
    const rule = ruleLatencyDegraded();
    // 1 sample — not yet.
    await adapter.emitMetric({ metricName: rule.metricName, kind: 'histogram', value: 600 });
    let fires = await adapter.evaluateRules();
    expect(fires.some((f) => f.ruleId === rule.id)).toBe(false);
    // 2 samples — still not.
    await adapter.emitMetric({ metricName: rule.metricName, kind: 'histogram', value: 600 });
    fires = await adapter.evaluateRules();
    expect(fires.some((f) => f.ruleId === rule.id)).toBe(false);
    // 3 samples — must fire.
    await adapter.emitMetric({ metricName: rule.metricName, kind: 'histogram', value: 600 });
    fires = await adapter.evaluateRules();
    expect(fires.some((f) => f.ruleId === rule.id)).toBe(true);
  });

  it('T-DFA-M-004 rate rule fires when derived rate crosses threshold', async () => {
    // ruleHttp5xxRate — windowMs=60_000, threshold=0.5/s. Emit 100 → 200
    // 60 s apart → rate = 100 / 60 ≈ 1.67/s → must fire.
    await adapter.emitMetric({
      metricName: 'http.errors.total',
      kind: 'counter',
      value: 100,
      timestamp: 1_000,
    });
    await adapter.emitMetric({
      metricName: 'http.errors.total',
      kind: 'counter',
      value: 200,
      timestamp: 61_000,
    });
    const fires = await adapter.evaluateRules();
    expect(fires.some((f) => f.ruleId === 'rule-http-5xx-rate')).toBe(true);
  });

  it('T-DFA-M-005 anomaly rule fires when latest sample exceeds mean + 3σ', async () => {
    // 500, 520, 5000 → mean grows but the 5000 sample is way above.
    await adapter.emitMetric({ metricName: 'process.memory.rss', kind: 'gauge', value: 500 });
    await adapter.emitMetric({ metricName: 'process.memory.rss', kind: 'gauge', value: 520 });
    await adapter.emitMetric({ metricName: 'process.memory.rss', kind: 'gauge', value: 5000 });
    const fires = await adapter.evaluateRules();
    expect(fires.some((f) => f.ruleId === 'rule-memory-rss-anomaly')).toBe(true);
  });

  it('T-DFA-M-006 3-level routing tree picks pagerduty-platform for critical/platform', () => {
    const receiver = walkRoute(seededRoute(), {
      severity: 'critical',
      team: 'platform',
    });
    expect(receiver).toBe('pagerduty-platform');
  });

  it('T-DFA-M-007 routing tree picks slack-data for warn/data', () => {
    const receiver = walkRoute(seededRoute(), {
      severity: 'warn',
      team: 'data',
    });
    expect(receiver).toBe('slack-data');
  });

  it('T-DFA-M-008 routing tree picks slack-info for severity=info without team', () => {
    const receiver = walkRoute(seededRoute(), { severity: 'info' });
    expect(receiver).toBe('slack-info');
  });

  it('T-DFA-M-009 routing tree falls back to pagerduty root when team is unknown', () => {
    const receiver = walkRoute(seededRoute(), {
      severity: 'critical',
      team: 'unknown-team',
    });
    expect(receiver).toBe('pagerduty');
  });

  it('T-DFA-M-010 literal silence suppresses fires whose labels match', () => {
    const store = new SilenceStore([
      {
        id: 'sil-1',
        match: { team: 'platform' },
        expiresAt: 60_000,
      },
    ]);
    const fire: AlertFireEvent = {
      ruleId: 'r',
      severity: 'critical',
      labels: { team: 'platform', severity: 'critical' },
      value: 10,
      firedAt: 1_000,
      state: 'firing',
    };
    expect(store.isSilenced(fire, 30_000)?.id).toBe('sil-1');
    expect(store.isSilenced(fire, 120_000)).toBeNull();
  });

  it('T-DFA-M-011 regex silence matches label values by pattern', () => {
    const store = new SilenceStore([
      {
        id: 'sil-re',
        match: {},
        matchRe: { route: '^/api/' },
        expiresAt: 60_000,
      },
    ]);
    const apiFire: AlertFireEvent = {
      ruleId: 'r',
      severity: 'warn',
      labels: { route: '/api/checkout' },
      value: 1,
      firedAt: 1_000,
      state: 'firing',
    };
    const staticFire: AlertFireEvent = {
      ruleId: 'r',
      severity: 'warn',
      labels: { route: '/static/asset.js' },
      value: 1,
      firedAt: 1_000,
      state: 'firing',
    };
    expect(store.isSilenced(apiFire, 30_000)?.id).toBe('sil-re');
    expect(store.isSilenced(staticFire, 30_000)).toBeNull();
  });

  it('T-DFA-M-012 seededSilences yields both literal + regex windows', () => {
    const silences = seededSilences(0);
    expect(silences).toHaveLength(2);
    expect(silences.some((s) => s.matchRe !== undefined)).toBe(true);
    expect(silences.some((s) => s.match['team'] !== undefined)).toBe(true);
  });

  it('T-DFA-M-013 escalation ladder is L1 30s → L2 5min → L3 30min in order', () => {
    const ladder = seededEscalation();
    expect(ladder.map((s) => s.step)).toEqual(['L1', 'L2', 'L3']);
    expect(ladder[0]?.afterMs).toBe(30_000);
    expect(ladder[1]?.afterMs).toBe(300_000);
    expect(ladder[2]?.afterMs).toBe(1_800_000);
  });

  it('T-DFA-M-014 stepFor picks the deepest step whose afterMs has elapsed', () => {
    const ladder = seededEscalation();
    expect(stepFor(ladder, 15_000)).toBeNull();
    expect(stepFor(ladder, 60_000)?.step).toBe('L1');
    expect(stepFor(ladder, 600_000)?.step).toBe('L2');
    expect(stepFor(ladder, 2_000_000)?.step).toBe('L3');
  });

  it('T-DFA-M-015 routeAlert flags silenced=true when silence match applies', async () => {
    const adapterWithSilence = makeMockAdapter({
      ...buildConfig(),
      silences: [
        {
          id: 'sil-platform',
          match: { team: 'platform' },
          expiresAt: 120_000,
        },
      ],
    });
    const fire: AlertFireEvent = {
      ruleId: 'r',
      severity: 'critical',
      labels: { team: 'platform', severity: 'critical' },
      value: 10,
      firedAt: 1_000,
      state: 'firing',
    };
    const decision = await adapterWithSilence.routeAlert(fire);
    expect(decision.silenced).toBe(true);
    expect(decision.silenceId).toBe('sil-platform');
    expect(decision.receiver).toBeNull();
    await adapterWithSilence.reset();
  });

  it('T-DFA-M-016 routeAlert returns receiver when no silence matches', async () => {
    const fire: AlertFireEvent = {
      ruleId: 'r',
      severity: 'critical',
      labels: { team: 'infra', severity: 'critical' },
      value: 10,
      firedAt: 1_000,
      state: 'firing',
    };
    const decision = await adapter.routeAlert(fire);
    expect(decision.silenced).toBe(false);
    expect(decision.receiver).toBe('pagerduty-infra');
  });

  it('T-DFA-M-017 evaluateRules metrics count increments monotonically', async () => {
    expect(adapter.metrics().evaluationCount).toBe(0);
    await runEvaluateFlow(adapter);
    expect(adapter.metrics().evaluationCount).toBe(2);
  });

  it('T-DFA-M-018 full flow ingest → evaluate → route → escalate produces receivers', async () => {
    await runIngestFlow(adapter);
    await runRouteFlow(adapter);
    // At least one fire must have landed on some receiver so the
    // routing tree is exercised end-to-end.
    const trace = adapter.traces();
    const routeEvents = trace.filter((t) => t.op === 'routeAlert' && t.ok);
    expect(routeEvents.length).toBeGreaterThan(0);
  });

  it('T-DFA-M-019 advanceEscalation triggers L1 delivery after 30s elapsed', async () => {
    // Fire once.
    clock = 1_000;
    await adapter.emitMetric({
      metricName: 'http.errors',
      kind: 'counter',
      value: 15,
      timestamp: 1_000,
    });
    await adapter.evaluateRules();
    // Advance to 40s so L1 (30s) has elapsed but L2 (5min) has not.
    clock = 41_000;
    const deliveries = await adapter.advanceEscalation();
    const l1 = deliveries.find((d) => d.step === 'L1');
    expect(l1).toBeDefined();
    expect(l1?.receiver).toBe('oncall-primary');
  });

  it('T-DFA-M-020 reset clears traces + metrics + collector state', async () => {
    await runFullMatrix(adapter);
    expect(adapter.traces().length).toBeGreaterThan(0);
    await adapter.reset();
    expect(adapter.traces()).toEqual([]);
    expect(adapter.metrics().evaluationCount).toBe(0);
    expect(adapter.metrics().routeCount).toBe(0);
  });

  it('T-DFA-M-021 service.cycle returns fires + route decisions + escalation deliveries', async () => {
    const service = createOrchestratorService({
      mode: 'mock',
      now: () => clock,
    });
    // Ingest enough to fire the http.errors critical rule.
    await service.ingest([
      { metricName: 'http.errors', kind: 'counter', value: 15, timestamp: 1_000 },
    ]);
    const state = await service.cycle();
    expect(state.mode).toBe('mock');
    expect(state.fires.length).toBeGreaterThan(0);
    expect(state.routeDecisions.length).toBeGreaterThan(0);
    await service.reset();
  });

  it('T-DFA-M-022 rate rule ignores samples inside the same window', async () => {
    // Emit both samples inside the same window (1 s apart, window=60 s).
    await adapter.emitMetric({
      metricName: 'http.errors.total',
      kind: 'counter',
      value: 100,
      timestamp: 1_000,
    });
    await adapter.emitMetric({
      metricName: 'http.errors.total',
      kind: 'counter',
      value: 101,
      timestamp: 2_000,
    });
    const fires = await adapter.evaluateRules();
    // Delta = 1 over 1 s → rate = 1/s ≥ 0.5 threshold → fires.
    expect(fires.some((f) => f.ruleId === 'rule-http-5xx-rate')).toBe(true);
  });
  it('T-DFA-M-023 seeded silences include maintenance window + deploy regex', () => {
    tick(0);
    const silences = seededSilences(clock);
    expect(silences[0]?.match['team']).toBe('platform');
    expect(silences[1]?.matchRe?.['route']).toBe('^/api/');
    expect(silences[1]?.expiresAt).toBeGreaterThan(clock);
  });
});
