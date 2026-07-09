import { describe, expect, it } from 'vitest';
import { checkConformance, formatConformance, type Observation } from '../src/conformance.js';
import { UsageError } from '../src/errors.js';
import type { OrchestratorSpec } from '../src/types.js';

const SPEC: OrchestratorSpec = {
  moduleName: 'Session',
  namespace: 'Session',
  states: ['init', 'authed', 'expired'],
  events: ['auth-succeeded', 'session-expired', 'timeout'],
  unspecified: 'invalid',
  transitions: [
    { from: 'init', event: 'auth-succeeded', to: 'authed' },
    { from: 'init', event: 'timeout', to: 'expired' },
    { from: 'authed', event: 'session-expired', to: 'expired' },
    { from: 'authed', event: 'timeout', to: 'expired' },
  ],
};

const TO = (state: string): Observation => ({ kind: 'to', state });
const REJECTED: Observation = { kind: 'rejected' };

/** An implementation that agrees with the spec everywhere. */
function faithful(state: string, event: string): Observation {
  const target = SPEC.transitions.find(
    (t) => t.from === state && t.event === event && 'to' in t,
  );
  return target === undefined ? REJECTED : TO((target as { to: string }).to);
}

/** The same, with one cell changed. */
function withChange(
  state: string,
  event: string,
  observation: Observation,
): (s: string, e: string) => Observation {
  return (s, e) => (s === state && e === event ? observation : faithful(s, e));
}

describe('checkConformance walks every cell', () => {
  it('T-CONF-001 an implementation that agrees is reported as agreeing', () => {
    const report = checkConformance(SPEC, faithful);

    expect(report.ok).toBe(true);
    expect(report.checked).toBe(9);
    expect(report.agreedTransitions).toBe(4);
    expect(report.agreedRejections).toBe(5);
    expect(report.disagreements).toEqual([]);
  });

  it('T-CONF-002 every cell is asked about, including the rejected ones', () => {
    const asked: string[] = [];
    checkConformance(SPEC, (state, event) => {
      asked.push(`${state}+${event}`);
      return faithful(state, event);
    });

    expect(asked).toHaveLength(9);
    // The cells the spec refuses are where an implementation quietly diverges,
    // and a test written from the happy path never reaches them.
    expect(asked).toContain('authed+auth-succeeded');
    expect(asked).toContain('expired+timeout');
  });
});

describe('checkConformance names each way the two can disagree', () => {
  it('T-CONF-010 the implementation refuses a cell the spec allows', () => {
    const report = checkConformance(SPEC, withChange('init', 'timeout', REJECTED));

    expect(report.ok).toBe(false);
    expect(report.disagreements).toHaveLength(1);
    expect(report.disagreements[0]).toMatchObject({
      state: 'init',
      event: 'timeout',
      kind: 'impl-rejects',
      spec: 'expired',
      impl: null,
    });
  });

  it('T-CONF-011 the implementation accepts a cell the spec refuses', () => {
    // The dangerous half: the machine takes an event the spec calls impossible.
    const report = checkConformance(SPEC, withChange('expired', 'timeout', TO('init')));

    expect(report.ok).toBe(false);
    expect(report.disagreements[0]).toMatchObject({
      kind: 'impl-accepts',
      spec: null,
      impl: 'init',
    });
    expect(report.disagreements[0]?.message).toContain('the spec refuses the event');
  });

  it('T-CONF-012 both accept and land in different states', () => {
    const report = checkConformance(SPEC, withChange('init', 'auth-succeeded', TO('expired')));

    expect(report.disagreements[0]).toMatchObject({
      kind: 'different-target',
      spec: 'authed',
      impl: 'expired',
    });
  });

  it('T-CONF-013 the implementation lands outside the state space', () => {
    const report = checkConformance(SPEC, withChange('init', 'auth-succeeded', TO('nowhere')));

    expect(report.disagreements[0]).toMatchObject({ kind: 'unknown-state', impl: 'nowhere' });
    expect(report.disagreements[0]?.message).toContain('not a state of this machine');
  });

  it('T-CONF-014 a self-loop is not a rejection', () => {
    // The distinction the Lean encoding exists to keep. An implementation that
    // stays put has accepted the event; one that refuses has not.
    const looping: OrchestratorSpec = {
      ...SPEC,
      transitions: [...SPEC.transitions, { from: 'authed', event: 'auth-succeeded', to: 'authed' }],
    };

    const staysPut = checkConformance(looping, (s, e) =>
      s === 'authed' && e === 'auth-succeeded' ? TO('authed') : faithful(s, e),
    );
    const refuses = checkConformance(looping, (s, e) =>
      s === 'authed' && e === 'auth-succeeded' ? REJECTED : faithful(s, e),
    );

    expect(staysPut.ok).toBe(true);
    expect(refuses.ok).toBe(false);
    expect(refuses.disagreements[0]?.kind).toBe('impl-rejects');
  });

  it('T-CONF-015 several disagreements are all reported, not just the first', () => {
    const report = checkConformance(SPEC, (state, event) => {
      if (state === 'init' && event === 'timeout') return REJECTED;
      if (state === 'expired' && event === 'timeout') return TO('init');
      return faithful(state, event);
    });

    expect(report.disagreements).toHaveLength(2);
    expect(report.disagreements.map((d) => d.kind)).toEqual(['impl-rejects', 'impl-accepts']);
  });
});

describe('an observer that is broken is not an implementation that is wrong', () => {
  // `{ kind: 'to' }` with no state used to read as a state named `undefined`, and
  // every cell came back `unknown-state`: a report blaming the machine for what
  // the observer did. TypeScript says the shape; a JavaScript caller gets the
  // same answer, one call earlier.
  it.each([
    ['undefined', () => undefined],
    ['null', () => null],
    ['a string', () => 'to'],
    ['an object with no kind', () => ({})],
    ['an unknown kind', () => ({ kind: 'maybe' })],
    ['to, with no state', () => ({ kind: 'to' })],
    ['to, with a state that is not a string', () => ({ kind: 'to', state: 1 })],
  ])('T-CONF-040 the observer returns %s', (_why, observe) => {
    expect(() => checkConformance(SPEC, observe as never)).toThrow(UsageError);
  });

  it('T-CONF-041 the error names the cell that was being observed', () => {
    expect(() => checkConformance(SPEC, () => ({ kind: 'to' }) as never)).toThrow(
      /observing init \+ auth-succeeded/,
    );
  });

  it('T-CONF-042 an observer that throws is not caught', () => {
    // Whatever went wrong inside the caller's code is the caller's to see.
    expect(() =>
      checkConformance(SPEC, () => {
        throw new Error('the session store is down');
      }),
    ).toThrow('the session store is down');
  });
});

describe('checkConformance reads the same table the generator does', () => {
  it('T-CONF-020 an undeclared cell stops the check, as it stops generation', () => {
    const { unspecified: _policy, ...strict } = SPEC;
    expect(() => checkConformance(strict, faithful)).toThrow(/cell\(s\) are undeclared/);
    expect(() => checkConformance(strict, faithful)).toThrow(/checkConformance/);
  });

  it('T-CONF-021 an unknown state in the table stops the check', () => {
    const broken: OrchestratorSpec = {
      ...SPEC,
      transitions: [{ from: 'init', event: 'timeout', to: 'nowhere' }],
    };
    expect(() => checkConformance(broken, faithful)).toThrow(/unknown state.*transition\.to/);
  });
});

describe('formatConformance says what happened in one message', () => {
  it('T-CONF-030 an agreement counts the cells', () => {
    const out = formatConformance(SPEC, checkConformance(SPEC, faithful));
    expect(out).toContain('9 cells agree');
    expect(out).toContain('4 transitions');
    expect(out).toContain('5 rejections');
  });

  it('T-CONF-031 a disagreement lists each cell', () => {
    const report = checkConformance(SPEC, withChange('init', 'timeout', REJECTED));
    const out = formatConformance(SPEC, report);

    expect(out).toContain('1 of 9 cells disagree');
    expect(out).toContain('init + timeout');
    expect(out).toContain('the implementation refuses the event');
  });

  it('T-CONF-032 a machine that disagrees everywhere does not print everything', () => {
    // Twenty states and twenty events disagreeing in every cell is four hundred
    // lines, and nobody reads the four hundredth.
    const wide: OrchestratorSpec = {
      moduleName: 'Wide',
      namespace: 'Wide',
      states: Array.from({ length: 20 }, (_, i) => `s${i}`),
      events: Array.from({ length: 20 }, (_, i) => `e${i}`),
      unspecified: 'invalid',
      transitions: [],
    };
    const report = checkConformance(wide, () => TO('s0'));
    const out = formatConformance(wide, report);

    expect(report.disagreements).toHaveLength(400);
    expect(out.split('\n')).toHaveLength(22);
    expect(out).toContain('400 of 400 cells disagree');
    expect(out).toContain('...and 380 more, in report.disagreements');
  });
});
