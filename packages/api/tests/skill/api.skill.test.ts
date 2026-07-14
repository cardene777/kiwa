import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * api skill test — api lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('api skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('api.setup', JSON.stringify({ target: 'primary' }));
    spy.record('api.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'api.setup');
    assertToolCalled(spy, 'api.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('api.setup', '{}');
    spy.record('api.execute', '{}');
    spy.record('api.teardown', '{}');
    assertToolCallOrder(spy, ['api.setup', 'api.execute', 'api.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('api.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'api.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('api.execute', '{}');
    spy.record('api.execute', '{}');
    assertToolCalled(spy, 'api.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('api.execute', '{}');
    spy.record('api.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'api.retry');
    assertToolCallOrder(spy, ['api.execute', 'api.retry']);
  });
});
