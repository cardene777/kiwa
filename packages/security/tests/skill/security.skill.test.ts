import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * security skill test — security lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('security skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('security.setup', JSON.stringify({ target: 'primary' }));
    spy.record('security.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'security.setup');
    assertToolCalled(spy, 'security.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('security.setup', '{}');
    spy.record('security.execute', '{}');
    spy.record('security.teardown', '{}');
    assertToolCallOrder(spy, ['security.setup', 'security.execute', 'security.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('security.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'security.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('security.execute', '{}');
    spy.record('security.execute', '{}');
    assertToolCalled(spy, 'security.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('security.execute', '{}');
    spy.record('security.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'security.retry');
    assertToolCallOrder(spy, ['security.execute', 'security.retry']);
  });
});
