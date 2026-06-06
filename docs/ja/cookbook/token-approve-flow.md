# Token approve flow を test する

## Goal

swap / stake / lending の前段にある ERC-20 `approve` flow を、
user reject と unlimited approval を含めて test する。

## Prerequisites

- main action の前に `ERC20.approve(spender, amount)` を呼ぶ dApp
- approve step 用の button または status element
- test process から viem を使えること

## Steps

### 1. 先に approve し、その後に main action を続ける

多くの DeFi flow は 2 tx に分かれます。

1. `approve(spender, amount)`
2. `swap` / `stake` / `deposit`

approve receipt を待ってから次へ進めると、allowance 更新を deterministic に扱えます。

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

test('token approve 後に swap を続行する', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  const spender = '0x00000000000000000000000000000000000000bb' as const;
  const token = '0x00000000000000000000000000000000000000aa' as const;

  // dApp 側で使っている viem client
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

### 2. approve を user が reject する経路を test する

次の approve RPC だけを reject したいなら、global approval mode を切り替えます。

~~~ts
test('approve を reject すると error が表示される', async ({ page, dappE2e }) => {
  await page.goto('/');
  await dappE2e.connect();

  await dappE2e.setApprovalMode('reject');

  await page.getByRole('button', { name: /approve/i }).click();

  await expect(page.getByTestId('error')).toContainText(/user rejected|4001/i);

  await dappE2e.setApprovalMode('approve');
});
~~~

特定 token だけ reject したい場合は per-token helper を使います。

~~~ts
await dappE2e.setApprovalModeForToken?.(
  '0x00000000000000000000000000000000000000aa',
  { mode: 'reject' },
);
~~~

### 3. token ごとに approve 上限を持たせる

unlimited approval は reject しつつ、一定額までは許可したいときに有効です。

~~~ts
await dappE2e.setApprovalModeForToken?.(
  '0x00000000000000000000000000000000000000aa',
  { mode: 'approve', limit: 1_000_000n },
);
~~~

limit を超える `approve` は EIP-1193 code `4001` で reject されます。

### 4. `MaxUint256` を使った unlimited approval

swap UI では unlimited approval が一般的です。

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

- main action 前に approve が成功する
- reject 経路で `code 4001` が surface される
- token-specific reject / limit は対象 token の approve のみに作用する

## Related

- [Cookbook: User reject 経路を test する](./user-reject.md)
- [Concepts: RPC handling](../concepts/rpc-handling.md)
- [RPC.md](../../RPC.md)
