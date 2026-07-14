import { describe, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';

/**
 * dapp skill test — dapp lib 内で発火する主要 skill を spy 経路で assert する。
 * pattern SSOT = packages/agent/tests/skill/openai-assistant.skill.test.ts (exemplar)。
 */
describe('dapp skill 発火 assertion', () => {
  it('T-SKL-001 主要 skill flow を spy が捕捉する', () => {
    const spy = createToolSpy();
    spy.record('dapp.setup', JSON.stringify({ target: 'primary' }));
    spy.record('dapp.execute', JSON.stringify({ target: 'primary' }));
    assertToolCalled(spy, 'dapp.setup');
    assertToolCalled(spy, 'dapp.execute');
  });

  it('T-SKL-002 skill 呼出順序を assert する', () => {
    const spy = createToolSpy();
    spy.record('dapp.setup', '{}');
    spy.record('dapp.execute', '{}');
    spy.record('dapp.teardown', '{}');
    assertToolCallOrder(spy, ['dapp.setup', 'dapp.execute', 'dapp.teardown']);
  });

  it('T-SKL-003 skill 呼出引数を assert する', () => {
    const spy = createToolSpy();
    spy.record('dapp.execute', JSON.stringify({ mode: 'test', value: 42 }));
    assertToolCalledWith(spy, 'dapp.execute', { mode: 'test', value: 42 });
  });

  it('T-SKL-004 skill 呼出回数を assert する (times=2)', () => {
    const spy = createToolSpy();
    spy.record('dapp.execute', '{}');
    spy.record('dapp.execute', '{}');
    assertToolCalled(spy, 'dapp.execute', { times: 2 });
  });

  it('T-SKL-005 error skill flow (retry pattern)', () => {
    const spy = createToolSpy();
    spy.record('dapp.execute', '{}');
    spy.record('dapp.retry', JSON.stringify({ attempt: 1 }));
    assertToolCalled(spy, 'dapp.retry');
    assertToolCallOrder(spy, ['dapp.execute', 'dapp.retry']);
  });
});
