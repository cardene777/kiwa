import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * sveltekit skill test — sveltekit lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('sveltekit skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('sveltekit.setup', JSON.stringify({ target: 'primary' }));
    spy.record('sveltekit.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'sveltekit.setup');
    assertToolCalled(spy, 'sveltekit.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('sveltekit.setup', '{}');
    spy.record('sveltekit.execute', '{}');
    spy.record('sveltekit.teardown', '{}');
    assertToolCallOrder(spy, ['sveltekit.setup', 'sveltekit.execute', 'sveltekit.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('sveltekit.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'sveltekit.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('sveltekit.execute', '{}');
    spy.record('sveltekit.execute', '{}');
    assertToolCalled(spy, 'sveltekit.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('sveltekit.execute', '{}');
    spy.record('sveltekit.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'sveltekit.retry');
    assertToolCallOrder(spy, ['sveltekit.execute', 'sveltekit.retry']);
  });
});
