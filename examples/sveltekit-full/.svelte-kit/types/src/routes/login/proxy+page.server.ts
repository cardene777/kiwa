// @ts-nocheck
// /login — login page (test 用)。 form submit で cookies.session に POST value を set し、 / にリダイレクト。

import { redirect, type Actions } from '@sveltejs/kit';

export const actions = {
  default: async ({ request, cookies, url }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const session = (formData.get('session') ?? 'guest').toString();
    cookies.set('session', session, { path: '/' });
    const from = url.searchParams.get('from') ?? '/';
    throw redirect(303, from);
  },
};
;null as any as Actions;