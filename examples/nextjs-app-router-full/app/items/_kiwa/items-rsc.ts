// items-rsc.ts — async React Server Component の pure 実装。
//
// 実 Next.js では app/items/page.tsx が next/headers の cookies() を読んで
// この関数を呼ぶ。 kiwa renderServerComponent では sessionGetter を injection
// することで cookies dep を回避する。

import type { RscNode } from '@kiwa-lab/nextjs';
import { resolveUserFromCookieHeader, type SessionUser } from '../../../lib/_kiwa/auth';

export interface Item {
  readonly id: number;
  readonly name: string;
  readonly tags: ReadonlyArray<string>;
}

const ITEMS: ReadonlyArray<Item> = [
  { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
  { id: 2, name: 'nextjs', tags: ['framework', 'react'] },
  { id: 3, name: 'app-router', tags: ['runtime', 'react'] },
];

export interface ItemsPageProps {
  readonly searchParams?: { readonly tag?: string };
  readonly sessionGetter?: () => string | null;
}

export async function ItemsPageRSC(props: ItemsPageProps): Promise<RscNode> {
  const cookieHeader = typeof props.sessionGetter === 'function' ? props.sessionGetter() : null;
  const user: SessionUser | null = resolveUserFromCookieHeader(cookieHeader);

  if (user === null) {
    return {
      type: 'main',
      key: null,
      props: {
        children: [
          { type: 'h1', key: null, props: { children: 'Sign in required' } },
          { type: 'p', key: null, props: { children: 'Please visit /login to continue.' } },
        ],
      },
    };
  }

  if (user.role === 'banned') {
    return {
      type: 'main',
      key: null,
      props: {
        'data-testid': 'banned',
        children: [
          { type: 'h1', key: null, props: { children: 'Forbidden' } },
          { type: 'p', key: null, props: { children: 'Your account is banned.' } },
        ],
      },
    };
  }

  let filtered: ReadonlyArray<Item> = ITEMS;
  const tag = props.searchParams?.tag;
  if (typeof tag === 'string' && tag.length > 0) {
    filtered = ITEMS.filter((item) => item.tags.includes(tag));
  }

  return {
    type: 'main',
    key: null,
    props: {
      'data-testid': 'items-rsc',
      children: [
        { type: 'h1', key: null, props: { children: 'kiwa Next.js PoC' } },
        { type: 'p', key: null, props: { children: `signed in as: ${user.id} (${filtered.length} items)` } },
        {
          type: 'ul',
          key: null,
          props: {
            children: filtered.map((item) => ({
              type: 'li',
              key: String(item.id),
              props: { children: `${item.name} — ${item.tags.join(', ')}` },
            })),
          },
        },
      ],
    },
  };
}
