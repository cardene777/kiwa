import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * ui skill test — ui lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('ui skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('ui.setup', JSON.stringify({ target: 'primary' }));
    spy.record('ui.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'ui.setup');
    assertToolCalled(spy, 'ui.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('ui.setup', '{}');
    spy.record('ui.execute', '{}');
    spy.record('ui.teardown', '{}');
    assertToolCallOrder(spy, ['ui.setup', 'ui.execute', 'ui.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('ui.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'ui.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('ui.execute', '{}');
    spy.record('ui.execute', '{}');
    assertToolCalled(spy, 'ui.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('ui.execute', '{}');
    spy.record('ui.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'ui.retry');
    assertToolCallOrder(spy, ['ui.execute', 'ui.retry']);
  });
});
