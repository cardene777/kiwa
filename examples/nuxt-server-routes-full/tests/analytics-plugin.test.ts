// kiwa unit test for server/plugins/_kiwa/analytics-plugin.ts
// — invokes the pure plugin factory through @kiwa/nuxt's invokeNitroPlugin.
// hook 登録 + payload mutation + handler error isolation + logger spy 全部 cover。
// 実 Nitro 起動なしで lifecycle hook を任意 payload で fire できる。

import { describe, expect, it, vi } from 'vitest';
import { invokeNitroPlugin } from '@kiwa/nuxt';
import { createAnalyticsPlugin, type AnalyticsContext } from '../server/plugins/_kiwa/analytics-plugin.js';

function makeCtx(): { ctx: AnalyticsContext; infoSpy: ReturnType<typeof vi.fn>; errorSpy: ReturnType<typeof vi.fn> } {
  const infoSpy = vi.fn();
  const errorSpy = vi.fn();
  let counter = 0;
  const ctx: AnalyticsContext = {
    logger: { info: infoSpy, error: errorSpy },
    generateRequestId: () => `req-${++counter}`,
  };
  return { ctx, infoSpy, errorSpy };
}

describe('analyticsPlugin via @kiwa/nuxt invokeNitroPlugin', () => {
  it('T-NF-201: setup で 3 hook (request / beforeResponse / error) が registered される', async () => {
    const { ctx } = makeCtx();
    const result = await invokeNitroPlugin({ plugin: createAnalyticsPlugin(ctx) });
    const names = result.registered.map((r) => r.name).sort();
    expect(names).toEqual(['beforeResponse', 'error', 'request']);
    expect(result.error).toBeUndefined();
  });

  it('T-NF-202: request hook が payload.context に requestId と startedAt を注入', async () => {
    const { ctx, infoSpy } = makeCtx();
    const result = await invokeNitroPlugin({ plugin: createAnalyticsPlugin(ctx) });
    const payload: { method: string; url: string; context?: Record<string, unknown> } = {
      method: 'GET',
      url: '/api/items',
    };
    await result.callHook('request', payload);
    expect(payload.context?.requestId).toBe('req-1');
    expect(typeof payload.context?.startedAt).toBe('number');
    expect(infoSpy).toHaveBeenCalledWith('request.start', expect.objectContaining({ requestId: 'req-1', method: 'GET' }));
  });

  it('T-NF-203: beforeResponse hook が elapsedMs を log info に渡す', async () => {
    const { ctx, infoSpy } = makeCtx();
    const result = await invokeNitroPlugin({ plugin: createAnalyticsPlugin(ctx) });
    const payload = {
      context: { requestId: 'req-1', startedAt: Date.now() - 50 },
      status: 200,
    };
    await result.callHook('beforeResponse', payload);
    const lastCall = infoSpy.mock.calls.find((c) => c[0] === 'request.end');
    expect(lastCall?.[1]).toMatchObject({ requestId: 'req-1', status: 200 });
    expect(lastCall?.[1].elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('T-NF-204: error hook が error.message を log error に渡す', async () => {
    const { ctx, errorSpy } = makeCtx();
    const result = await invokeNitroPlugin({ plugin: createAnalyticsPlugin(ctx) });
    await result.callHook('error', { error: new Error('boom'), url: '/api/items' });
    expect(errorSpy).toHaveBeenCalledWith('request.error', { url: '/api/items', message: 'boom' });
  });

  it('T-NF-205: handler 内 throw は callHookErrors に capture、 plugin 全体は壊れない', async () => {
    const { ctx } = makeCtx();
    const result = await invokeNitroPlugin({ plugin: createAnalyticsPlugin(ctx) });
    const bogusPayload = {
      get context(): never {
        throw new Error('payload broken');
      },
    };
    await result.callHook('beforeResponse', bogusPayload as never);
    expect(result.callHookErrors).toHaveLength(1);
    expect((result.callHookErrors[0]?.error as Error).message).toBe('payload broken');
  });

  it('T-NF-206: request → beforeResponse の context 引継ぎ (full lifecycle)', async () => {
    const { ctx, infoSpy } = makeCtx();
    const result = await invokeNitroPlugin({ plugin: createAnalyticsPlugin(ctx) });
    const payload: { method: string; url: string; context?: Record<string, unknown> } = {
      method: 'POST',
      url: '/api/items',
    };
    await result.callHook('request', payload);
    const beforePayload: { context: Record<string, unknown>; status: number } = {
      context: payload.context ?? {},
      status: 201,
    };
    await result.callHook('beforeResponse', beforePayload);
    const endCall = infoSpy.mock.calls.find((c) => c[0] === 'request.end');
    expect(endCall?.[1].requestId).toBe('req-1');
    expect(endCall?.[1].status).toBe(201);
  });
});
