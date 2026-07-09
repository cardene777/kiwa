// items-actions.ts — kiwa-test/sveltekit の invokeAction が direct invoke する pure actions。
//
// Pattern A (Dependency Injection) — 実 SvelteKit 側は src/routes/items/+page.server.ts で
// export const actions = { create: (event) => createItemAction(event), ... } として thin wrap する。

import { fail, redirect, type SimulatedActionEvent, type SvelteKitFailSignal } from '@kiwa-lab/sveltekit';

export interface CreateItemSuccess {
  readonly id: number;
  readonly name: string;
}

/**
 * create action — POST form { name }
 *   - session 不在 → throw redirect(302, '/login')
 *   - name 空 / 2 文字未満 → return fail(400, { field: 'name', message })
 *   - name=danger → throw new Error('danger forbidden')
 *   - 成功時 → cookies.last-created に id を set、 { id, name } を返却
 *
 * id は url.searchParams.seed + name.length で deterministic に決まる (test しやすさ重視)。
 */
export async function createItemAction(event: SimulatedActionEvent): Promise<CreateItemSuccess | SvelteKitFailSignal> {
  const session = event.cookies.get('session');
  if (!session) {
    throw redirect(302, '/login');
  }

  const formData = await event.request.formData();
  const name = (formData.get('name') ?? '').toString().trim();

  if (name.length === 0) {
    return fail(400, { field: 'name', message: 'name is required' });
  }
  if (name.length < 2) {
    return fail(400, { field: 'name', message: 'name must be at least 2 characters' });
  }
  if (name === 'danger') {
    throw new Error('danger forbidden');
  }

  const seedRaw = event.url.searchParams.get('seed') ?? '100';
  const seed = Number.parseInt(seedRaw, 10);
  const baseSeed = Number.isFinite(seed) ? seed : 100;
  const id = baseSeed + name.length;
  // SvelteKit 公式 cookies.set は path 必須。 kiwa 純粋関数でも同じ shape の options を渡しておく。
  event.cookies.set('last-created', String(id), { path: '/' });
  return { id, name };
}
