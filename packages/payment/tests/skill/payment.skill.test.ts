import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * payment skill test — payment lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('payment skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('payment.setup', JSON.stringify({ target: 'primary' }));
    spy.record('payment.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'payment.setup');
    assertToolCalled(spy, 'payment.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('payment.setup', '{}');
    spy.record('payment.execute', '{}');
    spy.record('payment.teardown', '{}');
    assertToolCallOrder(spy, ['payment.setup', 'payment.execute', 'payment.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('payment.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'payment.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('payment.execute', '{}');
    spy.record('payment.execute', '{}');
    assertToolCalled(spy, 'payment.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('payment.execute', '{}');
    spy.record('payment.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'payment.retry');
    assertToolCallOrder(spy, ['payment.execute', 'payment.retry']);
  });
});
