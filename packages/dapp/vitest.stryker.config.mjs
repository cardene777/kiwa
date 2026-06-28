import { defineConfig } from 'vitest/config';

// Excludes the deploy-contract suite + heavy live-anvil suites that depend on
// fixtures or unconfined network ports. Stryker drops these so the initial
// dry-run completes quickly while leaving the deterministic helpers verified.
export default defineConfig({
  test: {
    include: [
      '.vitest-dist/tests/anvil-pool.test.js',
      '.vitest-dist/tests/eip1271.test.js',
      '.vitest-dist/tests/wait-for-wallet-connected.test.js',
    ],
    environment: 'node',
    testTimeout: 15000,
  },
});
