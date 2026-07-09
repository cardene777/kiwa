// hooks.server.ts — 実 SvelteKit hooks runtime entry point。
//
// Issue #559 で 4 hook (handle / handleFetch / handleError / locals injection)
// 全てを PoC 化。 純粋ロジックは src/lib/_kiwa/ 配下に切り出し、
// kiwa-test/sveltekit の setupSvelteKitHooksEnv / sequence / invokeHandle*
// で direct invoke できるようにしてある。

import type { Handle, HandleFetch, HandleServerError } from '@sveltejs/kit';
import { sequence as kiwaSequence } from '@kiwa-lab/sveltekit';
import { authHandle } from '$lib/_kiwa/auth-handle.js';
import { requestIdHandle } from '$lib/_kiwa/request-id-handle.js';
import { apiFetchHandle } from '$lib/_kiwa/api-fetch-handle.js';
import { errorLoggerHandle } from '$lib/_kiwa/error-logger-handle.js';

// handle (sequence) — request middleware chain。
//   requestIdHandle → authHandle → resolve
// 各 handle の locals 書込は後続 handle / downstream load から観測可能。
export const handle: Handle = kiwaSequence(
  // SvelteKit Handle と kiwa の HandleFunction は同 shape。 cast で narrow 化。
  requestIdHandle as unknown as Parameters<typeof kiwaSequence>[0],
  authHandle as unknown as Parameters<typeof kiwaSequence>[0],
) as unknown as Handle;

// handleFetch — event.fetch hijack chain。
export const handleFetch: HandleFetch = (async (args) => {
  return apiFetchHandle(args as unknown as Parameters<typeof apiFetchHandle>[0]);
}) as unknown as HandleFetch;

// handleError — server error logger chain。
export const handleError: HandleServerError = ((args) => {
  return errorLoggerHandle(args as unknown as Parameters<typeof errorLoggerHandle>[0]);
}) as unknown as HandleServerError;
