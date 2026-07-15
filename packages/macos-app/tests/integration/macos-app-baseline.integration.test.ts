/**
 * integration test — macos-app の end-to-end workflow (env 立上 → interaction → a11y capture →
 * screencap → notification schedule) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createMacAppEnv,
  simulateUserInteraction,
  captureAccessibilityTree,
  mockScreencap,
  emitUserNotification,
} from '../../src/index.js';

describe('macos-app integration — user workflow end-to-end', () => {
  it('T-INT-M-001 swiftui env で click → screencap → a11y capture の full workflow', () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    const click = simulateUserInteraction(env, { type: 'click', target: 'action' });
    expect(click.dispatched).toBe(true);
    const cap = mockScreencap(env);
    expect(cap.bytes.length).toBeGreaterThan(0);
    const tree = captureAccessibilityTree(env);
    expect(tree.totalNodes).toBe(3);
  });

  it('T-INT-M-002 appkit env で NSButton click + Enter keypress の responder chain 相当', () => {
    const env = createMacAppEnv({ mode: 'appkit' });
    const click = simulateUserInteraction(env, { type: 'click', target: 'button1' });
    const key = simulateUserInteraction(env, { type: 'keypress', target: 'button1', key: 'Enter' });
    expect(click.dispatched && key.dispatched).toBe(true);
    expect(env.eventLog.length).toBe(2);
  });

  it('T-INT-M-003 存在しない target への interaction は reject + reason 明示', () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    const result = simulateUserInteraction(env, { type: 'click', target: 'missing-id' });
    expect(result.dispatched).toBe(false);
    expect(result.targetFound).toBe(false);
    expect(result.reason).toContain('target not found');
  });

  it('T-INT-M-004 notification schedule + eventLog + bundleId が env と一致', () => {
    const env = createMacAppEnv({ mode: 'swiftui', bundleId: 'com.example.myapp' });
    const notif = emitUserNotification(env, { title: 'Hi', body: 'Hello' });
    expect(notif.scheduled).toBe(true);
    expect(notif.bundleId).toBe('com.example.myapp');
    expect(env.eventLog[0]!.kind).toContain('notification:scheduled');
  });

  it('T-INT-M-005 screencap region 指定 = deterministic hash byte で reproducible', () => {
    const envA = createMacAppEnv({ mode: 'swiftui' });
    const envB = createMacAppEnv({ mode: 'swiftui' });
    const capA = mockScreencap(envA, { region: { x: 10, y: 20, width: 100, height: 100 } });
    const capB = mockScreencap(envB, { region: { x: 10, y: 20, width: 100, height: 100 } });
    // same region → same hash bytes (bytes at magic+0..15 should equal)
    for (let i = 0; i < 16; i += 1) {
      expect(capA.bytes[8 + i]).toBe(capB.bytes[8 + i]);
    }
  });
});

describe('v2.1 resilience integration', () => {
  it('T-INT-V21-001 batchOperate runs items in parallel with per-item error isolation', async () => {
    const { batchOperate } = await import('../../src/index.js');
    const results = await batchOperate(
      [{ name: 'a', input: 1 }, { name: 'b', input: 2 }, { name: 'c', input: 3 }],
      async (item) => {
        if (item.name === 'b') throw new Error('bad');
        return (item.input as number) * 10;
      },
    );
    expect(results.filter((r) => r.ok).length).toBe(2);
    expect(results.filter((r) => !r.ok).length).toBe(1);
  });

  it('T-INT-V21-002 withRetry + withTimeout can be composed', async () => {
    const { withRetry, withTimeout } = await import('../../src/index.js');
    let calls = 0;
    const slow = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return 'done';
    };
    const wrapped = withRetry(withTimeout(slow, { ms: 5 }), { maxAttempts: 2 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
    expect(calls).toBe(2);
  });

  it('T-INT-V21-003 withObservability fires start/success hooks in order', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => 'ok', {
      onStart: () => events.push('start'),
      onSuccess: () => events.push('success'),
    });
    await wrapped();
    expect(events).toEqual(['start', 'success']);
  });

  it('T-INT-V21-004 withObservability captures error path', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => { throw new Error('nope'); }, {
      onStart: () => events.push('start'),
      onError: () => events.push('error'),
    });
    await expect(wrapped()).rejects.toThrow('nope');
    expect(events).toEqual(['start', 'error']);
  });

  it('T-INT-V21-005 withRetry retryOn callback conditionally suppresses retry', async () => {
    const { withRetry } = await import('../../src/index.js');
    let calls = 0;
    const wrapped = withRetry(async () => {
      calls += 1;
      throw new Error('fatal');
    }, { maxAttempts: 5, retryOn: (err) => (err as Error).message !== 'fatal' });
    await expect(wrapped()).rejects.toThrow('fatal');
    expect(calls).toBe(1);
  });
});
