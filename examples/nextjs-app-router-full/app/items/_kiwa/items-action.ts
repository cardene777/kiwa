// items-action.ts — Server Action under test (Pattern A、 LoginEnv 風 DI)。
//
// 実 Next.js では app/items/actions.ts で 'use server' 付きの薄い wrapper を
// 用意し、 内部で createItemAction(formData, env) を呼ぶ。 env は injection point。

import { REDIRECT_SYMBOL, type CookieJar } from '@kiwa-test/nextjs';
import { resolveUser } from '../../../lib/_kiwa/auth';

export interface ItemsActionEnv {
  cookies: CookieJar;
  redirect(url: string): never;
  revalidatePath(path: string): void;
}

/**
 * createItemAction — POST form { name }
 *   - session 不在 → env.redirect('/login') (REDIRECT_SYMBOL を throw)
 *   - session=banned → throw new Error('banned')
 *   - name 空 / 2 文字未満 → return { ok: false, field: 'name', message: ... }
 *   - name=danger → throw new Error('danger forbidden')
 *   - 成功時 → env.revalidatePath('/items') + cookies.set('last-created', id) + return { ok: true, id, name }
 *
 * id は formData の seed (default 100) + name.length で deterministic。
 */
export async function createItemAction(
  formData: FormData,
  env: ItemsActionEnv,
): Promise<{ ok: true; id: number; name: string } | { ok: false; field: string; message: string }> {
  const user = resolveUser(env.cookies);
  if (user === null) {
    env.redirect('/login');
  }
  if (user!.role === 'banned') {
    throw new Error('banned');
  }

  const name = (formData.get('name') ?? '').toString().trim();
  if (name.length === 0) {
    return { ok: false, field: 'name', message: 'name is required' };
  }
  if (name.length < 2) {
    return { ok: false, field: 'name', message: 'name must be at least 2 characters' };
  }
  if (name === 'danger') {
    throw new Error('danger forbidden');
  }

  const seedRaw = (formData.get('seed') ?? '100').toString();
  const seed = Number.parseInt(seedRaw, 10);
  const baseSeed = Number.isFinite(seed) ? seed : 100;
  const id = baseSeed + name.length;

  env.cookies.set('last-created', String(id));
  env.revalidatePath('/items');
  return { ok: true, id, name };
}

/**
 * defaultEnv — 実 Next.js 環境用の default 実装。
 * `'use server'` から呼ばれる wrapper で `next/navigation` / `next/headers` / `next/cache`
 * を bind する。 REDIRECT_SYMBOL を throw することで kiwa unit test と実 next runtime の
 * どちらでも redirect の動作を統一する (実 next runtime は throw を catch して 303 redirect する)。
 */
export function buildDefaultEnv(cookies: CookieJar, revalidate: (path: string) => void): ItemsActionEnv {
  return {
    cookies,
    redirect: (url: string): never => {
      throw {
        [REDIRECT_SYMBOL]: true,
        url,
        type: 'replace' as const,
      };
    },
    revalidatePath: revalidate,
  };
}
