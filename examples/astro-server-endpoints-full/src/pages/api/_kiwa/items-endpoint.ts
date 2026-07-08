// items-endpoint.ts — kiwa-test/astro の invokeEndpoint が direct invoke する pure APIRoute。
//
// Pattern A (Dependency Injection) — 実 Astro 側は src/pages/api/items.ts で
// export const GET = (context) => itemsGetEndpoint(context) として thin wrap する。

import type { APIRoute } from '@kiwa/astro';
import { resolveUser } from '../../../utils/_kiwa/auth.js';

export interface Item {
  readonly id: number;
  readonly name: string;
  readonly tags: ReadonlyArray<string>;
}

const ITEMS: ReadonlyArray<Item> = [
  { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
  { id: 2, name: 'astro', tags: ['framework', 'ssr'] },
  { id: 3, name: 'vite', tags: ['runtime', 'bundler'] },
];

/**
 * GET /api/items?tag=&limit=
 *   - session 不在 → context.redirect('/login?from=/api/items', 302)
 *   - session=banned → 403 + { error: 'banned' }
 *   - tag (multi) で OR filter、 limit で件数制限
 *   - cache-control header injection (kiwa env で捕捉、 e2e で response.headers 確認)
 */
export const itemsGetEndpoint: APIRoute = async (context) => {
  const user = resolveUser(context.cookies);
  if (user === null) {
    return context.redirect(`/login?from=${encodeURIComponent(context.url.pathname)}`, 302);
  }
  if (user.role === 'banned') {
    return new Response(JSON.stringify({ error: 'banned' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }

  const tagParams = context.url.searchParams.getAll('tag');
  let filtered: ReadonlyArray<Item> = ITEMS;
  if (tagParams.length > 0) {
    filtered = ITEMS.filter((item) => tagParams.some((t) => item.tags.includes(t)));
  }
  const limitRaw = context.url.searchParams.get('limit');
  const limit = limitRaw !== null ? Number.parseInt(limitRaw, 10) : Number.NaN;
  if (Number.isFinite(limit) && limit > 0) {
    filtered = filtered.slice(0, limit);
  }

  return new Response(JSON.stringify({ items: filtered, count: filtered.length, user: user.id }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'public, max-age=60',
    },
  });
};

/**
 * POST /api/items (form-encoded `name`)
 *   - session 不在 → redirect(302, '/login')
 *   - session=banned → 403
 *   - name 空 / 1 文字 → 400 + field error
 *   - name=danger → throw new Error('danger forbidden')
 *   - 成功時 → 200 + set-cookie (last-created) + JSON { id, name }
 *
 * id = url.searchParams.seed (default 100) + name.length の deterministic 計算。
 */
export const itemsPostEndpoint: APIRoute = async (context) => {
  const user = resolveUser(context.cookies);
  if (user === null) {
    return context.redirect('/login', 302);
  }
  if (user.role === 'banned') {
    return new Response(JSON.stringify({ error: 'banned' }), {
      status: 403,
      headers: { 'content-type': 'application/json' },
    });
  }

  const formData = await context.request.formData();
  const name = (formData.get('name') ?? '').toString().trim();
  if (name.length === 0) {
    return new Response(JSON.stringify({ field: 'name', message: 'name is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (name.length < 2) {
    return new Response(JSON.stringify({ field: 'name', message: 'name must be at least 2 characters' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }
  if (name === 'danger') {
    throw new Error('danger forbidden');
  }

  const seedRaw = context.url.searchParams.get('seed') ?? '100';
  const seed = Number.parseInt(seedRaw, 10);
  const baseSeed = Number.isFinite(seed) ? seed : 100;
  const id = baseSeed + name.length;
  context.cookies.set('last-created', String(id), { path: '/' });
  return new Response(JSON.stringify({ id, name }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'set-cookie': `last-created=${id}; Path=/`,
    },
  });
};
