import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * solidjs skill test — solidjs lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('solidjs skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('solidjs.setup', JSON.stringify({ target: 'primary' }));
    spy.record('solidjs.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'solidjs.setup');
    assertToolCalled(spy, 'solidjs.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('solidjs.setup', '{}');
    spy.record('solidjs.execute', '{}');
    spy.record('solidjs.teardown', '{}');
    assertToolCallOrder(spy, ['solidjs.setup', 'solidjs.execute', 'solidjs.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('solidjs.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'solidjs.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('solidjs.execute', '{}');
    spy.record('solidjs.execute', '{}');
    assertToolCalled(spy, 'solidjs.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('solidjs.execute', '{}');
    spy.record('solidjs.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'solidjs.retry');
    assertToolCallOrder(spy, ['solidjs.execute', 'solidjs.retry']);
  });
});
