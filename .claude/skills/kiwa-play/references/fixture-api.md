# fixture-api.md

`@kiwa/core` の主要 export API リファレンス。 詳細は kiwa リポ `docs/en/api/` および `packages/core/src/index.ts` を Read。

## 主要 export

### `dappE2eTest` (fixture)

Playwright `test` の派生 fixture。 `page` に加えて `anvilPort` / `walletApi` / `chainId` を提供する。

```ts
import { dappE2eTest as test, expect } from '@kiwa/core';

test('my test', async ({ page, anvilPort, walletApi }) => {
  // page は inject 済 window.ethereum を持つ
  // anvilPort は prepare-env が起動した anvil の port
  // walletApi は wallet operation helper
});
```

### `runE2EPrepareEnv`

anvil 起動 → contract deploy → `.env.local` 書き出しを 1 関数で完結。

```ts
import { runE2EPrepareEnv } from '@kiwa/core';

await runE2EPrepareEnv({
  envFile: '.env.local',
  port: 8551,
  deploy: async ({ wallet, publicClient }) => {
    const hash = await wallet.deployContract({
      abi: ARTIFACT.abi,
      bytecode: ARTIFACT.bytecode.object,
      args: [...],
    });
    const r = await publicClient.waitForTransactionReceipt({ hash });
    return {
      NEXT_PUBLIC_CONTRACT: r.contractAddress!,
    };
  },
});
```

### `startAnvil` / `getFreePort` / `AnvilHandle`

低レベル anvil 起動 (single)。

```ts
const port = await getFreePort();
const handle: AnvilHandle = await startAnvil({ port });
// ...
await handle.kill();
```

### `startAnvilCluster` / `AnvilClusterHandle`

multi-chain test 用 (2+ anvil 同時起動)。

```ts
const cluster = await startAnvilCluster({
  chains: [
    { id: 31337, port: 8554, name: 'chain-a' },
    { id: 31338, port: 8555, name: 'chain-b' },
  ],
});

await cluster.kill();
```

### `deployContract` / `loadForgeArtifact`

contract deploy ヘルパー。

```ts
import { deployContract, loadForgeArtifact } from '@kiwa/core';

const artifact = loadForgeArtifact({
  path: 'forge-out/MyContract.sol/MyContract.json',
});

const { contractAddress } = await deployContract({
  walletClient,
  publicClient,
  artifact,
  args: [arg1, arg2],
});
```

### `waitForChainState`

contract state が条件を満たすまで polling 待機。

```ts
await waitForChainState({
  publicClient: pub,
  condition: async () => {
    const v = await pub.readContract({
      address: contract,
      abi: ABI,
      functionName: 'value',
    });
    return v === 42n;
  },
  timeoutMs: 10_000,
  intervalMs: 100,
});
```

### `verifyEip1271Signature` / `EIP1271_MAGIC_VALUE`

smart account 用 signature 検証。

```ts
const isValid = await verifyEip1271Signature({
  publicClient: pub,
  contractAddress: smartAccount,
  hash,
  signature,
});
// isValid === true なら EIP-1271 magic value (0x1626ba7e) が返る
```

### `ANVIL_DEFAULT_PRIVATE_KEYS`

anvil dev account 10 件の private key 配列 (テスト用、 本番禁止)。

```ts
import { ANVIL_DEFAULT_PRIVATE_KEYS } from '@kiwa/core';
const ownerPk = ANVIL_DEFAULT_PRIVATE_KEYS[0]; // 0xac0974be...
```

### `handleRpcRequest` / `RpcContext`

inject script 経由の RPC を local anvil に転送する処理。 wallet mock の中核。

```ts
import { handleRpcRequest, type RpcContext } from '@kiwa/core';

const ctx: RpcContext = {
  anvilPort: 8551,
  chainId: 31337,
  privateKey: ownerPk,
};

const response = await handleRpcRequest({ method: 'eth_chainId', params: [] }, ctx);
```

### `createInjectorScript`

Playwright `page.addInitScript()` に渡す inject script を生成。

```ts
await page.addInitScript(createInjectorScript({ chainId: 31337 }));
```

### `createRpcHandler` / `verifySignature` / `waitForPendingRpcs`

fixture 内で使う低レベル helper。

詳細は `packages/core/src/fixture.ts` を Read。

### `waitForWalletConnected`

`testid` 指定要素のテキストが期待値を含むまで polling 待機する。 wallet inject の race condition (connection-status が disconnected → connected に遷移する瞬間) を捕まえるために使う。 default `testId="connection-status"` / `expectedText="connected"` / `timeout=5000ms` / `pollInterval=100ms`。

```ts
import { waitForWalletConnected } from '@kiwa/core';

test('wallet connection completes', async ({ page }) => {
  await page.goto('/');
  await waitForWalletConnected(page);
  // ここから connected 前提の assertion を続けられる
});
```

引数で testId / expectedText / timeout / pollInterval を上書き可能。 timeout 超過時は `lastSeen` のテキストを含めた `Error` を throw する。

### `injectMultipleWallets`

`Browser` から N 個の `BrowserContext` を作成し、 各 context に別 PK wallet を `addInitScript` で inject する helper。 multi-user multi-context test (例 alice / bob が同 contract に対して同時 mint を race する) で使う。

```ts
import { injectMultipleWallets, ANVIL_DEFAULT_PRIVATE_KEYS } from '@kiwa/core';

test('alice and bob race to mint', async ({ browser }) => {
  const users = await injectMultipleWallets(browser, {
    alice: { privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[0]!, chainId: 31337 },
    bob:   { privateKey: ANVIL_DEFAULT_PRIVATE_KEYS[1]!, chainId: 31337 },
  }, { baseUrl: 'http://127.0.0.1:3000' });

  try {
    await Promise.all([
      users.alice.page.getByTestId('mint').click(),
      users.bob.page.getByTestId('mint').click(),
    ]);
    // 片方が成功、 片方が revert する race を検証
  } finally {
    await users.alice.close();
    await users.bob.close();
  }
});
```

引数 `entries` は `Record<string, {privateKey, chainId?, wallets?}>` で、 各 entry ごとに `BrowserContext + Page + close()` の 3 つを Record で返す。 `chainId` 省略時は `options.defaultChainId` (default 31337) が使われる。 途中で 1 つでも失敗したら作成済 context を全て close してから throw する。

### `setStorageSlot`

anvil の `anvil_setStorageAt` JSON-RPC を fetch で叩く wrapper。 contract storage slot を直接書き換えて UI と contract の乖離 (例 UI にハードコードされた SECRET 定数 vs contract storage の実値) を検出する test に使う。

```ts
import { setStorageSlot } from '@kiwa/core';

await setStorageSlot({
  rpcUrl: 'http://127.0.0.1:8545',
  address: '0x1234567890123456789012345678901234567890',
  slot: 3,                                                                              // number / bigint / hex
  value: '0x000000000000000000000000000000000000000000000000000000000000002a',           // 32-byte hex
});
```

引数 `slot` は `number` `bigint` `0x` 接頭辞の hex のいずれかを受け、 `value` は必ず 32 byte hex (0x + 64 hex chars)。 不正値は `Error` で throw。 RPC error 応答 (`error.code` / `error.message`) は `Error` として throw する。

## type 一覧

| type | 用途 |
|---|---|
| `ApprovalMode` | wallet 接続承認モード |
| `Eip6963ProviderInfo` | EIP-6963 multi-provider 識別子 |
| `WalletApi` / `WalletConfig` | wallet mock の操作 API / 設定 |
| `AnvilHandle` / `StartAnvilOptions` | single anvil 起動 |
| `AnvilClusterConfig` / `AnvilClusterHandle` | multi-chain anvil cluster |
| `PrepareEnvDeployContext` / `PrepareEnvDeployFn` / `PrepareEnvOptions` | runE2EPrepareEnv の引数 |
| `RpcContext` | RPC handler の context |
| `DeployContractOptions` / `DeployContractResult` | deployContract 戻り |
| `WaitForChainStateOptions` | waitForChainState 設定 |
| `WaitForWalletConnectedOptions` | waitForWalletConnected の testId / expectedText / timeout / pollInterval |
| `InjectMultipleWalletsEntry` / `InjectMultipleWalletsOptions` / `InjectMultipleWalletsResult` | injectMultipleWallets の引数 / 戻り値 |
| `SetStorageSlotParams` | setStorageSlot の引数 (rpcUrl / address / slot / value) |
