# Fixture composition

## TL;DR

Use `dappE2eTest.extend()` as a thin composition layer that joins deploy output from global setup,
wallet options, and app-specific helpers into one fixture.
Keep deploy-time state in setup scripts, and runtime page state in fixtures.

## Why

If each spec launches anvil, deploys contracts, and injects wallets independently,
setup order drifts and tests become flaky.
Fixture composition separates "prepare once" work from "switch per test" work,
so each spec only needs `page` plus a typed helper surface.

## 1. Add custom fixtures with `test.extend()`

`dappE2eTest` already provides `page`, `wallet`, `dappE2e`, and `anvilPort`.
App tests usually add fixtures such as `contracts`, `factory`, or `customWallet` on top.

~~~ts
import { dappE2eTest } from '@dapp-e2e/core';

type AppFixtures = {
  customWallet: { connectAs(index: number): Promise<void> };
};

export const test = dappE2eTest.extend<AppFixtures>({
  customWallet: async ({ dappE2e }, use) => {
    await use({
      async connectAs(index) {
        await dappE2e.setActiveAccount!(index);
        await dappE2e.connect();
      },
    });
  },
});
~~~

## 2. Split work between global setup and custom fixtures

Let `globalSetup` or a pre-step such as `prepare-env.ts` handle shared preparation:
launching anvil, deploying contracts, and writing `.env` or `.context/*.env`.

Keep `fixture.ts` focused on reading that prepared output, reusing the fixed-port anvil,
and controlling wallet/page state inside the running test.
This avoids redeploying on every test and makes startup more predictable.

## 3. Use a contract-factory pattern to lock deploy order

When contract B needs contract A in its constructor,
encode that order inside a fixture-owned factory.
For example: deploy `Token`, wait for the receipt, then deploy `Vault(tokenAddress)`,
and finally expose `{ token, vault }` as one fixture object.

This keeps specs from accidentally touching half-initialized addresses.

## 4. Type-inference notes for `fixture.ts`

- Write the generic explicitly, for example `dappE2eTest.extend<{ customWallet: CustomWallet; contracts: Contracts }>(...)`, so consuming specs do not fall back to `any`
- Export `test` from `tests/fixture.ts` and import that symbol in specs. Recreating `extend()` per spec scatters both typing and setup order
- Keep `test.use({ wallets: [...] } as never)` and internal fixture overrides inside `fixture.ts`. The cast may be needed for Playwright option typing, but the explicit generic still preserves your custom fixture types

## 5. Complete example

~~~ts
import { dappE2eTest } from '@dapp-e2e/core';

type AppFixtures = {
  customWallet: { connectAs(index: number): Promise<void> };
};

export const test = dappE2eTest.extend<AppFixtures>({
  customWallet: async ({ dappE2e }, use) => {
    await use({
      async connectAs(index) {
        await dappE2e.setActiveAccount!(index);
        await dappE2e.connect();
      },
    });
  },
});

test('treasury account can open the vault page', async ({ page, customWallet }) => {
  await page.goto('/');
  await customWallet.connectAs(1);
  await page.getByRole('button', { name: /vault/i }).click();
});
~~~

## Related

- [Fixture design](./fixture.md)
- [API Reference: dappE2eTest](../api/dapp-e2e-test.md)
