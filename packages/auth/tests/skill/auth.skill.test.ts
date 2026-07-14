import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * auth skill test — auth lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('auth skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('auth.setup', JSON.stringify({ target: 'primary' }));
    spy.record('auth.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'auth.setup');
    assertToolCalled(spy, 'auth.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('auth.setup', '{}');
    spy.record('auth.execute', '{}');
    spy.record('auth.teardown', '{}');
    assertToolCallOrder(spy, ['auth.setup', 'auth.execute', 'auth.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('auth.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'auth.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('auth.execute', '{}');
    spy.record('auth.execute', '{}');
    assertToolCalled(spy, 'auth.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('auth.execute', '{}');
    spy.record('auth.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'auth.retry');
    assertToolCallOrder(spy, ['auth.execute', 'auth.retry']);
  });
});
