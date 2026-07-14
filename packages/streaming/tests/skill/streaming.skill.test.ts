import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * streaming skill test — streaming lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('streaming skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('streaming.setup', JSON.stringify({ target: 'primary' }));
    spy.record('streaming.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'streaming.setup');
    assertToolCalled(spy, 'streaming.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('streaming.setup', '{}');
    spy.record('streaming.execute', '{}');
    spy.record('streaming.teardown', '{}');
    assertToolCallOrder(spy, ['streaming.setup', 'streaming.execute', 'streaming.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('streaming.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'streaming.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('streaming.execute', '{}');
    spy.record('streaming.execute', '{}');
    assertToolCalled(spy, 'streaming.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('streaming.execute', '{}');
    spy.record('streaming.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'streaming.retry');
    assertToolCallOrder(spy, ['streaming.execute', 'streaming.retry']);
  });
});
