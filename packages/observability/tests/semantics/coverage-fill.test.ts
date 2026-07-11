import { describe, expect, it } from 'vitest';
import {
  analyzeRootCause,
  applyTrafficSplit,
  attributeTeam,
  captureNetworkFlow,
  checkBudget,
  computeBlastRadius,
  computeErrorBudget,
  computeFourGoldenSignals,
  correlateAlerts,
  countTokens,
  detectAnomaly,
  dispatchIncidentEvent,
  evaluateBurnRate,
  executeRemediation,
  fireMultiWindowMultiBurnRateAlert,
  flagHallucination,
  handshakeMtls,
  injectFault,
  injectSidecar,
  openSLOWindow,
  optimizeSpot,
  probeUserspace,
  providerEventName,
  recommendRightsizing,
  recordCostPerRequest,
  recordDuration,
  recordErrors,
  recordGameDay,
  recordRequestRate,
  recordSyscall,
  startAiopsSession,
  startChaosSession,
  startEbpfIiiSession,
  startFinopsSession,
  startIncident,
  startLlmObsSession,
  startMeshSession,
  startRedUse,
  startSLO,
  summarizeIncident,
  traceKernel,
  tripCircuitBreaker,
  triggerRollback,
} from '../../src/semantics/index.js';

/**
 * Coverage-fill sweep — closes reachable branches in semantics guards.
 *
 * Covers wrong-state throws / empty-input guards / argument guards /
 * providerEventName neutral fallback / state-machine invalid transitions
 * that the existing per-file tests skip.
 */

describe('coverage-fill — types.providerEventName neutral fallback', () => {
  it('falls back to neutral name when dialect lookup misses', () => {
    // Force an unmapped neutral key through the `as any` escape hatch to hit
    // the `?? neutral` branch in providerEventName.
    const result = providerEventName('prometheus', 'unknown.neutral.event' as any);
    expect(result).toBe('unknown.neutral.event');
  });
});

describe('coverage-fill — aiops root=null fallback', () => {
  it('falls back to failedServices[0] when no service is a root by graph', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4 }],
      zScoreThreshold: 3,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    // Every failed service has an edge to a non-failed downstream → root stays null,
    // then falls back to failedServices[0].
    const step = analyzeRootCause(s, {
      edges: [
        { from: 'A', to: 'C' },
        { from: 'B', to: 'D' },
      ],
      failedServices: ['A', 'B'],
    });
    expect(step.metadata.rootCause).toBe('A');
    expect(s.rootCauseService).toBe('A');
  });

  it('correlateAlerts wrong state throws before root-cause-analyzed', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    expect(() =>
      correlateAlerts(s, { alerts: [{ alertId: 'a', service: 'x', firedAtMs: 1 }], windowMs: 10 }),
    ).toThrow(/not root-cause-analyzed/);
  });

  it('correlateAlerts rejects empty alerts', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    detectAnomaly(s, { points: [{ metric: 'x', value: 1, zScore: 4 }], zScoreThreshold: 3 });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    analyzeRootCause(s, { edges: [], failedServices: ['db'] });
    expect(() => correlateAlerts(s, { alerts: [], windowMs: 10 })).toThrow(/must not be empty/);
  });

  it('correlateAlerts rejects non-positive windowMs', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    detectAnomaly(s, { points: [{ metric: 'x', value: 1, zScore: 4 }], zScoreThreshold: 3 });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    analyzeRootCause(s, { edges: [], failedServices: ['db'] });
    expect(() =>
      correlateAlerts(s, { alerts: [{ alertId: 'a', service: 'x', firedAtMs: 1 }], windowMs: 0 }),
    ).toThrow(/windowMs/);
  });

  it('executeRemediation rejects wrong state and empty actions', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    expect(() => executeRemediation(s, { actions: [] })).toThrow(/not anomaly-detected/);
    detectAnomaly(s, { points: [{ metric: 'x', value: 1, zScore: 4 }], zScoreThreshold: 3 });
    expect(() => executeRemediation(s, { actions: [] })).toThrow(/must not be empty/);
  });

  it('detectAnomaly rejects empty points and non-positive threshold', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    expect(() => detectAnomaly(s, { points: [], zScoreThreshold: 3 })).toThrow(/must not be empty/);
    expect(() =>
      detectAnomaly(s, { points: [{ metric: 'x', value: 1, zScore: 4 }], zScoreThreshold: 0 }),
    ).toThrow(/positive/);
  });

  it('analyzeRootCause rejects wrong state and empty failedServices', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    expect(() => analyzeRootCause(s, { edges: [], failedServices: ['a'] })).toThrow(
      /not remediation-executed/,
    );
    detectAnomaly(s, { points: [{ metric: 'x', value: 1, zScore: 4 }], zScoreThreshold: 3 });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    expect(() => analyzeRootCause(s, { edges: [], failedServices: [] })).toThrow(
      /must not be empty/,
    );
  });

  it('startAiopsSession rejects empty clusterId', () => {
    expect(() => startAiopsSession({ target: 'loki', clusterId: '' })).toThrow(/clusterId/);
  });
});

describe('coverage-fill — chaos remaining guards', () => {
  it('triggerRollback rejects threshold out of [0, 1]', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 });
    expect(() => triggerRollback(s, { errorRate: 0.1, threshold: 1.5 })).toThrow(/threshold/);
    expect(() => triggerRollback(s, { errorRate: 0.1, threshold: -0.1 })).toThrow(/threshold/);
  });

  it('recordGameDay rejects non-positive durationMinutes', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 });
    triggerRollback(s, { errorRate: 0.1, threshold: 0.05 });
    expect(() =>
      recordGameDay(s, { participants: 1, issuesFound: 0, durationMinutes: 0 }),
    ).toThrow(/durationMinutes/);
  });
});

describe('coverage-fill — ebpf-iii missing state/empty guards', () => {
  it('probeUserspace wrong state throws when session already probed', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    expect(() =>
      probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'y' }] }),
    ).toThrow(/not idle/);
  });

  it('traceKernel rejects empty probes', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    expect(() => traceKernel(s, { probes: [] })).toThrow(/must not be empty/);
  });

  it('recordSyscall wrong state throws before kernel-traced', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    expect(() => recordSyscall(s, { counts: { read: 1 } })).toThrow(/not kernel-traced/);
  });

  it('captureNetworkFlow rejects empty flows', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    recordSyscall(s, { counts: { read: 1 } });
    expect(() => captureNetworkFlow(s, { flows: [] })).toThrow(/must not be empty/);
  });

  it('captureNetworkFlow rejects negative packets', () => {
    const s = startEbpfIiiSession({ target: 'prometheus', hostId: 'h' });
    probeUserspace(s, { probes: [{ kind: 'uprobe', symbol: 'x' }] });
    traceKernel(s, { probes: [{ kind: 'kprobe', symbol: 'y' }] });
    recordSyscall(s, { counts: { read: 1 } });
    expect(() =>
      captureNetworkFlow(s, { flows: [{ srcIp: 'a', dstIp: 'b', bytes: 0, packets: -1 }] }),
    ).toThrow(/non-negative/);
  });
});

describe('coverage-fill — finops missing state/empty guards', () => {
  it('recordCostPerRequest wrong state throws when session already recorded', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'a' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 10 });
    expect(() => recordCostPerRequest(s, { requests: 100, totalCostUsd: 10 })).toThrow(
      /not idle/,
    );
  });

  it('recommendRightsizing wrong state throws before team-attributed', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'a' });
    expect(() =>
      recommendRightsizing(s, {
        recommendations: [{ resource: 'r', currentSizeUsd: 10, recommendedSizeUsd: 5 }],
      }),
    ).toThrow(/not team-attributed/);
  });

  it('recommendRightsizing rejects empty recommendations', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'a' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 't', costUsd: 100 }] });
    expect(() => recommendRightsizing(s, { recommendations: [] })).toThrow(/must not be empty/);
  });

  it('optimizeSpot wrong state throws before rightsizing-recommended', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'a' });
    expect(() => optimizeSpot(s, { onDemandUsd: 100, spotUsd: 30 })).toThrow(
      /not rightsizing-recommended/,
    );
  });

  it('optimizeSpot rejects negative spotUsd', () => {
    const s = startFinopsSession({ target: 'prometheus', accountId: 'a' });
    recordCostPerRequest(s, { requests: 100, totalCostUsd: 100 });
    attributeTeam(s, { teamCosts: [{ team: 't', costUsd: 100 }] });
    recommendRightsizing(s, {
      recommendations: [{ resource: 'r', currentSizeUsd: 100, recommendedSizeUsd: 50 }],
    });
    expect(() => optimizeSpot(s, { onDemandUsd: 100, spotUsd: -1 })).toThrow(/non-negative/);
  });
});

describe('coverage-fill — llm-observability wrong-state guards', () => {
  it('countTokens wrong state throws when session already counted', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 });
    expect(() => countTokens(s, { model: 'm', promptTokens: 0, completionTokens: 0 })).toThrow(
      /not idle/,
    );
  });

  it('flagHallucination wrong state throws before prompt-logged', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    expect(() =>
      flagHallucination(s, {
        signals: [{ metric: 'faithfulness', score: 0.5, threshold: 0.7 }],
      }),
    ).toThrow(/not prompt-logged/);
  });

  it('checkBudget wrong state throws before hallucination-flagged', () => {
    const s = startLlmObsSession({ target: 'prometheus', serviceName: 'x' });
    expect(() => checkBudget(s, { spentUsd: 0, limitUsd: 100 })).toThrow(
      /not hallucination-flagged/,
    );
  });
});

describe('coverage-fill — red-use zero-request branches', () => {
  it('recordErrors metadata errorRate is 0 when requestCount is 0', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    recordRequestRate(s, { requests: 0, windowSeconds: 10 });
    const step = recordErrors(s, { errors: 0 });
    expect(step.metadata.errorRate).toBe(0);
  });

  it('computeFourGoldenSignals errorRate is 0 when requestCount is 0 and samples exist', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    recordRequestRate(s, { requests: 0, windowSeconds: 10 });
    recordDuration(s, { durationMs: 5 });
    const golden = computeFourGoldenSignals(s);
    expect(golden.errorRate).toBe(0);
    expect(golden.trafficRps).toBe(0);
    expect(golden.latencyP99Ms).toBe(5);
    expect(golden.saturation).toBe(0);
  });
});

describe('coverage-fill — service-mesh missing state/empty guards', () => {
  it('handshakeMtls wrong state throws when session already handshaked', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, {
      clientSpiffe: 'spiffe://x/a',
      serverSpiffe: 'spiffe://x/b',
      cipherSuite: 'c',
    });
    expect(() =>
      handshakeMtls(s, {
        clientSpiffe: 'spiffe://x/a',
        serverSpiffe: 'spiffe://x/b',
        cipherSuite: 'c',
      }),
    ).toThrow(/not idle/);
  });

  it('tripCircuitBreaker wrong state throws before sidecar-injected', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    expect(() =>
      tripCircuitBreaker(s, { failures: 1, total: 10, failureThreshold: 0.1 }),
    ).toThrow(/not sidecar-injected/);
  });

  it('applyTrafficSplit rejects empty splits', () => {
    const s = startMeshSession({ target: 'prometheus', meshName: 'x' });
    handshakeMtls(s, {
      clientSpiffe: 'spiffe://x/a',
      serverSpiffe: 'spiffe://x/b',
      cipherSuite: 'c',
    });
    injectSidecar(s, { injections: [{ pod: 'p', namespace: 'ns', proxy: 'envoy' }] });
    tripCircuitBreaker(s, { failures: 0, total: 100, failureThreshold: 0.5 });
    expect(() => applyTrafficSplit(s, { splits: [] })).toThrow(/must not be empty/);
  });
});

describe('coverage-fill — slo totalRequests===0 branch', () => {
  const threshold = { shortWindowMinutes: 5, longWindowMinutes: 60, burnRate: 14.4 };

  it('evaluateBurnRate uses 0 when no requests recorded', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    computeErrorBudget(s);
    const step = evaluateBurnRate(s, threshold);
    expect(step.metadata.burnRate).toBe(0);
    expect(s.burnRate).toBe(0);
  });

  it('fireMultiWindowMultiBurnRateAlert wrong state throws before burn-evaluated', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    expect(() =>
      fireMultiWindowMultiBurnRateAlert(s, { thresholds: [threshold], page: false }),
    ).toThrow(/not burn-evaluated/);
  });
});

describe('coverage-fill — incident-orchestrator remaining transitions', () => {
  it('detecting → invalid event stays detecting and records invalid tag', () => {
    const s = startIncident({ timestamp: 't0' });
    const next = dispatchIncidentEvent({ session: s, event: 'triage-completed', timestamp: 't1' });
    expect(next.state).toBe('detecting');
    expect(next.events.some((e) => e.startsWith('invalid:triage-completed'))).toBe(true);
  });

  it('detecting → timeout resolves', () => {
    const s = startIncident({ timestamp: 't0' });
    const next = dispatchIncidentEvent({ session: s, event: 'timeout', timestamp: 't1' });
    expect(next.state).toBe('resolved');
  });

  it('triaging → false-positive resolves', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchIncidentEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    const next = dispatchIncidentEvent({ session: s, event: 'false-positive', timestamp: 't2' });
    expect(next.state).toBe('resolved');
    expect(next.falsePositives).toBe(1);
  });

  it('triaging → invalid event stays triaging', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchIncidentEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    const next = dispatchIncidentEvent({
      session: s,
      event: 'escalation-succeeded',
      timestamp: 't2',
    });
    expect(next.state).toBe('triaging');
    expect(next.events.some((e) => e.startsWith('invalid:escalation-succeeded'))).toBe(true);
  });

  it('escalating → timeout resolves', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchIncidentEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    s = dispatchIncidentEvent({ session: s, event: 'triage-completed', timestamp: 't2' });
    const next = dispatchIncidentEvent({ session: s, event: 'timeout', timestamp: 't3' });
    expect(next.state).toBe('resolved');
  });

  it('escalating → invalid event stays escalating', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchIncidentEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    s = dispatchIncidentEvent({ session: s, event: 'triage-completed', timestamp: 't2' });
    const next = dispatchIncidentEvent({
      session: s,
      event: 'mitigation-applied',
      timestamp: 't3',
    });
    expect(next.state).toBe('escalating');
    expect(next.events.some((e) => e.startsWith('invalid:mitigation-applied'))).toBe(true);
  });

  it('mitigating → timeout resolves', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchIncidentEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    s = dispatchIncidentEvent({ session: s, event: 'triage-completed', timestamp: 't2' });
    s = dispatchIncidentEvent({ session: s, event: 'escalation-succeeded', timestamp: 't3' });
    const next = dispatchIncidentEvent({ session: s, event: 'timeout', timestamp: 't4' });
    expect(next.state).toBe('resolved');
  });

  it('mitigating → invalid event stays mitigating', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchIncidentEvent({ session: s, event: 'anomaly-detected', timestamp: 't1' });
    s = dispatchIncidentEvent({ session: s, event: 'triage-completed', timestamp: 't2' });
    s = dispatchIncidentEvent({ session: s, event: 'escalation-succeeded', timestamp: 't3' });
    const next = dispatchIncidentEvent({
      session: s,
      event: 'anomaly-detected',
      timestamp: 't4',
    });
    expect(next.state).toBe('mitigating');
    expect(next.events.some((e) => e.startsWith('invalid:anomaly-detected'))).toBe(true);
  });

  it('resolved terminal event adds terminal tag and stays resolved', () => {
    let s = startIncident({ timestamp: 't0' });
    s = dispatchIncidentEvent({ session: s, event: 'false-positive', timestamp: 't1' });
    const next = dispatchIncidentEvent({ session: s, event: 'timeout', timestamp: 't2' });
    expect(next.state).toBe('resolved');
    expect(next.events.some((e) => e.startsWith('terminal:timeout'))).toBe(true);
    const sum = summarizeIncident(next);
    expect(sum.terminalEvents).toBeGreaterThanOrEqual(1);
  });
});
