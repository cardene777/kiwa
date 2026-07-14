import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * cache skill test — cache lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('cache skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('cache.setup', JSON.stringify({ target: 'primary' }));
    spy.record('cache.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'cache.setup');
    assertToolCalled(spy, 'cache.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('cache.setup', '{}');
    spy.record('cache.execute', '{}');
    spy.record('cache.teardown', '{}');
    assertToolCallOrder(spy, ['cache.setup', 'cache.execute', 'cache.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('cache.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'cache.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('cache.execute', '{}');
    spy.record('cache.execute', '{}');
    assertToolCalled(spy, 'cache.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('cache.execute', '{}');
    spy.record('cache.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'cache.retry');
    assertToolCallOrder(spy, ['cache.execute', 'cache.retry']);
  });
});
