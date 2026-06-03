import { privateKeyToAccount } from 'viem/accounts';
import { test, expect } from './fixture';

const PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

async function ensureConnected(page: import('@playwright/test').Page) {
  const connectBtn = page.getByRole('button', { name: /connect wallet/i });
  if (await connectBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await connectBtn.click();
    const injected = page.getByText(/browser wallet|injected/i).first();
    if (await injected.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await injected.click();
    }
  }
  await expect(page.getByTestId('connection-status')).toHaveText('status: connected', {
    timeout: 15_000,
  });
}

async function waitInventoryLoaded(page: import('@playwright/test').Page) {
  // useReadContract balanceOfBatch の初回 fetch を待つ ((loading) → Sword=N 形式に遷移)
  await expect(page.getByTestId('my-inventory')).toContainText('Sword=', { timeout: 15_000 });
  await expect(page.getByTestId('recipient-inventory')).toContainText('Sword=', {
    timeout: 15_000,
  });
}

function parseInventory(text: string): Record<string, number> {
  // "my: Sword=3, Shield=2, Potion=5" → { Sword: 3, Shield: 2, Potion: 5 }
  const stripped = text.replace(/^(my|recipient):\s*/, '');
  const result: Record<string, number> = {};
  for (const pair of stripped.split(',')) {
    const [k, v] = pair.trim().split('=');
    if (k && v) result[k] = Number(v);
  }
  return result;
}

test.describe('Next.js + ERC1155 game items e2e', () => {
  test('T-ER-001 connect 後 inventory が 3 種 item 表示形式で render される', async ({
    page,
    dappE2e,
  }) => {
    const account = privateKeyToAccount(PRIVATE_KEY);
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitInventoryLoaded(page);
    await expect(page.getByTestId('account-address')).toContainText(account.address);
    await expect(page.getByTestId('my-inventory')).toContainText('Sword=', { timeout: 15_000 });
    await expect(page.getByTestId('my-inventory')).toContainText('Shield=');
    await expect(page.getByTestId('my-inventory')).toContainText('Potion=');
  });

  test('T-ER-002 Mint Sword button click → Sword balance が +1 増える', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitInventoryLoaded(page);
    const before = parseInventory((await page.getByTestId('my-inventory').textContent()) ?? '');
    await page.getByTestId('mint-sword-button').click();
    await dappE2e.waitForRpcIdle();
    await expect
      .poll(
        async () => {
          const text = (await page.getByTestId('my-inventory').textContent()) ?? '';
          return parseInventory(text).Sword;
        },
        { timeout: 15_000 },
      )
      .toBe((before.Sword ?? 0) + 1);
  });

  test('T-ER-003 Mint Batch button → Sword+3 / Shield+2 / Potion+5 が同時反映', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitInventoryLoaded(page);
    const before = parseInventory((await page.getByTestId('my-inventory').textContent()) ?? '');
    await page.getByTestId('mint-batch-button').click();
    await dappE2e.waitForRpcIdle();
    await expect
      .poll(
        async () => parseInventory((await page.getByTestId('my-inventory').textContent()) ?? ''),
        { timeout: 15_000 },
      )
      .toEqual({
        Sword: (before.Sword ?? 0) + 3,
        Shield: (before.Shield ?? 0) + 2,
        Potion: (before.Potion ?? 0) + 5,
      });
  });

  test('T-ER-004 Batch Transfer 1+1+1 → recipient inventory に Sword+1 / Shield+1 / Potion+1', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitInventoryLoaded(page);
    // pre condition: 少なくとも各 item を 1 個ずつ持つように mintBatch
    const myBefore = parseInventory((await page.getByTestId('my-inventory').textContent()) ?? '');
    if ((myBefore.Sword ?? 0) < 1 || (myBefore.Shield ?? 0) < 1 || (myBefore.Potion ?? 0) < 1) {
      await page.getByTestId('mint-batch-button').click();
      await dappE2e.waitForRpcIdle();
      await page.waitForTimeout(1000);
    }
    const recipientBefore = parseInventory(
      (await page.getByTestId('recipient-inventory').textContent()) ?? '',
    );
    await page.getByTestId('batch-transfer-button').click();
    await dappE2e.waitForRpcIdle();
    await expect
      .poll(
        async () =>
          parseInventory(
            (await page.getByTestId('recipient-inventory').textContent()) ?? '',
          ),
        { timeout: 15_000 },
      )
      .toEqual({
        Sword: (recipientBefore.Sword ?? 0) + 1,
        Shield: (recipientBefore.Shield ?? 0) + 1,
        Potion: (recipientBefore.Potion ?? 0) + 1,
      });
  });

  test('T-ER-005 useReadContract balanceOfBatch が 3 種 item を 1 RPC で取得できる', async ({
    page,
    dappE2e,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    await ensureConnected(page);
    await dappE2e.waitForRpcIdle();
    await waitInventoryLoaded(page);
    // inventory text を parse して 3 種 key (Sword / Shield / Potion) が揃ってる
    const inv = parseInventory((await page.getByTestId('my-inventory').textContent()) ?? '');
    expect(Object.keys(inv).sort()).toEqual(['Potion', 'Shield', 'Sword']);
    for (const key of ['Sword', 'Shield', 'Potion']) {
      expect(Number.isFinite(inv[key])).toBe(true);
    }
  });
});
