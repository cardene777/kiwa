import { dappE2eTest } from '@kiwa-test/core';

const L1_PORT = 8554;

// dapp-e2e fixture は chainId 1 + 外部 anvil :8554 (L1) で動作
export const test = dappE2eTest.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _anvilHandle: async ({}: any, use: (h: { port: number; stop: () => Promise<void> }) => Promise<void>) => {
    await use({
      port: L1_PORT,
      stop: async () => {},
    });
  },
} as never);

test.use({ chainId: 1 } as never);

export { expect } from '@playwright/test';
