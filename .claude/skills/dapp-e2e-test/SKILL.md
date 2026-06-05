---
name: dapp-e2e-test
description: |
  dapp-e2e ツール (@dapp-e2e/core + @dapp-e2e/cli) を使った dApp e2e テストの設計・実装・実行を支援する汎用 skill。
  Playwright + viem + anvil のスタックで wallet inject / contract deploy / multi-chain / EIP-1271 / time-warp / RPC override 等の dApp 固有要件をカバーする。
  新規 dApp 導入 (pnpm dlx @dapp-e2e/cli init) と既存プロジェクトへの test 追加の両方に対応。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit, Agent
---

# /dapp-e2e-test — dapp-e2e ツール経由の dApp e2e テスト skill

`@dapp-e2e/core` の fixture と `@dapp-e2e/cli` の scaffold を使い、 anvil + viem + Playwright で動く dApp e2e テストを設計・作成・実行する。

dApp で「ユーザー操作 → wallet → contract → state 検証」の往復が必要な test を書く場面で本 skill を起動する。

## 前提

- Node.js 20+
- pnpm / npm / yarn のいずれか
- foundry (forge / anvil) — 未インストールなら `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- Playwright のブラウザバイナリ — `pnpm exec playwright install`

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--init` — 新規 dApp プロジェクトに dapp-e2e を導入 (`pnpm dlx @dapp-e2e/cli init` を実行し scaffold 生成)
- `--mode {new|extend|debug}` — `new` (新規 test 設計) / `extend` (既存 test 拡張) / `debug` (flaky / fail 解析)
- `--rounds {N}` — N round 連続 PASS 検証 (flaky 0 件確認、 デフォルト 1)
- `--no-codex` — Codex 委譲をスキップして単独で進行 (test 件数 1-2 のみ推奨)

## 実行フロー

### Step 0: dapp-e2e セットアップ判定

| 状態 | 判定 | 進行先 |
|---|---|---|
| 未導入 | `package.json` に `@dapp-e2e/core` 無し | Step 1 (init) |
| 導入済・新規 test | dapp-e2e 導入済、 該当 test ファイル無し | Step 2 |
| 導入済・拡張 / debug | 既存 test を拡張 / fix | Step 2' |

### Step 1: 新規導入 (`--init`)

```bash
pnpm dlx @dapp-e2e/cli init
pnpm install
```

生成物:
- `e2e/connect.spec.ts` (sample test)
- `playwright.config.ts` (webServer + fixture 設定)
- `tests/prepare-env.ts` (anvil 起動 + contract deploy)

### Step 1.5: プロジェクト読込 + test 仕様書生成 (必須)

spec.ts 実装の前に必ず test 仕様書を生成し、 受入条件 (AC) を明示する。

#### 1.5.A プロジェクト読込

対象 dApp の contract / 既存 test / UI から **test 対象機能を構造化** する。

```bash
ls contracts/ tests/ app/ 2>/dev/null
wc -l contracts/*.sol tests/*.spec.ts 2>/dev/null
grep -E "function |event |error |modifier " contracts/*.sol | head -30
grep -E "^test\(|^test\.describe\(" tests/*.spec.ts | head -20
```

#### 1.5.B test 仕様書生成

`docs/test-spec/{example}.md` (もしくは `tests/spec/{example}.md`) を Write。 構造は以下:

```markdown
# test-spec-{example}.md

## 対象 dApp

`{path/to/example}` — 1-2 文で「何をする dApp か」を要約

## 既存 test (現状)

| test 名 | 検証内容 | 状態 |
|---|---|---|
| T-XX-001 | ... | EXISTING / NEW |

## 新規追加 test (本作業)

| test 名 | 検証内容 | AC (受入条件) | 偽陽性リスク |
|---|---|---|---|
| T-XX-NNN | {何を assertion するか 1 文} | {test PASS の判定基準} | {`adversarial-pitfalls.md` の 9 種番号 or "なし"} |

## contract 改変 (もしあれば)

| file | 変更内容 | back-compat 保証 |
|---|---|---|

## scope 境界 (やらないこと明示)

- ... (scope creep 防止のため列挙)

## 影響範囲

- 既存 test 件数 への regression 可能性
- 他 example への影響
```

#### 1.5.C 仕様書ベースで実装

仕様書の「新規追加 test」表 の各行を 1 つずつ spec.ts に落とし込む。 AC が曖昧なまま実装に進まない。
test 名 (T-XX-NNN) は仕様書と spec.ts で一致させる。

template: `examples/test-spec-template.md`

### Step 2: 3 layer 設計

dApp test は以下 3 layer で構造化:

| layer | 責務 | API |
|---|---|---|
| 1. infra | anvil 起動・port 確保・cluster (multi-chain) | `startAnvil` / `startAnvilCluster` / `getFreePort` / `runE2EPrepareEnv` |
| 2. contract | 契約 deploy・ABI 読込・event listen | `deployContract` / `loadForgeArtifact` / `waitForChainState` |
| 3. UI / wallet | Playwright で UI 操作・wallet inject・sign | `dappE2eTest` (fixture) / `createRpcHandler` / `verifySignature` |

### Step 3: 既存 example pattern 参照

`@dapp-e2e/core` のリポジトリ (https://github.com/cardene777/dapp-e2e) には 19 example が含まれており、 用途別の典型実装を学べる。

| 用途 | example | 学べるパターン |
|---|---|---|
| 単純 wallet connect | `basic-connect` | window.ethereum inject、 connect button |
| ERC-20 transfer | `defi-swap` | approve / transferFrom、 token balance check |
| NFT mint + ownership | `mint-nft` | tokenId 抽出、 ownerOf assertion |
| Marketplace | `nft-marketplace` | listing / offer / royalty split |
| AA (ERC-4337 簡略) | `nextjs-aa-smart-account` | smart account deploy、 executeBatch、 guardian recovery |
| Bridge (cross-chain) | `nextjs-bridge` | L1 lock / L2 mint、 burn / unlock、 replay 防御 |
| DAO governance | `nextjs-dao-vote` | propose / vote / timelock execute |
| ENS resolver | `nextjs-ens-resolver` | name register、 collision |
| ERC-1155 game | `nextjs-erc1155-game` | batch ops、 burn |
| event filter | `nextjs-event-history` | getLogs、 multi-indexed filter |
| lending | `nextjs-lending` | borrow / liquidation、 max LTV |
| **multi-chain** | `nextjs-multi-chain` | startAnvilCluster、 chain switch、 独立 balance |
| permit (EIP-2612) | `nextjs-permit-swap` | signTypedData、 permit deadline |
| staking + reward | `nextjs-staking` | reward overflow、 unstake penalty |
| token-gating + TTL | `nextjs-token-gating` | grantTimedAccess、 transfer revoke |
| vesting schedule | `nextjs-vesting` | immutability、 cliff |
| wagmi + RainbowKit | `nextjs-wagmi-rainbow` | RPC reconnect、 error recovery |
| zk verifier (mock) | `nextjs-zk-verifier` | commit-reveal、 range proof |

### Step 4: contract deploy + prepare-env 設計

```ts
// tests/prepare-env.ts
import { runE2EPrepareEnv, loadForgeArtifact } from '@dapp-e2e/core';

await runE2EPrepareEnv({
  envFile: '.env.local',
  port: 8551,
  deploy: async ({ wallet, publicClient }) => {
    const artifact = loadForgeArtifact({ path: 'forge-out/MyContract.sol/MyContract.json' });
    const hash = await wallet.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode.object,
      args: [arg1, arg2],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return {
      NEXT_PUBLIC_MY_CONTRACT: receipt.contractAddress!,
    };
  },
});
```

multi-chain test では `startAnvilCluster`:

```ts
const cluster = await startAnvilCluster({
  chains: [
    { id: 31337, port: 8554, name: 'chain-a' },
    { id: 31338, port: 8555, name: 'chain-b' },
  ],
});
```

### Step 5: spec.ts 設計 (fixture 利用)

```ts
import { test, expect } from './fixture'; // dappE2eTest 経由

test('T-XX-001 my flow', async ({ page, anvilPort }) => {
  const { wallet, pub } = makeClients(anvilPort, OWNER_PK);
  await page.goto('/');
  await page.getByTestId('connect-button').click();

  await wallet.writeContract({
    address: contract,
    abi: ABI,
    functionName: 'doSomething',
    args: [42n],
  });

  await waitForChainState({
    publicClient: pub,
    condition: async () => {
      const v = await pub.readContract({ address: contract, abi: ABI, functionName: 'value' });
      return v === 42n;
    },
  });

  await expect(page.getByTestId('value-display')).toHaveText('42');
});
```

### Step 6: revert 検証パターン

`@dapp-e2e/core` に `expectCustomError` helper が含まれる (v0.2 以降)。
それ未満のバージョンは自前で書く:

```ts
function expectCustomError(error: unknown, errorName: string): void {
  if (!(error instanceof BaseError)) throw error;
  const reverted = error.walk((c) => c instanceof ContractFunctionRevertedError);
  if (!(reverted instanceof ContractFunctionRevertedError)) throw error;
  expect(reverted.data?.errorName).toBe(errorName);
}
```

### Step 7: 実行と N round 連続 PASS 検証

```bash
cd examples/<your-example>
forge build      # contract artifact 生成
pnpm test        # playwright test 1 round
```

flaky 検証は 4 round 連続 PASS で固定。
並列実行は `@dapp-e2e/core` の build race を起こすため sequential 厳守。

### Step 8: 任意 — adversarial review

新規 contract や大幅な test 追加で false positive (test PASS でも bug 検出不能) を避けたい場合、 adversarial review を実施することを推奨。

代表的偽陽性パターン:

- **固定 nonce 偽陽性** — replay 検証 test で固定値 nonce を使うと nonce 伝搬経路が壊れても PASS する → 動的に取得した nonce を使う
- **UI 経由していない E2E** — UI ボタンを通らず直接 RPC で writeContract する test は UI regression を素通りする → Playwright で `page.getByTestId(...).click()` を介する
- **access control の partial 検証** — `hasAccess(user)` だけ確認し grantor / msg.sender 経路を叩かないと self-grant bypass を素通りする → 全エントリポイントを叩く
- **time-warp の副作用** — `evm_increaseTime` で進めた時間が次 test に残ると flaky 化する → `snapshotChain` / `revertChain` で test 間隔離

詳細 9 種 + self-check 5 問は `references/adversarial-pitfalls.md`。

## 完了条件

- 新規 test の場合 — spec.ts と prepare-env.ts が記述され、 `pnpm test` で全 PASS
- 拡張の場合 — 既存 test の regression 0 件、 新規 test も含めて全 PASS
- 4 round 連続 PASS で flaky 0 件 (公開前は必須)
- contract 変更を伴う場合 — adversarial review 1 round 推奨

## references

- `references/example-patterns.md` — 19 example の用途別 index と典型コード
- `references/fixture-api.md` — `@dapp-e2e/core` 主要 export API リファレンス
- `references/troubleshooting.md` — webServer 起動失敗・anvil port 衝突・core build race 対策
- `references/adversarial-pitfalls.md` — 偽陽性パターン 9 種 + self-check 5 問

## examples

- `examples/test-spec-template.md` — Step 1.5 で生成する test 仕様書のサンプル (token-gating ベース)
- `examples/single-contract.ts` — 1 contract happy path 雛形
- `examples/multi-chain.ts` — startAnvilCluster + chain 切替雛形
- `examples/custom-error-revert.ts` — expectCustomError パターン

## 関連 link

- リポジトリ: https://github.com/cardene777/dapp-e2e
- 公式 docs (JP+EN 対訳): `docs/{ja,en}/{quickstart,concepts,api,cookbook,faq}.md`
- npm: `@dapp-e2e/core` / `@dapp-e2e/cli` / `@dapp-e2e/cookbook`
