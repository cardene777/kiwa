// @ts-nocheck
// +page.server.ts — 実 SvelteKit load/actions runtime entry (thin wrapper)。
//
// 純粋ロジックは _kiwa/items-load.ts と _kiwa/items-actions.ts に切り出し、
// kiwa-test/sveltekit の invokeLoad / invokeAction で direct invoke できる。
//
// 実 runtime では kiwa の branded signal (SK_REDIRECT_SYMBOL / SK_ERROR_SYMBOL /
// SK_FAIL_SYMBOL) を SvelteKit 公式 redirect/error/fail に変換する。
// → kiwa の test 用 signal が `+page.server.ts` で SvelteKit 公式に翻訳されるため、
//   unit test (kiwa) と e2e (real SvelteKit) で同じロジックが動く。

import { error, fail, redirect, type Actions, type PageServerLoad } from '@sveltejs/kit';
import {
  SK_ERROR_SYMBOL,
  SK_FAIL_SYMBOL,
  SK_REDIRECT_SYMBOL,
  type SvelteKitErrorSignal,
  type SvelteKitFailSignal,
  type SvelteKitRedirectSignal,
} from '@kiwa-lab/sveltekit';
import { itemsLoad } from './_kiwa/items-load.js';
import { createItemAction } from './_kiwa/items-actions.js';

function isKiwaRedirect(value: unknown): value is SvelteKitRedirectSignal {
  return typeof value === 'object' && value !== null && (value as { [SK_REDIRECT_SYMBOL]?: true })[SK_REDIRECT_SYMBOL] === true;
}
function isKiwaError(value: unknown): value is SvelteKitErrorSignal {
  return typeof value === 'object' && value !== null && (value as { [SK_ERROR_SYMBOL]?: true })[SK_ERROR_SYMBOL] === true;
}
function isKiwaFail(value: unknown): value is SvelteKitFailSignal {
  return typeof value === 'object' && value !== null && (value as { [SK_FAIL_SYMBOL]?: true })[SK_FAIL_SYMBOL] === true;
}

export const load = async (event: Parameters<PageServerLoad>[0]) => {
  try {
    return await itemsLoad(event as unknown as Parameters<typeof itemsLoad>[0]);
  } catch (caught) {
    if (isKiwaRedirect(caught)) {
      throw redirect(caught.status as 302, caught.location);
    }
    if (isKiwaError(caught)) {
      const message = typeof caught.body === 'string' ? caught.body : caught.body.message;
      throw error(caught.status, message);
    }
    throw caught;
  }
};

export const actions = {
  create: async (event: import('./$types').RequestEvent) => {
    try {
      const result = await createItemAction(event as unknown as Parameters<typeof createItemAction>[0]);
      if (isKiwaFail(result)) {
        return fail(result.status, result.data as Record<string, unknown>);
      }
      return result;
    } catch (caught) {
      if (isKiwaRedirect(caught)) {
        throw redirect(caught.status as 302, caught.location);
      }
      throw caught;
    }
  },
};
;null as any as Actions;