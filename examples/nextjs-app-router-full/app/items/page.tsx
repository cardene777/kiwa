// items/page.tsx — RSC thin wrapper。 cookies header を sessionGetter として
// pure RSC (ItemsPageRSC) に流す。 結果の RscNode を React 要素に変換する。

import { createElement, type ReactNode } from 'react';
import { cookies } from 'next/headers';
import { ItemsPageRSC } from './_kiwa/items-rsc';
import { CreateItemForm } from './create-form';

interface PageProps {
  searchParams: Promise<{ tag?: string }>;
}

// kiwa pure RSC が返す { type, props, key } 形式の RscNode を React 要素に再変換する。
// createElement で動的 type を受け、 children を再帰的に変換する。
function rscNodeToReact(node: unknown): ReactNode {
  if (node === null || typeof node === 'undefined') return null;
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => <span key={i}>{rscNodeToReact(child)}</span>);
  }
  if (typeof node === 'object' && node !== null && 'type' in node && 'props' in node) {
    const el = node as { type: string; props: Record<string, unknown>; key: string | null };
    const { children: childrenRaw, ...restProps } = el.props;
    const children = typeof childrenRaw === 'undefined' ? undefined : rscNodeToReact(childrenRaw);
    return createElement(el.type, { ...restProps, key: el.key ?? undefined }, children);
  }
  return null;
}

export default async function ItemsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const all = cookieStore.getAll();
  const cookieHeader = all.length > 0 ? all.map((c) => `${c.name}=${c.value}`).join('; ') : null;
  const rscNode = await ItemsPageRSC({
    searchParams: sp,
    sessionGetter: () => cookieHeader,
  });
  return (
    <>
      {rscNodeToReact(rscNode)}
      <CreateItemForm />
    </>
  );
}
