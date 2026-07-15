/**
 * fidelity test — createRubyAppEnv + dispatch API が想定通りの挙動を示すことを 5 case で
 * 検証。 mock (kiwa) vs reference impl (仕様通り動く TypeScript の minimal 実装) の一致を
 * assertFidelity で確認。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createRubyAppEnv,
  dispatchGenericRequest,
  dispatchRailsRequest,
  renderERB,
  captureActiveRecord,
} from '../../src/index.js';

describe('ruby app fidelity vs reference impl', () => {
  it('dispatchGenericRequest = matched route 経由で handler 実行結果を返す', async () => {
    const env = createRubyAppEnv({
      framework: 'sinatra',
      routes: [
        {
          method: 'GET',
          path: '/ping',
          handler: () => ({ status: 200, body: 'pong', headers: {}, cookies: {}, session: {} }),
        },
      ],
    });
    const result = await assertFidelity({
      mockFn: async () => (await dispatchGenericRequest(env, { method: 'GET', path: '/ping' })).response.body,
      realFn: async () => 'pong',
      cases: [{ name: 'ping', args: [] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('unmatched route = 404 default response', async () => {
    const env = createRubyAppEnv({ framework: 'roda' });
    const result = await dispatchGenericRequest(env, { method: 'GET', path: '/nope' });
    expect(result.matched).toBe(false);
    expect(result.response.status).toBe(404);
  });

  it('rails dispatchRailsRequest = before_action count が chain 通り', async () => {
    const env = createRubyAppEnv({ framework: 'rails' });
    let hits = 0;
    const dispatched = await dispatchRailsRequest(
      env,
      { method: 'GET', path: '/x' },
      {
        beforeActions: [
          () => { hits += 1; },
          () => { hits += 1; },
          () => { hits += 1; },
        ],
        action: async () => ({ status: 200, body: 'ok', headers: {}, cookies: {}, session: {} }),
      },
    );
    expect(dispatched.beforeActionCount).toBe(3);
    expect(hits).toBe(3);
  });

  it('renderERB = variables collect + missing detect', () => {
    const r = renderERB('<b><%= a %></b><i><%= b %></i><s><%= c %></s>', { a: '1', c: '3' });
    expect(r.html).toBe('<b>1</b><i></i><s>3</s>');
    expect(r.variables).toEqual(['a', 'b', 'c']);
    expect(r.missing).toEqual(['b']);
  });

  it('captureActiveRecord = op/model 別 count が正しく集計', () => {
    const env = createRubyAppEnv({ framework: 'rails' });
    env.recordAR({ op: 'find', model: 'User', args: { id: 1 } });
    env.recordAR({ op: 'where', model: 'Post', args: { user_id: 1 } });
    env.recordAR({ op: 'where', model: 'Post', args: { user_id: 1 } });
    const snap = captureActiveRecord(env);
    expect(snap.total).toBe(3);
    expect(snap.byOp.find).toBe(1);
    expect(snap.byOp.where).toBe(2);
    expect(snap.byModel.Post).toBe(2);
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
