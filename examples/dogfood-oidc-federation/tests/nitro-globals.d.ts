/**
 * Ambient declarations for the Nitro helpers the RP routes use.
 *
 * Nuxt generates these into `rp/.nuxt/` and injects them at build time, so the
 * routes reference them without importing. The vitest compile does not run
 * `nuxt prepare`, so it needs its own declarations to typecheck
 * `rp/server/api/callback.post.ts`.
 *
 * The shapes are deliberately loose — the suite supplies its own stand-ins on
 * `globalThis`, and pinning Nitro's real generics here would couple the tests
 * to a version they never load. The route's own types come from its imports.
 */

declare function defineEventHandler<T>(
  handler: (event: unknown) => T,
): (event: unknown) => T;

declare function readBody<T>(event: unknown): Promise<T>;

declare function getCookie(event: unknown, name: string): string | undefined;

declare function setCookie(
  event: unknown,
  name: string,
  value: string,
  options?: Record<string, unknown>,
): void;

declare function deleteCookie(event: unknown, name: string): void;

declare function useRuntimeConfig(event?: unknown): {
  opIssuer: string;
  rpClientId: string;
  rpRedirectUri: string;
};

declare function createError(init: {
  statusCode: number;
  statusMessage: string;
}): Error;

declare function $fetch<T>(
  url: string,
  options?: Record<string, unknown>,
): Promise<T>;
