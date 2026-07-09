// items-action.ts — kiwa-test/remix の invokeAction が direct invoke する pure action。
//
// Pattern A (Dependency Injection) — 実 Remix 側は app/routes/items.tsx で
// export const action = (args) => createItemAction(args) として thin wrap する。

import { json, redirect, type SimulatedRouteArgs } from '@kiwa-lab/remix';
import { resolveUser } from '../../utils/_kiwa/auth.js';

export interface CreateItemSuccess {
  readonly id: number;
  readonly name: string;
}

export interface CreateItemFailure {
  readonly field: 'name';
  readonly message: string;
}

/**
 * createItemAction — POST form { name }
 *   - session 不在 → redirect(302, '/login')
 *   - session=banned → json({ error: 'banned' }, { status: 403 })
 *   - name 空 / 2 文字未満 → json(fail, { status: 400 })
 *   - name=danger → throw new Error('danger forbidden')
 *   - 成功時 → json(success, { headers: { 'set-cookie': 'last-created=<id>; Path=/' } })
 *
 * id は url.searchParams.seed + name.length の deterministic 計算 (test しやすさ重視)。
 */
export async function createItemAction(args: SimulatedRouteArgs): Promise<Response> {
  const user = resolveUser(args.request);
  if (user === null) {
    return redirect('/login', 302);
  }
  if (user.role === 'banned') {
    return json({ error: 'banned' }, { status: 403 });
  }

  const formData = await args.request.formData();
  const name = (formData.get('name') ?? '').toString().trim();

  if (name.length === 0) {
    const fail: CreateItemFailure = { field: 'name', message: 'name is required' };
    return json(fail, { status: 400 });
  }
  if (name.length < 2) {
    const fail: CreateItemFailure = { field: 'name', message: 'name must be at least 2 characters' };
    return json(fail, { status: 400 });
  }
  if (name === 'danger') {
    throw new Error('danger forbidden');
  }

  const url = new URL(args.request.url);
  const seedRaw = url.searchParams.get('seed') ?? '100';
  const seed = Number.parseInt(seedRaw, 10);
  const baseSeed = Number.isFinite(seed) ? seed : 100;
  const id = baseSeed + name.length;
  const result: CreateItemSuccess = { id, name };
  return json(result, {
    headers: { 'set-cookie': `last-created=${id}; Path=/` },
  });
}
