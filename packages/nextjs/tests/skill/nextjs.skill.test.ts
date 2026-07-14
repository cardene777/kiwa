import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * nextjs skill test — nextjs lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('nextjs skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('nextjs.setup', JSON.stringify({ target: 'primary' }));
    spy.record('nextjs.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'nextjs.setup');
    assertToolCalled(spy, 'nextjs.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('nextjs.setup', '{}');
    spy.record('nextjs.execute', '{}');
    spy.record('nextjs.teardown', '{}');
    assertToolCallOrder(spy, ['nextjs.setup', 'nextjs.execute', 'nextjs.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('nextjs.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'nextjs.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('nextjs.execute', '{}');
    spy.record('nextjs.execute', '{}');
    assertToolCalled(spy, 'nextjs.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('nextjs.execute', '{}');
    spy.record('nextjs.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'nextjs.retry');
    assertToolCallOrder(spy, ['nextjs.execute', 'nextjs.retry']);
  });
});
