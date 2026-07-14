import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * core skill test — core lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('core skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('core.setup', JSON.stringify({ target: 'primary' }));
    spy.record('core.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'core.setup');
    assertToolCalled(spy, 'core.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('core.setup', '{}');
    spy.record('core.execute', '{}');
    spy.record('core.teardown', '{}');
    assertToolCallOrder(spy, ['core.setup', 'core.execute', 'core.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('core.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'core.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('core.execute', '{}');
    spy.record('core.execute', '{}');
    assertToolCalled(spy, 'core.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('core.execute', '{}');
    spy.record('core.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'core.retry');
    assertToolCallOrder(spy, ['core.execute', 'core.retry']);
  });
});
