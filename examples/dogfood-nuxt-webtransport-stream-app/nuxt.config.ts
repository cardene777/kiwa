/**
 * Nuxt 3 config for dogfood-nuxt-webtransport-stream-app (v1.28-3).
 *
 * The example is deliberately minimal — the app only ships one page
 * (`pages/stream.vue`) and two server endpoints (`server/api/stream.post.ts`
 * + `server/api/reset.post.ts`) that route WebTransport ops to the shared
 * adapter. The kiwa test harness never boots `nuxt dev` — vitest drives the
 * handlers directly and Playwright spawns an ad-hoc HTTP server — so this
 * config is only picked up when a developer runs the app locally to poke at
 * the UI.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const defineNuxtConfig: (options: any) => any;

export default defineNuxtConfig({
  compatibilityDate: '2026-07-01',
  ssr: true,
  devtools: { enabled: false },
  nitro: {
    experimental: {
      // WebTransport streaming requires HTTP/3 which Nitro exposes as an
      // experimental flag today. The flag is a no-op when the underlying
      // adapter does not support it (dev mode falls back to HTTP/1.1).
      openAPI: false,
    },
  },
});
