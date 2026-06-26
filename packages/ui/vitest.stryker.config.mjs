import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The Solid adapter resolves `solid-js/web` through the browser entry under
  // jsdom — mirror the same conditions Vitest uses in the main suite.
  resolve: {
    conditions: ['browser', 'development', 'module', 'import', 'default'],
  },
  test: {
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs\/testing-library/],
      },
    },
    include: [
      '.vitest-dist/tests/setup-component-env.test.js',
      '.vitest-dist/tests/vue.test.js',
      '.vitest-dist/tests/solid.test.js',
      '.vitest-dist/tests/lit.test.js',
      '.vitest-dist/tests/qwik.test.js',
      '.vitest-dist/tests/angular.test.js',
    ],
    environment: 'jsdom',
  },
});
