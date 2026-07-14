import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * fresh skill test — fresh lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('fresh skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('fresh.setup', JSON.stringify({ target: 'primary' }));
    spy.record('fresh.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'fresh.setup');
    assertToolCalled(spy, 'fresh.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('fresh.setup', '{}');
    spy.record('fresh.execute', '{}');
    spy.record('fresh.teardown', '{}');
    assertToolCallOrder(spy, ['fresh.setup', 'fresh.execute', 'fresh.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('fresh.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'fresh.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('fresh.execute', '{}');
    spy.record('fresh.execute', '{}');
    assertToolCalled(spy, 'fresh.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('fresh.execute', '{}');
    spy.record('fresh.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'fresh.retry');
    assertToolCallOrder(spy, ['fresh.execute', 'fresh.retry']);
  });
});
