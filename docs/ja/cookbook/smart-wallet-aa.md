# Smart wallet (AA / smart contract account) を test する

> [🇬🇧 English](../../en/cookbook/smart-wallet-aa.md) • [🇯🇵 日本語](./smart-wallet-aa.md)

`@kiwa-test/core` v0.3 で追加された `WalletConfig.isContractAccount` を使い、 ERC-4337 / EIP-1271 の smart contract account を end-to-end で test する pattern。

## 課題

通常の EOA wallet (MetaMask / Rabby) は `personal_sign` / `eth_signTypedData_v4` で直接 ECDSA 署名できる。 一方 **smart contract account (AA)** は以下が異なる:

- 署名は owner EOA で生成し、 smart account の `isValidSignature(hash, signature)` (EIP-1271) で検証する必要あり
- tx は `eth_sendTransaction` 直叩きでなく、 smart account の `execute(target, value, data)` 経由 (実 ERC-4337 では `eth_sendUserOperation`)
- `eth_accounts` は owner EOA ではなく **smart account address** を返すべき

これらを dApp 側 (wagmi / viem) で意識せず透過的に扱うため、 kiwa が RPC handler で振替を行う。

## 解決パターン

### Step 1: smart account を deploy (prepare-env.ts)

```ts
// tests/prepare-env.ts
import { runE2EPrepareEnv, loadForgeArtifact } from '@kiwa-test/core';

await runE2EPrepareEnv({
  envFile: '.env.local',
  port: 8551,
  deploy: async ({ wallet, publicClient }) => {
    // EntryPoint v0.7 + SimpleAccountFactory + SimpleAccount を deploy
    const entryPoint = await deployContract(/* ... */);
    const factory = await deployContract({ args: [entryPoint] });

    // owner EOA から smart account を deploy
    const smartAccount = await wallet.writeContract({
      address: factory,
      abi: FACTORY_ABI,
      functionName: 'createAccount',
      args: [OWNER_EOA, SALT],
    });

    return {
      NEXT_PUBLIC_ENTRYPOINT: entryPoint,
      NEXT_PUBLIC_SMART_ACCOUNT: smartAccount,
    };
  },
});
```

### Step 2: fixture で isContractAccount を宣言

```ts
// tests/fixture.ts
import { dappE2eTest } from '@kiwa-test/core';
import type { Address } from 'viem';

const SMART_ACCOUNT_ADDRESS = process.env.NEXT_PUBLIC_SMART_ACCOUNT as Address;

export const test = dappE2eTest.extend({
  wallets: [
    {
      name: 'Simple AA',
      rdns: 'eth.aa-simple',
      icon: 'data:image/svg+xml;base64,...',
      privateKey: OWNER_EOA_PRIVATE_KEY,
      isContractAccount: true,
      contractAccountAddress: SMART_ACCOUNT_ADDRESS,
    },
  ],
});
```

kiwa が以下を自動で振り替える:

| RPC | EOA (従来) | smart account (`isContractAccount=true`) |
|---|---|---|
| `eth_accounts` | owner EOA address | smart account address |
| `eth_requestAccounts` | 同上 | 同上 |
| `personal_sign` | owner EOA で sign | owner EOA で sign + `isValidSignature` で内部検証してから return |
| `eth_signTypedData_v4` | 同上 | 同上 (EIP-712 hash 経由) |
| `eth_sendTransaction` | owner EOA から直送 | smart account の `execute(target, value, data)` 経由 |

### Step 3: test を書く

```ts
import { test, expect } from './fixture';
import { verifyMessage } from 'viem';

test('T-AA-001 smart account address が eth_accounts に返る', async ({ page, dappE2e }) => {
  await page.goto('/');
  await page.getByTestId('connect-button').click();

  const accounts = await page.evaluate(async () => {
    return (window as any).ethereum.request({ method: 'eth_accounts' });
  });

  expect(accounts[0].toLowerCase()).toBe(SMART_ACCOUNT_ADDRESS.toLowerCase());
});

test('T-AA-002 personal_sign の signature が isValidSignature で検証成功', async ({
  page,
  dappE2e,
}) => {
  const { signature, message } = await page.evaluate(async () => {
    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
    const sig = await (window as any).ethereum.request({
      method: 'personal_sign',
      params: ['hello AA', accounts[0]],
    });
    return { signature: sig, message: 'hello AA' };
  });

  // kiwa 内部で isValidSignature 検証済、 返ってくる signature は EIP-1271 検証通過
  expect(signature).toMatch(/^0x[0-9a-f]+$/i);
});
```

## ERC-4337 完全 example

`examples/nextjs-aa-erc4337/` に EntryPoint v0.7 + SimpleAccountFactory + UserOperation bundler stub の full lifecycle を実装した参考例があります。

主要な test:

- T-AA37-002 deploy 前に EntryPoint.depositTo で gas 入金 → UserOperation 経由で deploy + execute を同時実行
- T-AA37-003 UserOperation signature が owner EOA で sign され、 validateUserOp で検証成功
- T-AA37-004 invalid signature の UserOperation は revert
- T-AA37-005 nonce 不一致の UserOperation は revert
- T-AA37-006 dApp UI から sendUserOperation で MockTarget.counter が +1

## thirdweb / Safe / Biconomy 連携 (今後の方針)

実 SDK 依存を伴う以下は v0.4 以降で対応予定 (Phase D-3):

- **thirdweb `inAppWallet`** — Email / Passkey 経由の smart wallet
- **Safe (Gnosis Safe)** — multi-sig threshold 署名
- **Biconomy / ZeroDev / Alchemy AA SDK** — managed bundler / paymaster

これらは外部 SDK 依存を `peerDependencies` で受ける形で example 化する想定 (`@kiwa-test/aa-thirdweb` / `@kiwa-test/aa-safe` 等の subpackage 化も検討)。

## 偽陽性対策

`adversarial-pitfalls.md` の **#3 access control の partial 検証** に注意:

- smart account の owner 経路だけでなく、 **guardian / module / fallback handler 経由の signature 検証** も test に含める
- `validateUserOp` が **0 を返す (sigFailed)** ケースを必ず test (signature 不一致時)
- recovery 後に古い owner で signature 生成しても **isValidSignature が false 返す** ことを test

## 関連

- [API: WalletConfig.isContractAccount](../api/dapp-e2e-test.md#walletconfig)
- [Example: nextjs-aa-erc4337](https://github.com/cardene777/kiwa/tree/main/examples/nextjs-aa-erc4337)
- [Example: nextjs-aa-smart-account (簡略版)](https://github.com/cardene777/kiwa/tree/main/examples/nextjs-aa-smart-account)
