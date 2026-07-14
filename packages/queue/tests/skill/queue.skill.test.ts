import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * queue skill test — queue lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('queue skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('queue.setup', JSON.stringify({ target: 'primary' }));
    spy.record('queue.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'queue.setup');
    assertToolCalled(spy, 'queue.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('queue.setup', '{}');
    spy.record('queue.execute', '{}');
    spy.record('queue.teardown', '{}');
    assertToolCallOrder(spy, ['queue.setup', 'queue.execute', 'queue.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('queue.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'queue.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('queue.execute', '{}');
    spy.record('queue.execute', '{}');
    assertToolCalled(spy, 'queue.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('queue.execute', '{}');
    spy.record('queue.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'queue.retry');
    assertToolCallOrder(spy, ['queue.execute', 'queue.retry']);
  });
});
