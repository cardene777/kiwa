import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * edge skill test — edge lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('edge skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('edge.setup', JSON.stringify({ target: 'primary' }));
    spy.record('edge.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'edge.setup');
    assertToolCalled(spy, 'edge.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('edge.setup', '{}');
    spy.record('edge.execute', '{}');
    spy.record('edge.teardown', '{}');
    assertToolCallOrder(spy, ['edge.setup', 'edge.execute', 'edge.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('edge.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'edge.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('edge.execute', '{}');
    spy.record('edge.execute', '{}');
    assertToolCalled(spy, 'edge.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('edge.execute', '{}');
    spy.record('edge.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'edge.retry');
    assertToolCallOrder(spy, ['edge.execute', 'edge.retry']);
  });
});
