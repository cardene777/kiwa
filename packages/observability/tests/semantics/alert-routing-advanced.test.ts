import { describe, expect, it } from 'vitest';
import {
  advanceEscalation,
  applyInhibit,
  applySilence,
  isSilenced,
  pageOncall,
  setEscalationChain,
  startAlertRoutingAdvanced,
} from '../../src/semantics/index.js';

describe('alert-routing-advanced axis — happy path', () => {
  it('applies silence window matching labels', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'main' });
    applySilence(s, {
      matcher: { severity: 'warning' },
      startMs: 1000,
      endMs: 2000,
      reason: 'maintenance',
    });
    expect(isSilenced(s, { severity: 'warning' }, 1500)).toBe(true);
    expect(isSilenced(s, { severity: 'critical' }, 1500)).toBe(false);
    expect(isSilenced(s, { severity: 'warning' }, 3000)).toBe(false);
  });

  it('applies inhibit rule with equal labels', () => {
    const s = startAlertRoutingAdvanced({ target: 'grafana-oss', routerId: 'main' });
    const step = applyInhibit(s, {
      sourceMatcher: { severity: 'critical' },
      targetMatcher: { severity: 'warning' },
      equalLabels: ['service', 'cluster'],
    });
    expect(step.metadata.equalLabels).toBe('service,cluster');
    expect(s.inhibits).toHaveLength(1);
  });

  it('advances escalation chain step by step', () => {
    const s = startAlertRoutingAdvanced({ target: 'otel-collector', routerId: 'main' });
    setEscalationChain(s, [
      { afterMinutes: 0, target: 'primary-oncall' },
      { afterMinutes: 15, target: 'secondary-oncall' },
      { afterMinutes: 30, target: 'incident-commander' },
    ]);
    const step1 = advanceEscalation(s);
    expect(step1.metadata.stepIndex).toBe(0);
    expect(step1.metadata.target).toBe('primary-oncall');
    const step2 = advanceEscalation(s);
    expect(step2.metadata.stepIndex).toBe(1);
    const step3 = advanceEscalation(s);
    expect(step3.metadata.target).toBe('incident-commander');
  });

  it('cannot advance escalation past final step', () => {
    const s = startAlertRoutingAdvanced({ target: 'loki', routerId: 'main' });
    setEscalationChain(s, [{ afterMinutes: 0, target: 'primary-oncall' }]);
    advanceEscalation(s);
    expect(() => advanceEscalation(s)).toThrow(/final step/);
  });

  it('pages oncall targets and records history', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'main' });
    pageOncall(s, { target: 'oncall-primary' });
    pageOncall(s, { target: 'oncall-secondary' });
    expect(s.pagedTargets).toEqual(['oncall-primary', 'oncall-secondary']);
  });

  it('translates provider event for each target', () => {
    for (const target of ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const) {
      const s = startAlertRoutingAdvanced({ target, routerId: 'main' });
      const step = pageOncall(s, { target: 'x' });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('alert-routing-advanced axis — invariant guards', () => {
  it('rejects empty routerId', () => {
    expect(() => startAlertRoutingAdvanced({ target: 'prometheus', routerId: '' })).toThrow(
      /routerId/,
    );
  });

  it('rejects silence with endMs <= startMs', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() =>
      applySilence(s, {
        matcher: { severity: 'warning' },
        startMs: 1000,
        endMs: 1000,
        reason: 'x',
      }),
    ).toThrow(/after startMs/);
  });

  it('rejects silence with empty matcher', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() =>
      applySilence(s, {
        matcher: {},
        startMs: 1,
        endMs: 2,
        reason: 'x',
      }),
    ).toThrow(/matcher/);
  });

  it('rejects inhibit rule with empty source matcher', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() =>
      applyInhibit(s, {
        sourceMatcher: {},
        targetMatcher: { severity: 'warning' },
        equalLabels: ['service'],
      }),
    ).toThrow(/sourceMatcher/);
  });

  it('rejects inhibit rule with empty target matcher', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() =>
      applyInhibit(s, {
        sourceMatcher: { severity: 'critical' },
        targetMatcher: {},
        equalLabels: ['service'],
      }),
    ).toThrow(/targetMatcher/);
  });

  it('rejects inhibit rule with empty equal labels', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() =>
      applyInhibit(s, {
        sourceMatcher: { severity: 'critical' },
        targetMatcher: { severity: 'warning' },
        equalLabels: [],
      }),
    ).toThrow(/equalLabels/);
  });

  it('rejects empty escalation chain', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() => setEscalationChain(s, [])).toThrow(/must not be empty/);
  });

  it('rejects non-strictly-increasing afterMinutes', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() =>
      setEscalationChain(s, [
        { afterMinutes: 10, target: 'primary-oncall' },
        { afterMinutes: 10, target: 'secondary-oncall' },
      ]),
    ).toThrow(/strictly increasing/);
  });

  it('cannot advance escalation before setting chain', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() => advanceEscalation(s)).toThrow(/chain must be set/);
  });

  it('rejects empty page target', () => {
    const s = startAlertRoutingAdvanced({ target: 'prometheus', routerId: 'x' });
    expect(() => pageOncall(s, { target: '' })).toThrow(/target/);
  });
});
