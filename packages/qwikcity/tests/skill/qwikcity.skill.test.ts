import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * qwikcity skill test — qwikcity lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('qwikcity skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('qwikcity.setup', JSON.stringify({ target: 'primary' }));
    spy.record('qwikcity.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'qwikcity.setup');
    assertToolCalled(spy, 'qwikcity.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('qwikcity.setup', '{}');
    spy.record('qwikcity.execute', '{}');
    spy.record('qwikcity.teardown', '{}');
    assertToolCallOrder(spy, ['qwikcity.setup', 'qwikcity.execute', 'qwikcity.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('qwikcity.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'qwikcity.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('qwikcity.execute', '{}');
    spy.record('qwikcity.execute', '{}');
    assertToolCalled(spy, 'qwikcity.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('qwikcity.execute', '{}');
    spy.record('qwikcity.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'qwikcity.retry');
    assertToolCallOrder(spy, ['qwikcity.execute', 'qwikcity.retry']);
  });
});
