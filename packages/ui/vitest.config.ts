import { defineConfig } from 'vitest/config';

/**
 * Forces `solid-js/web` to resolve the browser entry instead of the SSR `server.js`
 * when running under jsdom. Without this, `@solidjs/testing-library` triggers
 * "Client-only API called on the server side" because Node resolves the default
 * (server) condition first.
 *
 * The other adapters (React / Vue / Svelte) ignore this config — they already
 * resolve their DOM entries through the testing-library packages directly.
 */
export default defineConfig({
  resolve: {
    conditions: ['browser', 'development', 'module', 'import', 'default'],
  },
  test: {
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs\/testing-library/],
      },
    },
  },
});
