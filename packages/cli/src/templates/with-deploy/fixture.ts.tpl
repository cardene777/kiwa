// kiwa init --with-deploy で生成された fixture override。
// dappE2eTest を extend し _anvilHandle を globalSetup の anvil に向ける。
import { dappE2eTest as baseTest } from '@kiwa/core';

interface OverrideFixtures {
  _anvilHandle: { port: number; stop: () => Promise<void> };
}

const NOOP_STOP = async (): Promise<void> => {
  // global-teardown.ts が停止を担当するため、 fixture 経由では何もしない
};

export const test = baseTest.extend<OverrideFixtures>({
  _anvilHandle: async ({}, use) => {
    // global-setup.ts で起動した anvil を再利用 (port 8545 固定)
    await use({ port: 8545, stop: NOOP_STOP });
  },
});

export { expect } from '@playwright/test';
