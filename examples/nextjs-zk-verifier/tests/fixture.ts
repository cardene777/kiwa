import { dappE2eTest } from '@kiwa-test/core';

const ANVIL_PORT = 8545;

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
