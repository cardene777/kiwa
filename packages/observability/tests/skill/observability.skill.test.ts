import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { detectFlaky } from '../../src/index.js';

function makeRecord(testId: string, status: 'passed' | 'failed', runId: string) {
  return {
    testId,
    fullName: `test.${testId}`,
    status,
    durationMs: 10,
    runId,
    startedAt: Date.now(),
  };
}

describe('observability skill — detectFlaky skill flow', () => {
  it('T-SKL-D-001 detectFlaky skill', () => {
    const spy = createToolSpy();
    const history = {
      records: [makeRecord('t1', 'passed', 'r1'), makeRecord('t1', 'failed', 'r2'), makeRecord('t1', 'passed', 'r3')],
    };
    const result = detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    spy.record('obs.detectFlaky', JSON.stringify({ count: result.length }));

    assertToolCalled(spy, 'obs.detectFlaky');
    expect(result.length).toBeGreaterThan(0);
  });

  it('T-SKL-D-002 batch detectFlaky skill (times=3)', () => {
    const spy = createToolSpy();
    const history = { records: [makeRecord('t', 'passed', 'r1'), makeRecord('t', 'failed', 'r2'), makeRecord('t', 'passed', 'r3')] };
    detectFlaky({ history, minRuns: 3 });
    spy.record('obs.detectFlaky', '{}');
    detectFlaky({ history, minRuns: 3 });
    spy.record('obs.detectFlaky', '{}');
    detectFlaky({ history, minRuns: 3 });
    spy.record('obs.detectFlaky', '{}');

    assertToolCalled(spy, 'obs.detectFlaky', { times: 3 });
  });

  it('T-SKL-D-003 threshold config skill', () => {
    const spy = createToolSpy();
    const history = { records: [makeRecord('t', 'passed', 'r1'), makeRecord('t', 'failed', 'r2'), makeRecord('t', 'passed', 'r3')] };
    detectFlaky({ history, minRuns: 3, threshold: 0.5 });
    spy.record('obs.detectFlaky.high-threshold', '{}');
    detectFlaky({ history, minRuns: 3, threshold: 0.1 });
    spy.record('obs.detectFlaky.low-threshold', '{}');

    assertToolCallOrder(spy, ['obs.detectFlaky.high-threshold', 'obs.detectFlaky.low-threshold']);
  });

  it('T-SKL-D-004 minRuns filter skill', () => {
    const spy = createToolSpy();
    const history = { records: [makeRecord('t', 'passed', 'r1')] };
    detectFlaky({ history, minRuns: 5 });
    spy.record('obs.detectFlaky.filtered', '{}');

    assertToolCalled(spy, 'obs.detectFlaky.filtered');
  });

  it('T-SKL-D-005 empty history skill', () => {
    const spy = createToolSpy();
    const result = detectFlaky({ history: { records: [] }, minRuns: 3 });
    spy.record('obs.detectFlaky.empty', '{}');

    assertToolCalled(spy, 'obs.detectFlaky.empty');
    expect(result.length).toBe(0);
  });
});
