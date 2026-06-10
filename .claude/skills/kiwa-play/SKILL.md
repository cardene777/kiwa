---
name: kiwa-play
description: |
  kiwa (@kiwa/core + @kiwa/cli) を使った dApp e2e テストの設計・実装・実行を支援する汎用 skill。
  Playwright + viem + anvil のスタックで wallet inject / contract deploy / multi-chain / EIP-1271 / time-warp / RPC override 等の dApp 固有要件をカバーする。
  新規 dApp 導入 (pnpm dlx @kiwa/cli init) と既存プロジェクトへの test 追加の両方に対応。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit, Agent
---

# /kiwa-play — kiwa経由の dApp e2e テスト skill

`@kiwa/core` の fixture と `@kiwa/cli` の scaffold を使い、 anvil + viem + Playwright で動く dApp e2e テストを設計・作成・実行する。

dApp で「ユーザー操作 → wallet → contract → state 検証」の往復が必要な test を書く場面で本 skill を起動する。

## 前提

- Node.js 20+
- pnpm / npm / yarn のいずれか
- foundry (forge / anvil) — 未インストールなら `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- Playwright のブラウザバイナリ — `pnpm exec playwright install`

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--init` — 新規 dApp プロジェクトに kiwa を導入 (`pnpm dlx @kiwa/cli init` を実行し scaffold 生成)
- `--mode {new|extend|debug}` — `new` (新規 test 設計) / `extend` (既存 test 拡張) / `debug` (flaky / fail 解析)
- `--rounds {N}` — N round 連続 PASS 検証 (flaky 0 件確認、 デフォルト 1)
- `--lang {ja|en|<ISO 639-1>}` — 文書生成言語 (省略時は Step 0a で AskUserQuestion、 詳細 `references/doc-language-selection.md`)
- `--no-codex` — Codex 委譲をスキップして単独で進行 (test 件数 1-2 のみ推奨)
- `--no-review` — Step 9 の kiwa-review 自動呼出 (test-review) を skip (CI / 自動化用)

## 実行フロー

### Step 0a: 文書生成言語の選択 (skill 起動時 1 回)

AskUserQuestion で spec / report 等の文書生成言語を user に確認する。 `--lang {code}` 引数指定時は skip。

選択肢 — 🇯🇵 日本語 (ja、 Recommended) / 🇬🇧 English (en) / 🌏 その他多言語 (free input、 ISO 639-1 言語コード)。 詳細仕様は `references/doc-language-selection.md` を Read。

確定後の言語 `$DOC_LANG` は以降の文書生成 step (Layer 1 経由 spec 生成 / spec.ts 内コメント言語 / 将来の report 出力) で参照する。

### Step 0: kiwa セットアップ判定

| 状態 | 判定 | 進行先 |
|---|---|---|
| 未導入 | `package.json` に `@kiwa/core` 無し | Step 1 (init) |
| 導入済・新規 test | kiwa 導入済、 該当 test ファイル無し | Step 2 |
| 導入済・拡張 / debug | 既存 test を拡張 / fix | Step 2' |

### Step 1: 新規導入 (`--init`)

```bash
pnpm dlx @kiwa/cli init
pnpm install
```

生成物:
- `e2e/connect.spec.ts` (sample test)
- `playwright.config.ts` (webServer + fixture 設定)
- `tests/prepare-env.ts` (anvil 起動 + contract deploy)

### Step 1.5: Layer 1 経由でテスト仕様書生成 (必須、 Phase E-3 で refactor 済)

spec.ts 実装の前に必ず Layer 1 skill (`/kiwa-design`) を起動し、 SSOT (`docs/SKILL-DESIGN.ja.md`) 準拠の 9 section + 9 column 仕様書を生成する。 独自 template ではなく Layer 1 出力を消費する設計に統一 (旧 template 経路は廃止、 kiwa Phase E-3 refactor)。

#### 1.5.A プロジェクト読込

対象 dApp の contract / 既存 test / UI から **test 対象機能を構造化** する (Layer 1 への入力素材を収集)。

```bash
ls contracts/ tests/ app/ 2>/dev/null
wc -l contracts/*.sol tests/*.spec.ts 2>/dev/null
grep -E "function |event |error |modifier " contracts/*.sol | head -30
grep -E "^test\(|^test\.describe\(" tests/*.spec.ts | head -20
```

#### 1.5.B Layer 1 (`/kiwa-design`) 起動

以下を Layer 1 に渡し、 `tests/spec/e2e/test-spec-{example}.md` を Write させる。

```text
/kiwa-design --layer e2e --module {example} --input {path/to/contract.sol or app/}

入力情報:
- 対象 dApp = {example 名} (1-2 文で機能要約)
- 既存 contract / 既存 test の grep 結果 (1.5.A の出力)
- contract 改変 (あれば function / event / error 単位で diff 明示)
- scope 境界 (本作業でやらないことを 3-5 個列挙)
```

Layer 1 が以下 9 section の仕様書を `tests/spec/e2e/test-spec-{example}.md` に Write する (詳細は `.claude/skills/kiwa-design/SKILL.md` § 出力フォーマット):

- 対象機能 / 仕様の要約 / 主な品質リスク / 推奨テスト構成 / テスト観点一覧 / テストケース一覧 / 自動化すべきテスト / 手動確認でよいテスト / 不足している仕様

#### 1.5.C 仕様書ベースで実装 (Layer 2 = 本 skill の責務)

Layer 1 出力 `tests/spec/e2e/test-spec-{example}.md` を Read し、 「テストケース一覧」 section の 9 column 表を **行単位** で `tests/{example}.spec.ts` の test 関数に変換する。

| Layer 1 column | spec.ts への変換 |
|---|---|
| `テスト ID` (TC-NNN) | `test('TC-NNN ...', async () => {...})` の関数名 |
| `テストレベル` (E2E / 統合) | E2E → `test()`、 統合 → `test()` + mock RPC |
| `テスト観点` (正常系 / 異常系 / 境界値 ...) | `test.describe('観点 N: {name}', () => {...})` の group block |
| `前提条件` | test 開始時の `await fixture.setup(...)` 経路 |
| `入力値` | wallet / contract call の args |
| `操作手順` | `await page.click(...)` / `await wallet.writeContract(...)` 等 |
| `期待結果` | `await expect(...)` / `await waitForChainState(...)` 等 |
| `優先度` | spec.ts 内のコメント (高 = `// HIGH-PRIORITY`) |
| `自動化` (推奨/手動) | 「手動」のケースは spec.ts に含めず docs に分離 |

観点 → Playwright helper の完全マッピングは `.claude/skills/kiwa-design/references/layer2-bridge.md` § Playwright を参照。

#### 1.5.D 旧 template との backward-compat

旧 `examples/test-spec-template.md` (独自 8 column) は Phase E-3 以前の test 仕様書を Read する場合のみ参照用に残す。 新規 test 仕様書は **必ず Layer 1 経由で 9 column 表** を生成する。

### Step 2: 3 layer 設計

dApp test は以下 3 layer で構造化:

| layer | 責務 | API |
|---|---|---|
| 1. infra | anvil 起動・port 確保・cluster (multi-chain) | `startAnvil` / `startAnvilCluster` / `getFreePort` / `runE2EPrepareEnv` |
| 2. contract | 契約 deploy・ABI 読込・event listen | `deployContract` / `loadForgeArtifact` / `waitForChainState` |
| 3. UI / wallet | Playwright で UI 操作・wallet inject・sign | `dappE2eTest` (fixture) / `createRpcHandler` / `verifySignature` |

### Step 3: 既存 example pattern 参照

`@kiwa/core` のリポジトリ (https://github.com/cardene777/kiwa) には 22 example が含まれており、 用途別の典型実装を学べる。

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
import { runE2EPrepareEnv, loadForgeArtifact } from '@kiwa/core';

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

`@kiwa/core` に `expectCustomError` helper が含まれる (v0.2 以降)。
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
並列実行は `@kiwa/core` の build race を起こすため sequential 厳守。

### Step 8: 任意 — adversarial review

新規 contract や大幅な test 追加で false positive (test PASS でも bug 検出不能) を避けたい場合、 adversarial review を実施することを推奨。

代表的偽陽性パターン:

- **固定 nonce 偽陽性** — replay 検証 test で固定値 nonce を使うと nonce 伝搬経路が壊れても PASS する → 動的に取得した nonce を使う
- **UI 経由していない E2E** — UI ボタンを通らず直接 RPC で writeContract する test は UI regression を素通りする → Playwright で `page.getByTestId(...).click()` を介する
- **access control の partial 検証** — `hasAccess(user)` だけ確認し grantor / msg.sender 経路を叩かないと self-grant bypass を素通りする → 全エントリポイントを叩く
- **time-warp の副作用** — `evm_increaseTime` で進めた時間が次 test に残ると flaky 化する → `snapshotChain` / `revertChain` で test 間隔離

詳細 9 種 + self-check 5 問は `references/adversarial-pitfalls.md`。

### Step 9: kiwa-review 自動呼出 (test-review mode)

Step 7 (4 round 連続 PASS) 完了後、 生成 spec.ts の品質を独立 review する。 `/kiwa-review --mode test-review --module {module} --test-path tests/*.spec.ts` を内部呼出し、 spec vs spec.ts 整合 / 観点別 cover 率 / UI 起点 e2e で追加すべき test 提案 を 5 軸で判定。

呼出例:
```text
/kiwa-review --mode test-review --module token-gating --layer e2e --lang $DOC_LANG
```

review 結果は contract skill (kiwa-forge / kiwa-hardhat) と同形式。 report 出力先: `tests/reports/review/test-review-{module}.{$DOC_LANG}.md`。

`--no-review` 引数で skip 可能 (CI 用)。

## 完了条件

- 新規 test の場合 — spec.ts と prepare-env.ts が記述され、 `pnpm test` で全 PASS
- 拡張の場合 — 既存 test の regression 0 件、 新規 test も含めて全 PASS
- 4 round 連続 PASS で flaky 0 件 (公開前は必須)
- contract 変更を伴う場合 — adversarial review 1 round 推奨

## references

- `references/example-patterns.md` — 22 example の用途別 index と典型コード
- `references/fixture-api.md` — `@kiwa/core` 主要 export API リファレンス
- `references/troubleshooting.md` — webServer 起動失敗・anvil port 衝突・core build race 対策
- `references/adversarial-pitfalls.md` — 偽陽性パターン 9 種 + self-check 5 問
- `references/doc-language-selection.md` — Step 0a 文書生成言語選択 共通 SSOT (kiwa-forge と共用、 ja / en / その他 ISO 639-1)

## examples

- `examples/test-spec-template.md` — Step 1.5 で生成する test 仕様書のサンプル (token-gating ベース)
- `examples/single-contract.ts` — 1 contract happy path 雛形
- `examples/multi-chain.ts` — startAnvilCluster + chain 切替雛形
- `examples/custom-error-revert.ts` — expectCustomError パターン

## 関連 link

- リポジトリ: https://github.com/cardene777/kiwa
- 公式 docs (JP+EN 対訳): `docs/{ja,en}/{quickstart,concepts,api,cookbook,faq}.md`
- npm: `@kiwa/core` / `@kiwa/cli` / `@kiwa/cookbook`
