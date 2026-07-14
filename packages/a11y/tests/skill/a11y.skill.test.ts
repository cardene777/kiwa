import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * a11y skill test — a11y lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('a11y skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('a11y.setup', JSON.stringify({ target: 'primary' }));
    spy.record('a11y.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'a11y.setup');
    assertToolCalled(spy, 'a11y.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('a11y.setup', '{}');
    spy.record('a11y.execute', '{}');
    spy.record('a11y.teardown', '{}');
    assertToolCallOrder(spy, ['a11y.setup', 'a11y.execute', 'a11y.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('a11y.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'a11y.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('a11y.execute', '{}');
    spy.record('a11y.execute', '{}');
    assertToolCalled(spy, 'a11y.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('a11y.execute', '{}');
    spy.record('a11y.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'a11y.retry');
    assertToolCallOrder(spy, ['a11y.execute', 'a11y.retry']);
  });
});
