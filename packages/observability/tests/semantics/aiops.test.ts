import { describe, expect, it } from 'vitest';
import {
  analyzeRootCause,
  correlateAlerts,
  detectAnomaly,
  executeRemediation,
  startAiopsSession,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('aiops axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'prod-us-east' });
    detectAnomaly(s, {
      points: [
        { metric: 'cpu', value: 90, zScore: 3.2 },
        { metric: 'mem', value: 50, zScore: 0.5 },
      ],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, {
      actions: [{ actionId: 'a1', runbookId: 'r1', success: true }],
    });
    analyzeRootCause(s, {
      edges: [{ from: 'api', to: 'db' }],
      failedServices: ['db'],
    });
    correlateAlerts(s, {
      alerts: [
        { alertId: 'a1', service: 'x', firedAtMs: 1000 },
        { alertId: 'a2', service: 'y', firedAtMs: 1200 },
      ],
      windowMs: 500,
    });
    expect(s.state).toBe('alerts-correlated');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'aiops.anomaly_detected',
      'aiops.remediation_executed',
      'aiops.root_cause_analyzed',
      'aiops.alerts_correlated',
    ]);
  });

  it('detectAnomaly filters by z-score threshold', () => {
    const s = startAiopsSession({ target: 'grafana-oss', clusterId: 'c' });
    const step = detectAnomaly(s, {
      points: [
        { metric: 'a', value: 1, zScore: 4.0 },
        { metric: 'b', value: 2, zScore: -3.5 },
        { metric: 'c', value: 3, zScore: 1.0 },
      ],
      zScoreThreshold: 3.0,
    });
    expect(step.metadata.anomalyCount).toBe(2);
    expect(step.metadata.hasAnomaly).toBe(true);
    expect(s.anomalies).toHaveLength(2);
  });

  it('detectAnomaly returns 0 when no points exceed threshold', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    const step = detectAnomaly(s, {
      points: [
        { metric: 'a', value: 1, zScore: 0.5 },
        { metric: 'b', value: 2, zScore: -1.0 },
      ],
      zScoreThreshold: 2.0,
    });
    expect(step.metadata.anomalyCount).toBe(0);
    expect(step.metadata.hasAnomaly).toBe(false);
  });

  it('executeRemediation counts success and failure', () => {
    const s = startAiopsSession({ target: 'otel-collector', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    const step = executeRemediation(s, {
      actions: [
        { actionId: 'a1', runbookId: 'r1', success: true },
        { actionId: 'a2', runbookId: 'r2', success: false },
        { actionId: 'a3', runbookId: 'r3', success: true },
      ],
    });
    expect(step.metadata.succeeded).toBe(2);
    expect(step.metadata.failed).toBe(1);
    expect(step.metadata.allSucceeded).toBe(false);
  });

  it('executeRemediation marks all-succeeded when no failures', () => {
    const s = startAiopsSession({ target: 'grafana-oss', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    const step = executeRemediation(s, {
      actions: [{ actionId: 'a', runbookId: 'r', success: true }],
    });
    expect(step.metadata.allSucceeded).toBe(true);
  });

  it('analyzeRootCause picks upstream failed service', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: false }] });
    const step = analyzeRootCause(s, {
      edges: [
        { from: 'db', to: 'api' },
        { from: 'api', to: 'web' },
      ],
      failedServices: ['db', 'api', 'web'],
    });
    // db is upstream because its downstream (api) is also failed
    expect(step.metadata.rootCause).toBe('db');
    expect(s.rootCauseService).toBe('db');
  });

  it('analyzeRootCause falls back to first failed service when no clear root', () => {
    const s = startAiopsSession({ target: 'loki', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: false }] });
    const step = analyzeRootCause(s, {
      edges: [],
      failedServices: ['only-one'],
    });
    // No edges → outgoing is empty, downstream.every returns true for empty arrays, so root = 'only-one'
    expect(step.metadata.rootCause).toBe('only-one');
  });

  it('correlateAlerts groups within window', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    analyzeRootCause(s, { edges: [], failedServices: ['db'] });
    const step = correlateAlerts(s, {
      alerts: [
        { alertId: 'a1', service: 'x', firedAtMs: 1000 },
        { alertId: 'a2', service: 'y', firedAtMs: 1200 },
        { alertId: 'a3', service: 'z', firedAtMs: 5000 },
      ],
      windowMs: 500,
    });
    expect(step.metadata.groupCount).toBe(2);
    expect(s.correlationGroups).toEqual([['a1', 'a2'], ['a3']]);
  });

  it('correlateAlerts sorts by firedAtMs before grouping', () => {
    const s = startAiopsSession({ target: 'grafana-oss', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    analyzeRootCause(s, { edges: [], failedServices: ['x'] });
    const step = correlateAlerts(s, {
      alerts: [
        { alertId: 'z', service: 'x', firedAtMs: 3000 },
        { alertId: 'a', service: 'x', firedAtMs: 1000 },
      ],
      windowMs: 5000,
    });
    expect(step.metadata.groupCount).toBe(1);
    expect(s.correlationGroups[0]).toEqual(['a', 'z']);
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startAiopsSession({ target, clusterId: 'c' });
    const step = detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('aiops axis — invariant guards', () => {
  it('rejects empty clusterId', () => {
    expect(() => startAiopsSession({ target: 'prometheus', clusterId: '' })).toThrow(/clusterId/);
  });

  it('rejects detectAnomaly out of state', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    expect(() =>
      detectAnomaly(s, {
        points: [{ metric: 'x', value: 1, zScore: 4.0 }],
        zScoreThreshold: 3.0,
      }),
    ).toThrow(/not idle/);
  });

  it('rejects detectAnomaly with empty points', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    expect(() => detectAnomaly(s, { points: [], zScoreThreshold: 3.0 })).toThrow(/must not be empty/);
  });

  it('rejects detectAnomaly with non-positive threshold', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    expect(() =>
      detectAnomaly(s, {
        points: [{ metric: 'x', value: 1, zScore: 1.0 }],
        zScoreThreshold: 0,
      }),
    ).toThrow(/zScoreThreshold/);
  });

  it('rejects executeRemediation before anomaly detection', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    expect(() =>
      executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] }),
    ).toThrow(/not anomaly-detected/);
  });

  it('rejects executeRemediation with empty actions', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    expect(() => executeRemediation(s, { actions: [] })).toThrow(/must not be empty/);
  });

  it('rejects analyzeRootCause before remediation', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    expect(() =>
      analyzeRootCause(s, { edges: [], failedServices: ['x'] }),
    ).toThrow(/not remediation-executed/);
  });

  it('rejects analyzeRootCause with empty failedServices', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    expect(() => analyzeRootCause(s, { edges: [], failedServices: [] })).toThrow(
      /failedServices/,
    );
  });

  it('rejects correlateAlerts before root cause analysis', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    expect(() =>
      correlateAlerts(s, {
        alerts: [{ alertId: 'a', service: 'x', firedAtMs: 1000 }],
        windowMs: 500,
      }),
    ).toThrow(/not root-cause-analyzed/);
  });

  it('rejects correlateAlerts with empty alerts', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    analyzeRootCause(s, { edges: [], failedServices: ['x'] });
    expect(() => correlateAlerts(s, { alerts: [], windowMs: 500 })).toThrow(/must not be empty/);
  });

  it('rejects correlateAlerts with non-positive windowMs', () => {
    const s = startAiopsSession({ target: 'prometheus', clusterId: 'c' });
    detectAnomaly(s, {
      points: [{ metric: 'x', value: 1, zScore: 4.0 }],
      zScoreThreshold: 3.0,
    });
    executeRemediation(s, { actions: [{ actionId: 'a', runbookId: 'r', success: true }] });
    analyzeRootCause(s, { edges: [], failedServices: ['x'] });
    expect(() =>
      correlateAlerts(s, {
        alerts: [{ alertId: 'a', service: 'x', firedAtMs: 1000 }],
        windowMs: 0,
      }),
    ).toThrow(/windowMs/);
  });
});
