# Test a token approve flow

## Goal

Test the common ERC-20 `approve` flow before swap / stake / lending,
including user reject cases and unlimited approval.

## Prerequisites

- A dApp that calls `ERC20.approve(spender, amount)` before the main action
- A visible button or status element for the approve step
- viem available in the test process

## Steps

### 1. Approve first, then continue

Most DeFi flows split into two transactions:

1. `approve(spender, amount)`
2. `swap` / `stake` / `deposit`

Wait for the approve receipt before continuing so the dApp sees the updated allowance deterministically.

~~~ts
import { dappE2eTest as test, expect } from '@kiwa/core';
import { MaxUint256 } from 'viem';

const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

test('approve token then continue swap', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  const spender = '0x00000000000000000000000000000000000000bb' as const;
  const token = '0x00000000000000000000000000000000000000aa' as const;

  // Your dApp-side viem client
  const hash = await walletClient.writeContract({
    address: token,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [spender, MaxUint256],
  });
  await publicClient.waitForTransactionReceipt({ hash });

  await dappE2e.waitForRpcIdle();
  await expect(hash).toMatch(/^0x[0-9a-fA-F]{64}$/);

  await page.getByRole('button', { name: /swap|stake|deposit/i }).click();
});
~~~

### 2. Test the user-reject approve path

Use the global approval switch when you want the wallet to reject the next approve RPC.

~~~ts
test('approve rejected by the user shows an error', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  await dappE2e.setApprovalMode('reject');

  await page.getByRole('button', { name: /approve/i }).click();

  await expect(page.getByTestId('error')).toContainText(/user rejected|4001/i);

  await dappE2e.setApprovalMode('approve');
});
~~~

If you only want to reject one token while allowing others, use the per-token helper.

~~~ts
await dappE2e.setApprovalModeForToken?.(
  '0x00000000000000000000000000000000000000aa',
  { mode: 'reject' },
);
~~~

### 3. Cap approval with a token-specific limit

This is useful when you want to reject unlimited approval but still allow a bounded amount.

~~~ts
await dappE2e.setApprovalModeForToken?.(
  '0x00000000000000000000000000000000000000aa',
  { mode: 'approve', limit: 1_000_000n },
);
~~~

An `approve` above the limit is rejected with EIP-1193 code `4001`.

### 4. Unlimited approval with `MaxUint256`

Unlimited approval is a common pattern in swap UIs.

~~~ts
const hash = await walletClient.writeContract({
  address: token,
  abi: ERC20_ABI,
  functionName: 'approve',
  args: [spender, MaxUint256],
});

await publicClient.waitForTransactionReceipt({ hash });
~~~

## Verify

- Approve succeeds before the main action runs
- The reject path surfaces `code 4001`
- Token-specific reject / limit rules only affect the targeted token

## Related

- [Cookbook: Test the user-reject path](./user-reject.md)
- [Concepts: RPC handling](../concepts/rpc-handling.md)
- [RPC.md](../../RPC.md)
