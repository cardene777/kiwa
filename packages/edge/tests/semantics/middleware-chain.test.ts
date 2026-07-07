import { describe, expect, it } from 'vitest';
import {
  completeMiddleware,
  enterMiddleware,
  platformEventName,
  rewriteRequest,
  shortCircuit,
  startMiddlewareChain,
  type EdgePlatform,
} from '../../src/index.js';

const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];

describe('middleware-chain axis — 3 platform', () => {
  it.each(platforms)('%s: full pipeline auth → rewrite → cache → transform', (platform) => {
    const chain = startMiddlewareChain({
      platform,
      stages: ['auth', 'rewrite', 'cache', 'transform'],
    });
    const auth = enterMiddleware(chain);
    expect(auth.state).toBe('running');
    expect(auth.neutralEvent).toBe('middleware.entered');
    expect(auth.platformEvent).toBe(platformEventName(platform, 'middleware.entered'));
    expect(auth.metadata).toMatchObject({ stage: 'auth', index: 0, total: 4 });

    enterMiddleware(chain);
    enterMiddleware(chain);
    enterMiddleware(chain);
    const done = completeMiddleware(chain);
    expect(done.state).toBe('completed');
    expect(done.neutralEvent).toBe('middleware.completed');
    expect(done.metadata).toMatchObject({ totalStages: 4 });
  });

  it('rewriteRequest records rewrittenUrl in metadata and session', () => {
    const chain = startMiddlewareChain({ platform: 'cloudflare', stages: ['rewrite'] });
    enterMiddleware(chain);
    const step = rewriteRequest(chain, { url: '/ja/products/1' });
    expect(step.neutralEvent).toBe('middleware.rewritten');
    expect(step.metadata).toMatchObject({ rewrittenUrl: '/ja/products/1', stage: 'rewrite' });
    expect(chain.rewrittenUrl).toBe('/ja/products/1');
  });

  it.each(platforms)('%s: short-circuit stops downstream stages', (platform) => {
    const chain = startMiddlewareChain({
      platform,
      stages: ['auth', 'rewrite', 'cache', 'transform'],
    });
    enterMiddleware(chain);
    const cut = shortCircuit(chain, { reason: 'auth-rejected' });
    expect(cut.state).toBe('short-circuited');
    expect(cut.neutralEvent).toBe('middleware.short-circuited');
    expect(cut.metadata).toMatchObject({
      stage: 'auth',
      reason: 'auth-rejected',
      skippedCount: 3,
    });
    expect(() => enterMiddleware(chain)).toThrow(/short-circuited/);
    expect(() => completeMiddleware(chain)).toThrow(/short-circuited/);
  });

  it('rejects rewriteRequest when chain not running', () => {
    const chain = startMiddlewareChain({ platform: 'vercel', stages: ['rewrite'] });
    expect(() => rewriteRequest(chain, { url: '/a' })).toThrow(/idle/);
  });

  it('rejects shortCircuit when chain not running', () => {
    const chain = startMiddlewareChain({ platform: 'deno', stages: ['auth'] });
    expect(() => shortCircuit(chain, { reason: 'x' })).toThrow(/idle/);
  });

  it('rejects enterMiddleware past the last stage', () => {
    const chain = startMiddlewareChain({ platform: 'cloudflare', stages: ['auth'] });
    enterMiddleware(chain);
    expect(() => enterMiddleware(chain)).toThrow(/no more stages/);
  });

  it('rejects completeMiddleware twice', () => {
    const chain = startMiddlewareChain({ platform: 'vercel', stages: ['auth'] });
    enterMiddleware(chain);
    completeMiddleware(chain);
    expect(() => completeMiddleware(chain)).toThrow(/already completed/);
  });

  it('accumulates full history in order', () => {
    const chain = startMiddlewareChain({
      platform: 'deno',
      stages: ['auth', 'cache', 'transform'],
    });
    enterMiddleware(chain);
    enterMiddleware(chain);
    rewriteRequest(chain, { url: '/ja' });
    enterMiddleware(chain);
    completeMiddleware(chain);
    expect(chain.history.map((s) => s.neutralEvent)).toEqual([
      'middleware.entered',
      'middleware.entered',
      'middleware.rewritten',
      'middleware.entered',
      'middleware.completed',
    ]);
  });
});
