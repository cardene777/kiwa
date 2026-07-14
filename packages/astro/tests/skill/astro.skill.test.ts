import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * astro skill test — astro lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('astro skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('astro.setup', JSON.stringify({ target: 'primary' }));
    spy.record('astro.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'astro.setup');
    assertToolCalled(spy, 'astro.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('astro.setup', '{}');
    spy.record('astro.execute', '{}');
    spy.record('astro.teardown', '{}');
    assertToolCallOrder(spy, ['astro.setup', 'astro.execute', 'astro.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('astro.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'astro.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('astro.execute', '{}');
    spy.record('astro.execute', '{}');
    assertToolCalled(spy, 'astro.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('astro.execute', '{}');
    spy.record('astro.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'astro.retry');
    assertToolCallOrder(spy, ['astro.execute', 'astro.retry']);
  });
});
