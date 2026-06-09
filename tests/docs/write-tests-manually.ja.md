# `@kiwa/core` を library として import して test を手書きする手順

> [🇬🇧 English](./write-tests-manually.md) • [🇯🇵 日本語](./write-tests-manually.ja.md)

skill (`/kiwa-test` / `/kiwa-play` 等) を使わず、 `@kiwa/core` を npm library として直接 import して自分で test を書く経路。 既存 dApp プロジェクトに kiwa を library として組み込む / skill 生成 test を読みづらいので自前で書きたい / 一部 fixture だけ流用したい 等の use case 向け。

skill 経由で 0 から自動生成したい場合は `tests/docs/run-tests.ja.md` を読む。

## いつ library 直接利用を選ぶか

| 状況 | 推奨経路 |
|---|---|
| 新規 dApp に kiwa を導入、 test を 0 から自動生成 | skill 経由 (`tests/docs/run-tests.ja.md`) |
| 既存 dApp に test を後付け追加、 観点 / 設計を kiwa の AI に任せる | skill 経由 (`tests/docs/retrofit-existing-dapp.ja.md`) |
| 既存 dApp に **手書きで** test を追加、 fixture / helper だけ kiwa 流用 | **本 docs (library 直接利用)** |
| skill 生成 test を読み replace / 一部 helper だけ kiwa に置換 | 本 docs |
| 既存 Hardhat / Foundry project に anvil 起動 helper だけ流用 | 本 docs (`startAnvil` / `startAnvilCluster` だけ import) |

## Step 0 — 前提環境 + install

自分の dApp project root で実行。

```bash
# @kiwa/core を install (主要 dep)
pnpm add -D @kiwa/core @playwright/test viem

# Foundry (anvil 起動用) PATH 上
anvil --version

# Playwright chromium
pnpm exec playwright install chromium
```

`package.json` の `"type"` を `"module"` に設定 (kiwa-core は ESM)。

## Step 1 — playwright.config.ts を書く

`@kiwa/core` の fixture は Playwright 標準 `test` を拡張した形。 通常 Playwright config をそのまま使える。

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,    // anvil 共有のため並列禁止
  reporter: 'list',
  use: {
    headless: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

## Step 2 — `tests/prepare-env.ts` で anvil 起動 + contract deploy

`@kiwa/core` の `runE2EPrepareEnv` で anvil 子プロセス起動 + contract deploy + `.env.local` 出力を 1 関数化。

```typescript
// tests/prepare-env.ts
import { runE2EPrepareEnv, loadForgeArtifact } from '@kiwa/core';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

await runE2EPrepareEnv({
  envFile: resolve(exampleRoot, '.env.local'),
  port: 8551,    // 他 example と衝突しない port
  deploy: async ({ wallet, publicClient }) => {
    // forge build で生成された artifact を Read
    const artifact = loadForgeArtifact({
      path: resolve(exampleRoot, 'forge-out/MintNft.sol/MintNft.json'),
    });
    const hash = await wallet.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode.object,
      args: ['MyNft', 'MNFT'],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return {
      NEXT_PUBLIC_MINT_NFT: receipt.contractAddress!,
    };
  },
});
```

`runE2EPrepareEnv` は以下を担当:

- `getFreePort` で port 確保 (引数の port が衝突したら自動切替)
- `startAnvil` で anvil 子プロセス起動
- `deploy` callback で wallet client を渡して contract を deploy
- `.env.local` に deploy address を書き出し
- process 終了時に anvil を自動 stop

## Step 3 — `tests/{module}.spec.ts` 本体を手書き

`dappE2eTest` fixture を import して Playwright test を書く。 fixture は `anvilPort` を自動注入。

### 最小 sample (mint-nft 1 contract、 happy path)

```typescript
// tests/mint.spec.ts
import { test, expect } from '@playwright/test';
import { dappE2eTest } from '@kiwa/core';
import { createPublicClient, createWalletClient, http, defineChain, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

// anvil 用 wallet (固定 PK、 test only)
const MINTER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;

// contract ABI
const nftArtifact = JSON.parse(
  readFileSync(resolve(exampleRoot, 'forge-out/MintNft.sol/MintNft.json'), 'utf8')
);

dappE2eTest('TC-001 mint で balance +1', async ({ anvilPort, page }) => {
  const chain = defineChain({
    id: 31337,
    name: 'anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${anvilPort}`] } },
  });

  const publicClient = createPublicClient({ chain, transport: http() });
  const walletClient = createWalletClient({
    chain,
    transport: http(),
    account: privateKeyToAccount(MINTER_PK),
  });

  const nftAddress = process.env.NEXT_PUBLIC_MINT_NFT as Address;

  // 操作: UI 経由で mint button click → wallet 署名 → tx 送信
  await page.goto('http://127.0.0.1:3000');
  await page.getByTestId('connect-button').click();
  await page.getByTestId('mint-button').click();

  // 期待: balance が 0 → 1 に変化
  const balance = await publicClient.readContract({
    address: nftAddress,
    abi: nftArtifact.abi,
    functionName: 'balanceOf',
    args: [walletClient.account.address],
  });

  expect(balance).toBe(1n);
});
```

### 複数 contract 連携 sample (nft-marketplace、 mint → list → buy)

```typescript
// tests/marketplace.spec.ts
import { dappE2eTest } from '@kiwa/core';
import { expect } from '@playwright/test';
import {
  createPublicClient, createWalletClient, http, defineChain,
  parseEther, type Address,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(__dirname, '..');

const SELLER_PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const;
const BUYER_PK  = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' as const;

const nftArtifact = JSON.parse(readFileSync(resolve(exampleRoot, 'forge-out/MarketNft.sol/MarketNft.json'), 'utf8'));
const marketArtifact = JSON.parse(readFileSync(resolve(exampleRoot, 'forge-out/SimpleMarketplace.sol/SimpleMarketplace.json'), 'utf8'));

dappE2eTest('TC-001 mint → list → buy で owner が seller から buyer に移転', async ({ anvilPort }) => {
  const chain = defineChain({
    id: 31337, name: 'anvil',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [`http://127.0.0.1:${anvilPort}`] } },
  });
  const publicClient = createPublicClient({ chain, transport: http() });
  const seller = createWalletClient({ chain, transport: http(), account: privateKeyToAccount(SELLER_PK) });
  const buyer = createWalletClient({ chain, transport: http(), account: privateKeyToAccount(BUYER_PK) });

  const nftAddr = process.env.NEXT_PUBLIC_NFT as Address;
  const marketAddr = process.env.NEXT_PUBLIC_MARKETPLACE as Address;

  // 1. seller が NFT を mint
  const mintHash = await seller.writeContract({
    address: nftAddr, abi: nftArtifact.abi,
    functionName: 'mint', args: [seller.account.address],
  });
  await publicClient.waitForTransactionReceipt({ hash: mintHash });

  // 2. seller が marketplace に NFT を approve
  await seller.writeContract({
    address: nftAddr, abi: nftArtifact.abi,
    functionName: 'setApprovalForAll', args: [marketAddr, true],
  });

  // 3. seller が listing
  await seller.writeContract({
    address: marketAddr, abi: marketArtifact.abi,
    functionName: 'list', args: [1n, parseEther('1')],
  });

  // 4. buyer が buy (1 ETH 支払い)
  const buyHash = await buyer.writeContract({
    address: marketAddr, abi: marketArtifact.abi,
    functionName: 'buy', args: [1n], value: parseEther('1'),
  });
  await publicClient.waitForTransactionReceipt({ hash: buyHash });

  // 5. 期待: NFT owner が buyer に
  const owner = await publicClient.readContract({
    address: nftAddr, abi: nftArtifact.abi,
    functionName: 'ownerOf', args: [1n],
  });
  expect(owner).toBe(buyer.account.address);
});
```

### snapshot / revert で test 間隔離 sample

`@kiwa/core` の `snapshotChain` / `revertChain` で各 test を独立化:

```typescript
import { dappE2eTest } from '@kiwa/core';
import { snapshotChain, revertChain, increaseTime } from '@kiwa/core';
import { expect } from '@playwright/test';
import type { Hex } from 'viem';

let snapshotId: Hex;

dappE2eTest.beforeEach(async ({ anvilPort }) => {
  // 各 test 前に anvil state を snapshot
  const publicClient = makePublicClient(anvilPort);
  snapshotId = await snapshotChain(publicClient);
});

dappE2eTest.afterEach(async ({ anvilPort }) => {
  // 各 test 後に snapshot 時点へ revert (副作用を完全排除)
  const publicClient = makePublicClient(anvilPort);
  await revertChain(publicClient, snapshotId);
});

dappE2eTest('TC-VESTING-001 cliff 経過後 release', async ({ anvilPort }) => {
  const publicClient = makePublicClient(anvilPort);
  await increaseTime(publicClient, 30 * 24 * 60 * 60);  // 30 day 進める
  // vesting contract release を assertion
});

dappE2eTest('TC-VESTING-002 cliff 前は release が 0', async ({ anvilPort }) => {
  // 上 test で 30 day 進んだ state は revert され、 cliff 前から始まる
});
```

### custom error の revert を assertion する sample

```typescript
import { dappE2eTest } from '@kiwa/core';
import { expectCustomError } from '@kiwa/core';

dappE2eTest('TC-001 OnlyOwner で revert', async ({ anvilPort }) => {
  const publicClient = makePublicClient(anvilPort);
  const attacker = createWalletClient({ /* attacker account */ });

  try {
    await attacker.writeContract({
      address: nftAddr, abi: nftArtifact.abi,
      functionName: 'mint', args: [attacker.account.address],
    });
    throw new Error('should have reverted');
  } catch (error) {
    // viem の BaseError chain walk で custom error を assertion
    expectCustomError(error, 'OnlyOwner');
  }
});
```

## Step 4 — package.json に test script 追加

```json
{
  "scripts": {
    "test": "node --import tsx tests/prepare-env.ts && playwright test",
    "test:headed": "node --import tsx tests/prepare-env.ts && playwright test --headed"
  }
}
```

`prepare-env.ts` を Playwright `globalSetup` で書く形式もあり (Playwright 標準):

```typescript
// playwright.config.ts
export default defineConfig({
  globalSetup: './tests/prepare-env.ts',
  // ...
});
```

## Step 5 — 実走 + flaky 検査

```bash
# 単発
pnpm test

# 4 round 連続 flaky 検査
for r in 1 2 3 4; do echo "=== Round $r ==="; pnpm test 2>&1 | tail -3; done
```

## `@kiwa/core` 主要 API 早見表

詳細は `docs/ja/api/README.md`。

| Function | 役割 | 使い方 |
|---|---|---|
| `dappE2eTest` | Playwright `test` 拡張 fixture (anvilPort 注入) | `dappE2eTest('TC-001 ...', async ({ anvilPort, page }) => {...})` |
| `startAnvil` | anvil 子プロセス spawn | `const handle = await startAnvil({ port })` |
| `startAnvilCluster` | 複数 chain id の anvil 同時起動 | `const cluster = await startAnvilCluster({ chains: [...] })` |
| `startAnvilFork` | mainnet / sepolia fork | `startAnvilFork({ forkUrl, blockNumber, port })` |
| `loadForgeArtifact` | forge-out/X.sol/X.json を Read + ABI / bytecode 抽出 | `const { abi, bytecode } = loadForgeArtifact({ path })` |
| `runE2EPrepareEnv` | anvil 起動 + deploy callback + .env.local 書出 1 関数 | `await runE2EPrepareEnv({ port, deploy: async ({ wallet }) => {...} })` |
| `waitForChainState` | predicate ベース contract view ポーリング | `await waitForChainState({ client, predicate: () => ..., timeout })` |
| `snapshotChain` / `revertChain` | anvil state snapshot / revert | beforeEach / afterEach で test 間隔離 |
| `increaseTime` / `mineBlock` / `setNextBlockTimestamp` | 時間操作 | vesting / TTL / timelock 系 test |
| `impersonateAccount` / `setBalance` | 任意 address に impersonate / balance 注入 | `impersonateAccount(client, addr)` |
| `expectEvent` | tx receipt から event 抽出 + assertion | `expectEvent(receipt, abi, 'Transfer', [from, to, 1n])` |
| `expectCustomError` | viem BaseError chain walk で custom error 名 assertion | `expectCustomError(error, 'OnlyOwner')` |
| `expectBalanceChange` / `expectEthBalanceChange` | hardhat-chai-matchers 互換 balance 差分 assertion | `expectEthBalanceChange(client, addr, parseEther('1'), action)` |
| `getFreePort` | OS allocate された free port を取得 | port 衝突回避 |

## library 直接利用 vs skill 経由 の選び方

| 観点 | library 直接 | skill 経由 |
|---|---|---|
| test 設計 | user が手書き、 観点 / 件数を user が判断 | skill が 11 観点 catalog + 5 軸 review で自動設計 |
| spec ドキュメント | 任意 (user が必要なら自分で書く) | tests/spec/{layer}/test-spec-X.md が自動生成 |
| coverage 100% | user が手動で test 追加 | auto loop で 100% or 不可能判定まで自動 |
| 品質 review | user が PR review で目視 | spec-review / test-review / result-review が自動実行 |
| 学習コスト | 低 (Playwright + viem 知ってれば書ける) | skill 仕様の把握必要 |
| 用途 | 既存 test 追加 / 一部 fixture 流用 | 0 から大規模 test suite を作る、 OSS 公開水準 |

## トラブルシューティング

| 症状 | 対処 |
|---|---|
| `Cannot find module '@kiwa/core'` | `pnpm add -D @kiwa/core` で install、 `pnpm -F @kiwa/core build` で build (monorepo の場合) |
| `ReferenceError: require is not defined` | package.json に `"type": "module"` 追加 |
| `Executable doesn't exist .../chrome-headless-shell` | `pnpm exec playwright install chromium` |
| anvil port 衝突 (`EADDRINUSE: 8545`) | `pkill -f anvil` で既存 daemon 停止 or `getFreePort()` で動的 port |
| forge-out/*.json not found | `forge build` 実行で artifact 生成 |
| `process.env.NEXT_PUBLIC_X` が undefined | `prepare-env.ts` 内で deploy callback の return value に key を含める or `dotenv.config()` で `.env.local` 読込 |

## 関連 docs

- `@kiwa/core` API reference: `docs/ja/api/README.md`
- 各 API 詳細:
  - `docs/ja/api/dapp-e2e-test.md` (dappE2eTest fixture)
  - `docs/ja/api/start-anvil.md` (anvil 起動)
  - `docs/ja/api/test-helpers.md` (snapshot / time / event 系)
- cookbook (シナリオ別 sample):
  - `docs/ja/cookbook/snapshot-revert.md` (test 間隔離)
  - `docs/ja/cookbook/custom-error-revert.md` (revert assertion)
  - `docs/ja/cookbook/multi-wallet-signature.md` (multi-wallet)
  - `docs/ja/cookbook/multi-chain.md` (multi-chain)
- skill 経由で全自動: `tests/docs/run-tests.ja.md`
- 完成形 sample (実 file): `examples/{X}/tests/*.spec.ts` (mint-nft / defi-swap / nextjs-token-gating 等)
