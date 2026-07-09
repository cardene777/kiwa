// api-fetch-handle.ts — handleFetch hook の PoC。
//
// SvelteKit `handleFetch` は server-side の `event.fetch` calls を hijack できる。
// この PoC では下記 2 つを行う ...
//   - 外部 API URL を internal mirror に rewrite (https://public.api.example.com →
//     https://internal.api.example.com)
//   - `authorization` header に locals.user.id 由来 token を注入 (admin のみ)

import type { HandleFetchFunction } from '@kiwa-lab/sveltekit';
import type { AuthLocals } from './auth-handle.js';

const PUBLIC_HOST = 'public.api.example.com';
const INTERNAL_HOST = 'internal.api.example.com';

export const apiFetchHandle: HandleFetchFunction<AuthLocals> = async ({ event, request, fetch }) => {
  const url = new URL(request.url);
  let outgoing = request;
  if (url.host === PUBLIC_HOST) {
    url.host = INTERNAL_HOST;
    outgoing = new Request(url.toString(), request);
  }
  const user = event.locals.user;
  if (user?.role === 'admin') {
    const headers = new Headers(outgoing.headers);
    headers.set('authorization', `Bearer admin-${user.id}`);
    outgoing = new Request(outgoing, { headers });
  }
  return fetch(outgoing);
};
