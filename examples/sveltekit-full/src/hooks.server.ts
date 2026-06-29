// hooks.server.ts — 実 SvelteKit hooks runtime entry point (thin wrapper)。
//
// 純粋ロジックは src/lib/_kiwa/auth-handle.ts に切り出し、 kiwa-test/sveltekit の
// invokeHandle で direct invoke できるようにしてある。

import type { Handle } from '@sveltejs/kit';
import { authHandle } from '$lib/_kiwa/auth-handle.js';

export const handle: Handle = async ({ event, resolve }) => {
  // SvelteKit Handle と kiwa の HandleFunction は同 shape (event/resolve)、
  // resolve(event) を直接 await + locals は AuthLocals に narrow。
  return authHandle({
    event: event as unknown as Parameters<typeof authHandle>[0]['event'],
    resolve: resolve as unknown as Parameters<typeof authHandle>[0]['resolve'],
  });
};
