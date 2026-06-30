// actions.ts — 実 Next.js Server Action thin wrapper。
//
// 純粋ロジックは _kiwa/items-action.ts に切り出し、 kiwa の invokeServerAction で
// direct invoke できるようにしてある。 ここでは next/headers / next/navigation /
// next/cache を bind して env を構築するだけ。

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { CookieJar } from '@kiwa-test/nextjs';
import { createItemAction } from './_kiwa/items-action';

async function buildCookieJar(): Promise<CookieJar> {
  const store = await cookies();
  return {
    get(name: string) {
      return store.get(name)?.value;
    },
    set(name: string, value: string) {
      store.set(name, value, { path: '/' });
    },
    delete(name: string) {
      store.delete(name);
    },
    entries() {
      return store.getAll().map((c) => [c.name, c.value] as [string, string]);
    },
  };
}

export async function createItem(
  _prevState: { ok: boolean; message: string; id?: number; name?: string },
  formData: FormData,
): Promise<{ ok: boolean; message: string; id?: number; name?: string }> {
  const cookieJar = await buildCookieJar();
  try {
    const result = await createItemAction(formData, {
      cookies: cookieJar,
      redirect: (url: string): never => redirect(url),
      revalidatePath: (path: string) => revalidatePath(path),
    });
    if (result.ok) {
      return { ok: true, id: result.id, name: result.name, message: '' };
    }
    return { ok: false, message: result.message };
  } catch (caught) {
    if (caught instanceof Error) {
      return { ok: false, message: caught.message };
    }
    throw caught;
  }
}
