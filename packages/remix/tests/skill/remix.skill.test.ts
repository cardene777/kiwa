import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * remix skill test — remix lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('remix skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('remix.setup', JSON.stringify({ target: 'primary' }));
    spy.record('remix.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'remix.setup');
    assertToolCalled(spy, 'remix.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('remix.setup', '{}');
    spy.record('remix.execute', '{}');
    spy.record('remix.teardown', '{}');
    assertToolCallOrder(spy, ['remix.setup', 'remix.execute', 'remix.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('remix.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'remix.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('remix.execute', '{}');
    spy.record('remix.execute', '{}');
    assertToolCalled(spy, 'remix.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('remix.execute', '{}');
    spy.record('remix.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'remix.retry');
    assertToolCallOrder(spy, ['remix.execute', 'remix.retry']);
  });
});
