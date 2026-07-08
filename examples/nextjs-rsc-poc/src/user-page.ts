// RSC test PoC for kiwa (Issue #494).
//
// In a real Next.js app this file lives at app/users/[slug]/page.tsx and
// starts with `async function UserPage({ params })`. We omit JSX syntax
// here and use a small element factory so the PoC stays a pure Vitest
// workspace; the runtime element shape is identical to React's.

import { NOT_FOUND_SYMBOL, type RscNode, type RscElement } from '@kiwa/nextjs';

interface RscProps {
  readonly [key: string]: unknown;
}

function el(type: string, props: RscProps = {}, ...children: RscNode[]): RscElement {
  return {
    type,
    key: null,
    props: { ...props, children: children.length === 1 ? children[0] : children },
  };
}

interface User {
  readonly id: number;
  readonly name: string;
  readonly slug: string;
}

const USERS: User[] = [
  { id: 1, name: 'Alice', slug: 'alice' },
  { id: 2, name: 'Bob', slug: 'bob' },
];

async function findUserBySlug(slug: string): Promise<User | undefined> {
  // In real code this would be a DB query. The PoC pretends it's async.
  await Promise.resolve();
  return USERS.find((u) => u.slug === slug);
}

export interface UserPageProps {
  readonly params: { readonly slug: string };
}

export async function UserPage({ params }: UserPageProps): Promise<RscNode> {
  const user = await findUserBySlug(params.slug);
  if (!user) {
    throw { [NOT_FOUND_SYMBOL]: true } as const;
  }
  return el(
    'main',
    { 'data-testid': 'user-page' },
    el('h1', {}, user.name),
    el('p', { 'data-testid': 'user-id' }, `id=${user.id}`),
    el('p', { 'data-testid': 'user-slug' }, `slug=${user.slug}`),
  );
}

export interface UserListProps {
  readonly searchParams?: { readonly q?: string };
}

export async function UserList({ searchParams }: UserListProps): Promise<RscNode> {
  await Promise.resolve();
  const q = searchParams?.q?.toLowerCase() ?? '';
  const filtered = q.length === 0 ? USERS : USERS.filter((u) => u.name.toLowerCase().includes(q));
  return el(
    'ul',
    { 'data-testid': 'user-list' },
    ...filtered.map((u) => el('li', { 'data-testid': `user-${u.slug}` }, u.name)),
  );
}
