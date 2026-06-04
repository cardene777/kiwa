# fixture-api.md

`@dapp-e2e/core` の主要 export API リファレンス。 詳細は dapp-e2e リポ `docs/en/api/` および `packages/core/src/index.ts` を Read。

## 主要 export

### `dappE2eTest` (fixture)

Playwright `test` の派生 fixture。 `page` に加えて `anvilPort` / `walletApi` / `chainId` を提供する。

```ts
import { dappE2eTest as test, expect } from '@dapp-e2e/core';

test('my test', async ({ page, anvilPort, walletApi }) => {
  // page は inject 済 window.ethereum を持つ
  // anvilPort は prepare-env が起動した anvil の port
  // walletApi は wallet operation helper
});
```

### `runE2EPrepareEnv`

anvil 起動 → contract deploy → `.env.local` 書き出しを 1 関数で完結。

```ts
import { runE2EPrepareEnv } from '@dapp-e2e/core';

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
import { deployContract, loadForgeArtifact } from '@dapp-e2e/core';

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
import { ANVIL_DEFAULT_PRIVATE_KEYS } from '@dapp-e2e/core';
const ownerPk = ANVIL_DEFAULT_PRIVATE_KEYS[0]; // 0xac0974be...
```

### `handleRpcRequest` / `RpcContext`

inject script 経由の RPC を local anvil に転送する処理。 wallet mock の中核。

```ts
import { handleRpcRequest, type RpcContext } from '@dapp-e2e/core';

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
