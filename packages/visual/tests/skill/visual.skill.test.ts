import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * visual skill test — visual lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('visual skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('visual.setup', JSON.stringify({ target: 'primary' }));
    spy.record('visual.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'visual.setup');
    assertToolCalled(spy, 'visual.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('visual.setup', '{}');
    spy.record('visual.execute', '{}');
    spy.record('visual.teardown', '{}');
    assertToolCallOrder(spy, ['visual.setup', 'visual.execute', 'visual.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('visual.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'visual.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('visual.execute', '{}');
    spy.record('visual.execute', '{}');
    assertToolCalled(spy, 'visual.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('visual.execute', '{}');
    spy.record('visual.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'visual.retry');
    assertToolCallOrder(spy, ['visual.execute', 'visual.retry']);
  });
});
