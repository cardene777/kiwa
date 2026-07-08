// items-streaming.ts — RSC streaming + Suspense boundary の pure 実装。
//
// 実 Next.js では app/items/streaming/page.tsx が Suspense でこの async generator
// を ラップして fallback → resolved の 2 phase 遷移を起こす。 kiwa の
// setupNextRscEnv はこの async generator を直接 iterate して chunk 配列 +
// fallback + resolved + errorBoundary を deterministic に capture する。
//
// 本 module は外部 fetch を simulate する slow data source として
// async generator を export し、 PoC test で setupNextRscEnv に流す。

import type { RscNode } from '@kiwa/nextjs';

export interface StreamingItem {
  readonly id: number;
  readonly name: string;
}

const SOURCE_ITEMS: ReadonlyArray<StreamingItem> = [
  { id: 1, name: 'kiwa' },
  { id: 2, name: 'nextjs' },
  { id: 3, name: 'app-router' },
];

export function itemsSkeleton(): RscNode {
  return {
    type: 'div',
    key: null,
    props: {
      'data-testid': 'items-skeleton',
      children: 'loading items…',
    },
  };
}

function partialItemList(items: ReadonlyArray<StreamingItem>): RscNode {
  return {
    type: 'ul',
    key: null,
    props: {
      'data-testid': 'items-partial',
      'data-count': String(items.length),
      children: items.map((it) => ({
        type: 'li',
        key: String(it.id),
        props: { children: `${it.name} (id=${it.id})` },
      })),
    },
  };
}

function finalItemList(items: ReadonlyArray<StreamingItem>): RscNode {
  return {
    type: 'ul',
    key: null,
    props: {
      'data-testid': 'items-final',
      'data-count': String(items.length),
      children: items.map((it) => ({
        type: 'li',
        key: String(it.id),
        props: { children: `${it.name} — id=${it.id}` },
      })),
    },
  };
}

/**
 * Stream items one at a time, then emit the final resolved list. Each yielded
 * chunk represents one Suspense boundary update — the test seam can assert on
 * `env.chunks` order and `env.resolved` equality.
 *
 * Optional `injectErrorAt` causes the generator to throw at the given chunk
 * index, simulating a mid-flight network / backend failure that an
 * `error.tsx` boundary would catch in production.
 */
export async function* streamItems(opts?: {
  injectErrorAt?: number;
}): AsyncGenerator<RscNode, void, unknown> {
  const collected: StreamingItem[] = [];
  for (let i = 0; i < SOURCE_ITEMS.length; i++) {
    if (opts?.injectErrorAt === i) {
      throw new Error(`stream-failure-at-${i}`);
    }
    collected.push(SOURCE_ITEMS[i]!);
    yield partialItemList(collected);
  }
  yield finalItemList(collected);
}
