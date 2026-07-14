import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * nuxt skill test — nuxt lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('nuxt skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('nuxt.setup', JSON.stringify({ target: 'primary' }));
    spy.record('nuxt.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'nuxt.setup');
    assertToolCalled(spy, 'nuxt.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('nuxt.setup', '{}');
    spy.record('nuxt.execute', '{}');
    spy.record('nuxt.teardown', '{}');
    assertToolCallOrder(spy, ['nuxt.setup', 'nuxt.execute', 'nuxt.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('nuxt.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'nuxt.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('nuxt.execute', '{}');
    spy.record('nuxt.execute', '{}');
    assertToolCalled(spy, 'nuxt.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('nuxt.execute', '{}');
    spy.record('nuxt.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'nuxt.retry');
    assertToolCallOrder(spy, ['nuxt.execute', 'nuxt.retry']);
  });
});
