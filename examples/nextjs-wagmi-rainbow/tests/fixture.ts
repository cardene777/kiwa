import { dappE2eTest } from '@dapp-e2e/core';

const ANVIL_PORT = 8545;

// anvil is managed by tests/global-setup.ts on fixed port 8545.
// Override dappE2eTest internal anvil fixture to skip spawning.
export const test = dappE2eTest.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _anvilHandle: async ({}: any, use: (h: { port: number; stop: () => Promise<void> }) => Promise<void>) => {
    await use({
      port: ANVIL_PORT,
      stop: async () => {},
    });
  },
} as never);

export { expect } from '@playwright/test';
