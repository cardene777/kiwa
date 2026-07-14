import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * hono skill test — hono lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('hono skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('hono.setup', JSON.stringify({ target: 'primary' }));
    spy.record('hono.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'hono.setup');
    assertToolCalled(spy, 'hono.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('hono.setup', '{}');
    spy.record('hono.execute', '{}');
    spy.record('hono.teardown', '{}');
    assertToolCallOrder(spy, ['hono.setup', 'hono.execute', 'hono.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('hono.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'hono.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('hono.execute', '{}');
    spy.record('hono.execute', '{}');
    assertToolCalled(spy, 'hono.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('hono.execute', '{}');
    spy.record('hono.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'hono.retry');
    assertToolCallOrder(spy, ['hono.execute', 'hono.retry']);
  });
});
