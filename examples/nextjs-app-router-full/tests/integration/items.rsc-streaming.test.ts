// kiwa PoC: setupNextRscEnv で RSC streaming + Suspense boundary を test。
//
// items-streaming.ts の async generator (SOURCE_ITEMS を 1 件ずつ + final
// list を yield する 4 chunk source) を setupNextRscEnv に流し、 fallback /
// chunk 順序 / resolved / errorBoundary / timeout の 5 軸を assert する。

import { describe, expect, it } from 'vitest';
import { setupNextRscEnv } from '@kiwa-lab/nextjs';
import { streamItems, itemsSkeleton } from '../../app/items/_kiwa/items-streaming.js';

describe('items-streaming via @kiwa-lab/nextjs setupNextRscEnv', () => {
  it('T-NS-301: 正常 stream — fallback + 4 chunk + resolved=final list', async () => {
    const fallback = itemsSkeleton();
    const env = await setupNextRscEnv({
      dataSource: streamItems(),
      suspenseFallback: fallback,
    });
    expect(env.errorBoundary).toBeNull();
    expect(env.timedOut).toBe(false);
    expect(env.fallback).toBe(fallback);
    // 1 fallback + 3 partial + 1 final = 5 chunks
    expect(env.chunks).toHaveLength(5);
    expect(env.chunks[0]).toBe(fallback);
    // final chunk は items-final variant
    const resolved = env.resolved as { props?: { 'data-testid'?: string } } | null;
    expect(resolved?.props?.['data-testid']).toBe('items-final');
  });

  it('T-NS-302: Suspense fallback exposed as chunk 0 and env.fallback', async () => {
    const fallback = itemsSkeleton();
    const env = await setupNextRscEnv({
      dataSource: streamItems(),
      suspenseFallback: fallback,
    });
    expect(env.fallback).toBe(fallback);
    expect(env.chunks[0]).toBe(fallback);
    const first = env.chunks[0] as { props?: { 'data-testid'?: string } };
    expect(first.props?.['data-testid']).toBe('items-skeleton');
  });

  it('T-NS-303: 中盤エラー — chunk 2 で throw → errorBoundary に捕捉、 resolved=null', async () => {
    const env = await setupNextRscEnv({
      dataSource: streamItems({ injectErrorAt: 1 }),
      suspenseFallback: itemsSkeleton(),
    });
    expect(env.errorBoundary).not.toBeNull();
    expect((env.errorBoundary?.error as Error).message).toBe('stream-failure-at-1');
    expect(env.resolved).toBeNull();
    // fallback + 1 partial が collected されてから throw
    expect(env.chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('T-NS-304: streamingTimeout で slow stream を fail fast', async () => {
    async function* slowSource(): AsyncGenerator<typeof itemsSkeleton extends () => infer R ? R : never, void, unknown> {
      await new Promise((resolve) => setTimeout(resolve, 200));
      yield itemsSkeleton();
    }
    const env = await setupNextRscEnv({
      dataSource: slowSource(),
      streamingTimeout: 20,
    });
    expect(env.timedOut).toBe(true);
    expect(env.resolved).toBeNull();
  });

  it('T-NS-305: chunk 順序 ... partial の data-count が monotonic に増加', async () => {
    const env = await setupNextRscEnv({ dataSource: streamItems() });
    // chunks は fallback なしの場合 4 (3 partial + 1 final)
    expect(env.chunks).toHaveLength(4);
    const counts = (env.chunks as Array<{ props?: { 'data-count'?: string } }>).map((c) =>
      Number(c.props?.['data-count']),
    );
    // 1, 2, 3, 3 (final は最終 collected と同件数)
    expect(counts).toEqual([1, 2, 3, 3]);
  });
});
