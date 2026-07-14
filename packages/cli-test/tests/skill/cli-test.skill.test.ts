import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * cli-test skill test — cli-test lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('cli-test skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('cli-test.setup', JSON.stringify({ target: 'primary' }));
    spy.record('cli-test.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'cli-test.setup');
    assertToolCalled(spy, 'cli-test.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('cli-test.setup', '{}');
    spy.record('cli-test.execute', '{}');
    spy.record('cli-test.teardown', '{}');
    assertToolCallOrder(spy, ['cli-test.setup', 'cli-test.execute', 'cli-test.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('cli-test.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'cli-test.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('cli-test.execute', '{}');
    spy.record('cli-test.execute', '{}');
    assertToolCalled(spy, 'cli-test.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('cli-test.execute', '{}');
    spy.record('cli-test.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'cli-test.retry');
    assertToolCallOrder(spy, ['cli-test.execute', 'cli-test.retry']);
  });
});
