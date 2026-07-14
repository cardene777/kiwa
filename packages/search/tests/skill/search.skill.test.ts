import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * search skill test — search lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('search skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('search.setup', JSON.stringify({ target: 'primary' }));
    spy.record('search.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'search.setup');
    assertToolCalled(spy, 'search.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('search.setup', '{}');
    spy.record('search.execute', '{}');
    spy.record('search.teardown', '{}');
    assertToolCallOrder(spy, ['search.setup', 'search.execute', 'search.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('search.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'search.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('search.execute', '{}');
    spy.record('search.execute', '{}');
    assertToolCalled(spy, 'search.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('search.execute', '{}');
    spy.record('search.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'search.retry');
    assertToolCallOrder(spy, ['search.execute', 'search.retry']);
  });
});
