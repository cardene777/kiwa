import { defineConfig } from 'vitest/config';

// Every test file except `browser.test.js` (#1986).
//
// This used to name six of the package's fourteen test files in an `include`
// allowlist, and `browser.js` and `svelte.js` had no test in that list at all —
// their mutants reported as no-coverage, which reads as code the suite cannot
// reach. Measured, the suite reached all of it: 54 no-coverage of 190 mutants
// before, 0 after, with covered MSI going 91.18 → 93.16.
//
// `browser.test.js` stays out because it launches a real Chromium through
// `setupBrowserComponentEnv` and needs `environment: 'node'`. The package's own
// `test` script splits into two vitest invocations for the same reason, and a
// Stryker run takes one config. `browser-mock.test.js` covers the same adapter
// with a mocked playwright under jsdom, which is why excluding the real-browser
// file costs no coverage.
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
    include: ['.vitest-dist/tests/**/*.test.js'],
    exclude: ['**/.stryker-tmp/**', '.vitest-dist/tests/browser.test.js'],
    environment: 'jsdom',
  },
});
