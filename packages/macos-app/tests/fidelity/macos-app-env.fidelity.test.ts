/**
 * fidelity test — createMacAppEnv + accessibility + interaction が reference impl (単純な
 * in-memory tree + event log) と同じ挙動を返すことを検証。 5 case = mode 別 default view /
 * accessibility role mapping / interaction dispatch / disabled block / event log ordering。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createMacAppEnv,
  simulateUserInteraction,
  captureAccessibilityTree,
} from '../../src/index.js';

function referenceInteractionResult(targetFound: boolean, enabled: boolean) {
  if (!targetFound) return { dispatched: false, handled: false };
  if (!enabled) return { dispatched: false, handled: false };
  return { dispatched: true, handled: true };
}

describe('macos-app env fidelity vs reference impl', () => {
  it('swiftui mode default view = VStack + Text + Button', () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    expect(env.rootView.type).toBe('VStack');
    expect(env.rootView.children.length).toBe(2);
    expect(env.rootView.children[0]!.type).toBe('Text');
    expect(env.rootView.children[1]!.type).toBe('Button');
  });

  it('appkit mode default view = NSView + NSTextField + NSButton', () => {
    const env = createMacAppEnv({ mode: 'appkit' });
    expect(env.rootView.type).toBe('NSView');
    expect(env.rootView.children[0]!.type).toBe('NSTextField');
    expect(env.rootView.children[1]!.type).toBe('NSButton');
  });

  it('accessibility role mapping = mock vs reference role table 一致', async () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    const tree = captureAccessibilityTree(env);
    const result = await assertFidelity({
      mockFn: async (id: string) => {
        const node = tree.root.children.find((c) => c.id === id);
        return node?.role;
      },
      realFn: async (id: string) => {
        const map: Record<string, string> = { title: 'AXStaticText', action: 'AXButton' };
        return map[id];
      },
      cases: [{ name: 'text = AXStaticText', args: ['title'] }, { name: 'button = AXButton', args: ['action'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('interaction dispatch = 有効 target で mock/reference が同一結果', async () => {
    const env = createMacAppEnv({ mode: 'swiftui' });
    const mock = simulateUserInteraction(env, { type: 'click', target: 'action' });
    const ref = referenceInteractionResult(true, true);
    expect(mock.dispatched).toBe(ref.dispatched);
    expect(mock.handled).toBe(ref.handled);
  });

  it('event log ordering = interaction を N 回発行して order が保持される', () => {
    const env = createMacAppEnv({ mode: 'appkit' });
    simulateUserInteraction(env, { type: 'click', target: 'button1' });
    simulateUserInteraction(env, { type: 'keypress', target: 'label1', key: 'Enter' });
    simulateUserInteraction(env, { type: 'focus', target: 'button1' });
    expect(env.eventLog.length).toBe(3);
    expect(env.eventLog[0]!.kind).toBe('click:button1');
    expect(env.eventLog[2]!.kind).toBe('focus:button1');
  });
});

describe('v2.1 resilience primitives (generic)', () => {
  it('withRetry recovers after transient failure and eventually succeeds', async () => {
    const { withRetry } = await import('../../src/index.js');
    let attempts = 0;
    const wrapped = withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5 });
    expect(await wrapped()).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('withTimeout rejects after ms elapsed', async () => {
    const { withTimeout } = await import('../../src/index.js');
    const wrapped = withTimeout(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'never';
    }, { ms: 5 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
  });

  it('withRateLimit throws when exceeding maxRequests', async () => {
    const { withRateLimit } = await import('../../src/index.js');
    const wrapped = withRateLimit(async () => 'ok', { maxRequests: 2, windowMs: 1000 });
    await wrapped();
    await wrapped();
    await expect(wrapped()).rejects.toThrow(/rate limit/);
  });

  it('withCircuitBreaker opens after failureThreshold and rejects further calls', async () => {
    const { withCircuitBreaker } = await import('../../src/index.js');
    const wrapped = withCircuitBreaker(async () => { throw new Error('down'); }, {
      failureThreshold: 2, resetMs: 1000,
    });
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('circuit breaker open');
  });

  it('withIdempotencyKey returns cached result on duplicate key', async () => {
    const { withIdempotencyKey } = await import('../../src/index.js');
    let counter = 0;
    const wrapped = withIdempotencyKey(async (_key: string) => {
      counter += 1;
      return { id: counter };
    });
    const a = await wrapped('K');
    const b = await wrapped('K');
    expect(a.id).toBe(b.id);
    expect(counter).toBe(1);
  });
});
