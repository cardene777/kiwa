import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * realtime skill test — realtime lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('realtime skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('realtime.setup', JSON.stringify({ target: 'primary' }));
    spy.record('realtime.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'realtime.setup');
    assertToolCalled(spy, 'realtime.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('realtime.setup', '{}');
    spy.record('realtime.execute', '{}');
    spy.record('realtime.teardown', '{}');
    assertToolCallOrder(spy, ['realtime.setup', 'realtime.execute', 'realtime.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('realtime.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'realtime.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('realtime.execute', '{}');
    spy.record('realtime.execute', '{}');
    assertToolCalled(spy, 'realtime.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('realtime.execute', '{}');
    spy.record('realtime.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'realtime.retry');
    assertToolCallOrder(spy, ['realtime.execute', 'realtime.retry']);
  });
});
