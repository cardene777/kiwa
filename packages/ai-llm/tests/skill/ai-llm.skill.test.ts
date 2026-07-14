import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * ai-llm skill test — ai-llm lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('ai-llm skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('ai-llm.setup', JSON.stringify({ target: 'primary' }));
    spy.record('ai-llm.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'ai-llm.setup');
    assertToolCalled(spy, 'ai-llm.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('ai-llm.setup', '{}');
    spy.record('ai-llm.execute', '{}');
    spy.record('ai-llm.teardown', '{}');
    assertToolCallOrder(spy, ['ai-llm.setup', 'ai-llm.execute', 'ai-llm.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('ai-llm.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'ai-llm.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('ai-llm.execute', '{}');
    spy.record('ai-llm.execute', '{}');
    assertToolCalled(spy, 'ai-llm.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('ai-llm.execute', '{}');
    spy.record('ai-llm.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'ai-llm.retry');
    assertToolCallOrder(spy, ['ai-llm.execute', 'ai-llm.retry']);
  });
});
