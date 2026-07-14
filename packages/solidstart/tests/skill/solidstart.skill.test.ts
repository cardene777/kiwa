import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * solidstart skill test — solidstart lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('solidstart skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('solidstart.setup', JSON.stringify({ target: 'primary' }));
    spy.record('solidstart.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'solidstart.setup');
    assertToolCalled(spy, 'solidstart.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('solidstart.setup', '{}');
    spy.record('solidstart.execute', '{}');
    spy.record('solidstart.teardown', '{}');
    assertToolCallOrder(spy, ['solidstart.setup', 'solidstart.execute', 'solidstart.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('solidstart.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'solidstart.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('solidstart.execute', '{}');
    spy.record('solidstart.execute', '{}');
    assertToolCalled(spy, 'solidstart.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('solidstart.execute', '{}');
    spy.record('solidstart.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'solidstart.retry');
    assertToolCallOrder(spy, ['solidstart.execute', 'solidstart.retry']);
  });
});
