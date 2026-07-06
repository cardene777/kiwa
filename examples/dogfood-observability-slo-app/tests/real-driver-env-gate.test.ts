/**
 * Real-driver env-gate tests — assert the real adapter reports
 * KIWA_SLO_ENV_MISSING when KIWA_MODE!=real or the endpoint env is
 * absent, and drives the full 14-op contract when the env is
 * force-marked ready. These tests keep the CI path deterministic
 * without a live Grafana / Prometheus stack while still exercising
 * the entire real adapter surface.
 */

import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  KIWA_SLO_ENV_MISSING,
  SLO_HARNESS_OPS,
} from '../src/adapters/interface.js';
import { runFullSloLifecycle } from '../src/flows/slo-flows.js';
import { SLO_TARGET_99_9 } from '../src/policies/objectives.js';
import { POLICY_99_9 } from '../src/policies/error-budget.js';
import { MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN } from '../src/policies/thresholds.js';

describe('dogfood-observability-slo-app — real-driver env-gate', () => {
  it('T-DFS-RD-001 default env (no KIWA_MODE=real) sets envReady=false', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSlo(SLO_TARGET_99_9);
    const trace = real.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.errorKind).toBe(KIWA_SLO_ENV_MISSING);
    expect(trace[0]?.ok).toBe(false);
  });

  it('T-DFS-RD-002 KIWA_MODE=real without endpoint vars still reports env missing', async () => {
    const real = makeRealAdapter({ env: { KIWA_MODE: 'real' } });
    await real.startSlo(SLO_TARGET_99_9);
    const trace = real.trace();
    expect(trace[0]?.errorKind).toBe(KIWA_SLO_ENV_MISSING);
  });

  it('T-DFS-RD-003 KIWA_MODE=real + only KIWA_PROMETHEUS_URL still reports missing (needs both)', async () => {
    const real = makeRealAdapter({
      env: {
        KIWA_MODE: 'real',
        KIWA_PROMETHEUS_URL: 'http://prom:9090',
      },
    });
    await real.startSlo(SLO_TARGET_99_9);
    const trace = real.trace();
    expect(trace[0]?.errorKind).toBe(KIWA_SLO_ENV_MISSING);
  });

  it('T-DFS-RD-004 KIWA_MODE=real + both Prometheus + Grafana URLs marks env ready', async () => {
    const real = makeRealAdapter({
      env: {
        KIWA_MODE: 'real',
        KIWA_PROMETHEUS_URL: 'http://prom:9090',
        KIWA_GRAFANA_URL: 'http://grafana:3000',
      },
    });
    await real.startSlo(SLO_TARGET_99_9);
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(true);
    expect(trace[0]?.errorKind).toBeUndefined();
    expect(trace[0]?.neutralEvent).toBe('slo.session_started');
  });

  it('T-DFS-RD-005 forceEnvPresent=true walks the full 14-op contract without ever reporting env missing', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await runFullSloLifecycle(real, {
      target: SLO_TARGET_99_9,
      policy: POLICY_99_9,
      consumedFraction: 0.8,
      workload: { requests: 10_000, errors: 100 },
      page: true,
      silenceRoute: true,
    });
    const trace = real.trace();
    const envMissing = trace.filter((e) => e.errorKind === KIWA_SLO_ENV_MISSING);
    expect(envMissing).toHaveLength(0);
    const ops = new Set(trace.map((t) => t.op));
    expect(ops.has('startSlo')).toBe(true);
    expect(ops.has('openWindow')).toBe(true);
    expect(ops.has('computeErrorBudget')).toBe(true);
    expect(ops.has('evaluateBurnRate')).toBe(true);
    expect(ops.has('fireMwmbrAlert')).toBe(true);
    expect(ops.has('evaluatePolicy')).toBe(true);
    expect(ops.has('routeAlert')).toBe(true);
    expect(ops.has('silenceAlert')).toBe(true);
  });

  it('T-DFS-RD-006 env-missing openWindow returns silently (no throw)', async () => {
    const real = makeRealAdapter({ env: {} });
    await expect(real.openWindow('any-slo')).resolves.toBeUndefined();
  });

  it('T-DFS-RD-007 env-missing queryRequestCounts returns zero totals fallback', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.queryRequestCounts({
      sloId: 'any',
      metricName: 'http_requests_total',
    });
    expect(result.totalRequests).toBe(0);
    expect(result.totalErrors).toBe(0);
    expect(result.errorRate).toBe(0);
  });

  it('T-DFS-RD-008 env-missing computeErrorBudget returns zero budget fallback', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.computeErrorBudget('any');
    expect(result.errorBudgetSeconds).toBe(0);
    expect(result.allowedErrorRate).toBe(0);
    expect(result.windowSeconds).toBe(0);
  });

  it('T-DFS-RD-009 env-missing evaluateBurnRate returns burn rate 0 fallback', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.evaluateBurnRate({
      sloId: 'any',
      threshold: MWMBR_FAST_BURN,
    });
    expect(result.burnRate).toBe(0);
    expect(result.totalRequests).toBe(0);
  });

  it('T-DFS-RD-010 env-missing fireMwmbrAlert returns fired=false with zero severity match', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.fireMwmbrAlert({
      sloId: 'any',
      thresholds: [MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN],
      page: true,
    });
    expect(result.fired).toBe(false);
    expect(result.matchedSeverities).toHaveLength(0);
  });

  it('T-DFS-RD-011 env-missing evaluatePolicy returns ship fallback with env-missing reason', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.9,
    });
    expect(result.action).toBe('ship');
    expect(result.reason).toContain('env missing');
  });

  it('T-DFS-RD-012 env-missing routeAlert reports silenced=false + emits env-missing trace', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.routeAlert({
      sloId: 'any',
      severity: 'fast',
      channel: 'pager',
    });
    expect(result.silenced).toBe(false);
    const trace = real.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.errorKind).toBe(KIWA_SLO_ENV_MISSING);
  });

  it('T-DFS-RD-013 env-missing silenceAlert returns silently + emits env-missing trace', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.silenceAlert({ routeId: 'x:fast:pager', silenceMinutes: 60 });
    const trace = real.trace();
    expect(trace[0]?.errorKind).toBe(KIWA_SLO_ENV_MISSING);
  });

  it('T-DFS-RD-014 reset clears trace + sessions even when env missing', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSlo(SLO_TARGET_99_9);
    await real.reset();
    expect(real.trace()).toHaveLength(0);
  });

  it('T-DFS-RD-015 SLO_HARNESS_OPS enumerates 14 op names', () => {
    expect(SLO_HARNESS_OPS.length).toBe(14);
    expect(SLO_HARNESS_OPS).toContain('startSlo');
    expect(SLO_HARNESS_OPS).toContain('reset');
  });

  it('T-DFS-RD-016 env-missing trace metadata includes envReady=false + sentinel string', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSlo(SLO_TARGET_99_9);
    const trace = real.trace();
    expect(trace[0]?.metadata['envReady']).toBe(false);
    expect(trace[0]?.metadata['sentinel']).toBe(KIWA_SLO_ENV_MISSING);
  });
});
