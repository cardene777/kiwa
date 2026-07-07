import { describe, expect, it } from 'vitest';
import {
  computeBlastRadius,
  injectFault,
  recordGameDay,
  startChaosSession,
  triggerRollback,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('chaos axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'exp-1' });
    injectFault(s, { kind: 'network-latency', target: 'svc-a', durationSec: 60 });
    computeBlastRadius(s, { affectedInstances: 3, totalInstances: 10 });
    triggerRollback(s, { errorRate: 0.15, threshold: 0.1 });
    recordGameDay(s, { participants: 5, issuesFound: 3, durationMinutes: 90 });
    expect(s.state).toBe('game-day-recorded');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'chaos.fault_injected',
      'chaos.blast_radius_computed',
      'chaos.rollback_triggered',
      'chaos.game_day_recorded',
    ]);
  });

  it('injectFault records target and duration', () => {
    const s = startChaosSession({ target: 'grafana-oss', experimentId: 'e' });
    const step = injectFault(s, { kind: 'pod-kill', target: 'api', durationSec: 30 });
    expect(step.metadata.kind).toBe('pod-kill');
    expect(step.metadata.target).toBe('api');
    expect(step.metadata.durationSec).toBe(30);
    expect(s.fault).toEqual({ kind: 'pod-kill', target: 'api', durationSec: 30 });
  });

  it('computeBlastRadius calculates affected ratio', () => {
    const s = startChaosSession({ target: 'loki', experimentId: 'e' });
    injectFault(s, { kind: 'cpu-stress', target: 'x', durationSec: 10 });
    const step = computeBlastRadius(s, { affectedInstances: 25, totalInstances: 100 });
    expect(step.metadata.blastRadiusRatio).toBe(0.25);
    expect(s.affectedInstances).toBe(25);
    expect(s.blastRadiusRatio).toBe(0.25);
  });

  it('computeBlastRadius handles zero affected', () => {
    const s = startChaosSession({ target: 'otel-collector', experimentId: 'e' });
    injectFault(s, { kind: 'disk-fill', target: 'x', durationSec: 10 });
    const step = computeBlastRadius(s, { affectedInstances: 0, totalInstances: 50 });
    expect(step.metadata.blastRadiusRatio).toBe(0);
    expect(s.blastRadiusRatio).toBe(0);
  });

  it('triggerRollback fires when errorRate >= threshold', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'network-partition', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 5, totalInstances: 10 });
    const step = triggerRollback(s, { errorRate: 0.2, threshold: 0.1 });
    expect(step.metadata.triggered).toBe(true);
    expect(s.rollbackTriggered).toBe(true);
  });

  it('triggerRollback stays silent when under threshold', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'network-partition', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 5, totalInstances: 10 });
    const step = triggerRollback(s, { errorRate: 0.05, threshold: 0.1 });
    expect(step.metadata.triggered).toBe(false);
    expect(s.rollbackTriggered).toBe(false);
  });

  it('recordGameDay stores participants and duration', () => {
    const s = startChaosSession({ target: 'grafana-oss', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 });
    triggerRollback(s, { errorRate: 0.5, threshold: 0.5 });
    const step = recordGameDay(s, { participants: 8, issuesFound: 4, durationMinutes: 120 });
    expect(step.metadata.participants).toBe(8);
    expect(step.metadata.issuesFound).toBe(4);
    expect(step.metadata.durationMinutes).toBe(120);
    expect(s.gameDayLog).toEqual({ participants: 8, issuesFound: 4, durationMinutes: 120 });
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startChaosSession({ target, experimentId: 'e' });
    const step = injectFault(s, { kind: 'network-latency', target: 'x', durationSec: 10 });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('chaos axis — invariant guards', () => {
  it('rejects empty experimentId', () => {
    expect(() => startChaosSession({ target: 'prometheus', experimentId: '' })).toThrow(
      /experimentId/,
    );
  });

  it('rejects injectFault out of state', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    expect(() => injectFault(s, { kind: 'pod-kill', target: 'y', durationSec: 5 })).toThrow(
      /not idle/,
    );
  });

  it('rejects injectFault with empty target', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    expect(() =>
      injectFault(s, { kind: 'pod-kill', target: '', durationSec: 10 }),
    ).toThrow(/target/);
  });

  it('rejects injectFault with non-positive durationSec', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    expect(() =>
      injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 0 }),
    ).toThrow(/durationSec/);
  });

  it('rejects computeBlastRadius before fault injection', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    expect(() => computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 })).toThrow(
      /not fault-injected/,
    );
  });

  it('rejects computeBlastRadius with non-positive totalInstances', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    expect(() => computeBlastRadius(s, { affectedInstances: 0, totalInstances: 0 })).toThrow(
      /totalInstances/,
    );
  });

  it('rejects computeBlastRadius when affected > total', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    expect(() => computeBlastRadius(s, { affectedInstances: 20, totalInstances: 10 })).toThrow(
      /affectedInstances/,
    );
  });

  it('rejects triggerRollback before blast radius computed', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    expect(() => triggerRollback(s, { errorRate: 0.1, threshold: 0.05 })).toThrow(
      /not blast-radius-computed/,
    );
  });

  it('rejects triggerRollback with errorRate out of [0, 1]', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 });
    expect(() => triggerRollback(s, { errorRate: 1.5, threshold: 0.1 })).toThrow(/errorRate/);
  });

  it('rejects recordGameDay before rollback', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    expect(() =>
      recordGameDay(s, { participants: 1, issuesFound: 0, durationMinutes: 60 }),
    ).toThrow(/not rollback-triggered/);
  });

  it('rejects recordGameDay with non-positive participants', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 });
    triggerRollback(s, { errorRate: 0.1, threshold: 0.05 });
    expect(() =>
      recordGameDay(s, { participants: 0, issuesFound: 0, durationMinutes: 60 }),
    ).toThrow(/participants/);
  });

  it('rejects recordGameDay with negative issues', () => {
    const s = startChaosSession({ target: 'prometheus', experimentId: 'e' });
    injectFault(s, { kind: 'pod-kill', target: 'x', durationSec: 10 });
    computeBlastRadius(s, { affectedInstances: 1, totalInstances: 10 });
    triggerRollback(s, { errorRate: 0.1, threshold: 0.05 });
    expect(() =>
      recordGameDay(s, { participants: 1, issuesFound: -1, durationMinutes: 60 }),
    ).toThrow(/issuesFound/);
  });
});
