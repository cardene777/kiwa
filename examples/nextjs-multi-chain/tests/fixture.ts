import { dappE2eTest } from '@dapp-e2e/core';

const ANVIL_PORT_MAINNET = 8551;

// dapp-e2e fixture は default chain id 31337 で window.ethereum inject するため、
// chain id 1 (Mainnet sim) で動作するよう test.use で override する。
// _anvilHandle も外部 anvil :8551 を使うように override (test ごとに spawn しない)。
export const test = dappE2eTest.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _anvilHandle: async ({}: any, use: (h: { port: number; stop: () => Promise<void> }) => Promise<void>) => {
    await use({
      port: ANVIL_PORT_MAINNET,
      stop: async () => {},
    });
  },
} as never);

test.use({ chainId: 1 } as never);

export { expect } from '@playwright/test';
