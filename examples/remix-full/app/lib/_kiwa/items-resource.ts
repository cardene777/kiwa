// items-resource.ts — kiwa-test/remix の invokeResourceRoute が direct invoke する Resource Route module。
//
// Resource Route は default React component を持たず、 loader / action のみ export して
// JSON / CSV / arbitrary Response を返す純粋 endpoint。 method dispatch は kiwa helper が担当。
//
// Pattern A (Dependency Injection) — 実 Remix 側は app/routes/api.items.tsx で
// export const loader / action を直接 re-export する。

import { json, type ResourceRouteModule, type SimulatedRouteArgs } from '@kiwa/remix';
import { resolveUser } from '../../utils/_kiwa/auth.js';

interface CountState {
  count: number;
}

const state: CountState = { count: 0 };

/**
 * /api/items — Resource Route (JSON-only)
 *   GET  → 現在 count を返却 (auth 必須、 banned は 403)
 *   POST → form `delta` で count を加算、 新 count を返却 (auth 必須、 banned は 403、 不正値は 400)
 *   PUT/PATCH/DELETE → 未実装 → method-not-allowed 405 (allow header に GET, HEAD, POST 列挙)
 */
async function loader(args: SimulatedRouteArgs): Promise<Response> {
  const user = resolveUser(args.request);
  if (user === null) return json({ error: 'unauthenticated' }, { status: 401 });
  if (user.role === 'banned') return json({ error: 'banned' }, { status: 403 });
  return json({ count: state.count, user: user.id });
}

async function action(args: SimulatedRouteArgs): Promise<Response> {
  const user = resolveUser(args.request);
  if (user === null) return json({ error: 'unauthenticated' }, { status: 401 });
  if (user.role === 'banned') return json({ error: 'banned' }, { status: 403 });
  const formData = await args.request.formData();
  const deltaRaw = (formData.get('delta') ?? '').toString().trim();
  const delta = Number.parseInt(deltaRaw, 10);
  if (!Number.isFinite(delta)) {
    return json({ field: 'delta', message: 'delta must be an integer' }, { status: 400 });
  }
  state.count += delta;
  return json({ count: state.count, user: user.id });
}

export function resetItemsResourceCount(value = 0): void {
  state.count = value;
}

export const itemsResourceRoute: ResourceRouteModule = { loader, action };

/**
 * readonlyItemsResource — loader だけ実装した Resource Route (action 未実装)。
 * method-not-allowed dispatch の検証用に提供する。
 */
export const readonlyItemsResource: ResourceRouteModule = { loader };
