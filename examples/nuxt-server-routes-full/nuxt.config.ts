// Nuxt 3 config for kiwa Nuxt full PoC example.
// Showcase target: 3 layer (server/api/* + middleware/* + server/plugins/*) を実 Nitro 起動 + Playwright e2e で動かし、
// 同じ実装を kiwa-test/nuxt v1.0.4 の 3 helper で unit test できる経路を示す。

export default defineNuxtConfig({
  compatibilityDate: '2025-12-01',
  devtools: { enabled: false },
  ssr: true,
  routeRules: {
    '/api/**': { cors: true },
  },
  runtimeConfig: {
    public: {
      kiwaPocName: 'nuxt-server-routes-full',
    },
  },
});
