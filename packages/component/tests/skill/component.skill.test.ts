import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * component skill test — component lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('component skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('component.setup', JSON.stringify({ target: 'primary' }));
    spy.record('component.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'component.setup');
    assertToolCalled(spy, 'component.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('component.setup', '{}');
    spy.record('component.execute', '{}');
    spy.record('component.teardown', '{}');
    assertToolCallOrder(spy, ['component.setup', 'component.execute', 'component.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('component.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'component.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('component.execute', '{}');
    spy.record('component.execute', '{}');
    assertToolCalled(spy, 'component.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('component.execute', '{}');
    spy.record('component.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'component.retry');
    assertToolCallOrder(spy, ['component.execute', 'component.retry']);
  });
});
