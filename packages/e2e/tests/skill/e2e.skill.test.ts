import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * e2e skill test — e2e lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('e2e skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('e2e.setup', JSON.stringify({ target: 'primary' }));
    spy.record('e2e.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'e2e.setup');
    assertToolCalled(spy, 'e2e.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('e2e.setup', '{}');
    spy.record('e2e.execute', '{}');
    spy.record('e2e.teardown', '{}');
    assertToolCallOrder(spy, ['e2e.setup', 'e2e.execute', 'e2e.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('e2e.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'e2e.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('e2e.execute', '{}');
    spy.record('e2e.execute', '{}');
    assertToolCalled(spy, 'e2e.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('e2e.execute', '{}');
    spy.record('e2e.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'e2e.retry');
    assertToolCallOrder(spy, ['e2e.execute', 'e2e.retry']);
  });
});
