---
name: kiwa-play
description: |
  kiwa (@kiwa-lab/dapp + @kiwa-lab/cli) を使った dApp e2e テストの設計・実装・実行を支援する汎用 skill。
  Playwright + viem + anvil のスタックで wallet inject / contract deploy / multi-chain / EIP-1271 / time-warp / RPC override 等の dApp 固有要件をカバーする。
  新規 dApp 導入 (pnpm dlx @kiwa-lab/cli init) と既存プロジェクトへの test 追加の両方に対応。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-play — kiwa経由の dApp e2e テスト skill

`@kiwa-lab/dapp` の fixture と `@kiwa-lab/cli` の scaffold を使い、 anvil + viem + Playwright で動く dApp e2e テストを設計・作成・実行する。

dApp で「ユーザー操作 → wallet → contract → state 検証」の往復が必要な test を書く場面で本 skill を起動する。

## 前提

- Node.js 20+
- pnpm / npm / yarn のいずれか
- foundry (forge / anvil) — 未インストールなら `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- Playwright のブラウザバイナリ — `pnpm exec playwright install`
- 出力先 `tests/*.spec.ts` への Write 権限

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — spec / test file 名に入る module 名。 `--input-spec` を省略した時の path はこれを CLI に渡して解決する
- `--input-spec {path}` — Layer 1 spec の path (省略時は § 入力 spec の path は CLI から受け取る で解決)。 `/kiwa-design --layer e2e` が書く場所で、 `docs/layers.json` の `spec_path` がその宣言
- `--init` — 新規 dApp プロジェクトに kiwa を導入 (`pnpm dlx @kiwa-lab/cli init` を実行し scaffold 生成)
- `--mode {new|extend|debug}` — `new` (新規 test 設計) / `extend` (既存 test 拡張) / `debug` (flaky / fail 解析)
- `--rounds {N}` — N round 連続 PASS 検証 (flaky 0 件確認、 デフォルト 1)
- `--lang {ja|en|<ISO 639-1>}` — 文書生成言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--no-codex` — Codex 委譲をスキップして単独で進行 (test 件数 1-2 のみ推奨)
- `--no-review` — Step 9 の kiwa-review 自動呼出 (test-review) を skip (CI / 自動化用)

### 入力 spec の path は CLI から受け取る

`--input-spec` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill が扱う layer は `e2e` の 1 つ。

```bash
kiwa layers --json --layer e2e --lang "$DOC_LANG" --module "$MODULE"
```

`e2e` は dApp 向けで spec dir は `tests/spec/e2e/`。 `e2e-generic` (`/kiwa-e2e` が消費する汎用 browser layer) は別 layer で spec dir も違うため、 取り違えると別 skill 向けの spec を読む。

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

#### 解決に失敗したら止める

**exit code を見る。 0 でなければ中断して user に返す**。 pipeline で握り潰すと、 空 path を Read しようとして「spec が無い」 と報告することになり、 本当の原因 (layer 名の誤り / 不正な module / CLI 未 install) が消える。

判定は **件数ではなく「必要な layer が取れたか」**で行う。 `--layer` を省くと 30 件返るので、 件数で判定すると全 layer を一度に解決する経路が「異常」 に落ちる。

**「読める」 と「期待した形をしている」 を分ける**。 JSON として parse できることは、 中身が使える形だと言っていない。

| 結果 | 扱い |
|---|---|
| exit != 0 | stderr をそのまま user に返して中断 |
| stdout が JSON として読めない | 中断 (CLI 未 install / 別 command の出力) |
| `layers` が配列でない | 中断 (応答が壊れている) |
| 必要な `id` が `layers` に無い | layer 名が誤り。 中断 |
| 同じ `id` が 2 件以上ある | どちらを使うか決められない。 中断 |
| その layer の `spec_path` が文字列でない、 または空 | spec を持たないか応答が壊れている。 中断 |
| `spec_path` に `{module}` が残っている | `--module` が効いていない。 中断 |
| 上記いずれでもない | その `spec_path` を使う |

`.layers[] | select(.id == "<layer>")` で先に絞ってから、 取れた 1 件を見る。

`jq` が無い環境では `--json` の出力をそのまま読む。 `jq` は整形の手段であって、 解決の一部ではない。

#### 解決した値を下流に渡す

Step の最後で `/kiwa-review` を呼ぶ時、 **同じ layer と同じ `--lang` を渡す**。 渡さないと review が別の spec を読み、 生成した test と突き合わせる相手が変わる。

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 `--lang ja` を付けると Layer 1 が書いた file を Layer 2 が探せなかったのがこの形 (#1855 / #1861)。

本 SKILL.md 内の spec path 表記は説明のための例示で、 解決の指示ではない。

## 実行フロー

### Step 0a: 文書生成言語の決定 (skill 起動時 1 回)

`--lang` が渡っていればそれを使う。 渡っていなければ **起動元が渡した値、 単体起動なら `ja`** を既定にする (option 宣言と同じ規則)。

`/kiwa-app` や `/kiwa-test` から起動される経路では常に値が渡るため、 尋ねる契機は単体起動に限られる。 その場合も既定があるので **AskUserQuestion は出さない** = 既定が決まっている問いを毎回聞くと chain が止まる。

確定後の言語 `$DOC_LANG` は以降の文書生成 step (Layer 1 経由 spec 生成 / spec.ts 内コメント言語 / 将来の report 出力) と入力 spec の解決で参照する。 lang suffix 規約は CLI が実装しており (`withLangSuffix`)、 skill 側では組み立てない。

### Step 0: kiwa セットアップ判定

| 状態 | 判定 | 進行先 |
|---|---|---|
| 未導入 | `package.json` に `@kiwa-lab/dapp` 無し | Step 1 (init) |
| 導入済・新規 test | kiwa 導入済、 該当 test ファイル無し | Step 2 |
| 導入済・拡張 / debug | 既存 test を拡張 / fix | Step 2' |

### Step 1: 新規導入 (`--init`)

```bash
pnpm dlx @kiwa-lab/cli init
pnpm install
```

生成物:
- `e2e/connect.spec.ts` (sample test)
- `playwright.config.ts` (webServer + fixture 設定)
- `tests/prepare-env.ts` (anvil 起動 + contract deploy)

### Step 1.5: Layer 1 のテスト仕様書を用意する (`--input-spec` があれば受け取る、 Phase E-3 で refactor 済)

spec.ts 実装の前に Layer 1 の 9 section + 9 column 仕様書 (SSOT = `docs/SKILL-DESIGN.ja.md`) を用意する。 `--input-spec` で既存 spec を渡された場合はそれを使い、 渡されていない場合だけ `/kiwa-design` を起動して生成する。 独自 template ではなく Layer 1 出力を消費する設計に統一 (旧 template 経路は廃止、 kiwa Phase E-3 refactor)。

#### 1.5.A プロジェクト読込

対象 dApp の contract / 既存 test / UI から **test 対象機能を構造化** する (Layer 1 への入力素材を収集)。

```bash
ls contracts/ tests/ app/ 2>/dev/null
wc -l contracts/*.sol tests/*.spec.ts 2>/dev/null
grep -E "function |event |error |modifier " contracts/*.sol | head -30
grep -E "^test\(|^test\.describe\(" tests/*.spec.ts | head -20
```

#### 1.5.B Layer 1 (`/kiwa-design`) 起動

**`--input-spec` が渡されていれば、 この step は skip して既存の spec を読む**。 `/kiwa-app` の
ように Layer 1 を先に起動する caller があり、 そこで生成した spec をここで作り直すと、 caller が
指定した path ではなく既定 path が使われる = 渡した引数が効かない。

`--input-spec` が無い時 (単独起動 / `/kiwa-test` 経由) だけ以下を実行する。

以下を Layer 1 に渡す。 Layer 1 も同じ CLI で書き先を解決するため、 ここで path を指定しない = 指定すると
producer と consumer が別々に組み立てる 2 経路に戻る。

```text
/kiwa-design --layer e2e --module {example} --input {path/to/contract.sol or app/}

入力情報:
- 対象 dApp = {example 名} (1-2 文で機能要約)
- 既存 contract / 既存 test の grep 結果 (1.5.A の出力)
- contract 改変 (あれば function / event / error 単位で diff 明示)
- scope 境界 (本作業でやらないことを 3-5 個列挙)
```

Layer 1 が以下 9 section の仕様書を解決済み spec path に Write する (詳細は `.claude/skills/kiwa-design/SKILL.md` § 出力フォーマット):

- 対象機能 / 仕様の要約 / 主な品質リスク / 推奨テスト構成 / テスト観点一覧 / テストケース一覧 / 自動化すべきテスト / 手動確認でよいテスト / 不足している仕様

#### 1.5.C 仕様書ベースで実装 (Layer 2 = 本 skill の責務)

Layer 1 出力 (解決済み spec path) を Read し、 「テストケース一覧」 section の 9 column 表を **行単位** で `tests/{example}.spec.ts` の test 関数に変換する。

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

旧 `examples/test-spec-template.md` (独自 8 column) は Phase E-3 以前の test 仕様書を Read する場合のみ参照用に残す。 新規 test 仕様書は **Layer 1 経由の 9 column 表** を使う (`--input-spec` で受け取るか、 無ければ生成する)。

### Step 2: 3 layer 設計

dApp test は以下 3 layer で構造化:

| layer | 責務 | API |
|---|---|---|
| 1. infra | anvil 起動・port 確保・cluster (multi-chain) | `startAnvil` / `startAnvilCluster` / `getFreePort` / `runE2EPrepareEnv` |
| 2. contract | 契約 deploy・ABI 読込・event listen | `deployContract` / `loadForgeArtifact` / `waitForChainState` |
| 3. UI / wallet | Playwright で UI 操作・wallet inject・sign | `dappE2eTest` (fixture) / `createRpcHandler` / `verifySignature` |

### Step 3: 既存 example pattern 参照

`@kiwa-lab/dapp` のリポジトリ (https://github.com/cardene777/kiwa) には 22 example が含まれており、 用途別の典型実装を学べる。

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
import { runE2EPrepareEnv, loadForgeArtifact } from '@kiwa-lab/dapp';

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

`@kiwa-lab/dapp` に `expectCustomError` helper が含まれる (v0.2 以降)。
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
並列実行は `@kiwa-lab/dapp` の build race を起こすため sequential 厳守。

### Step 8: 任意 — adversarial review

新規 contract や大幅な test 追加で false positive (test PASS でも bug 検出不能) を避けたい場合、 adversarial review を実施することを推奨。

代表的偽陽性パターン:

- **固定 nonce 偽陽性** — replay 検証 test で固定値 nonce を使うと nonce 伝搬経路が壊れても PASS する → 動的に取得した nonce を使う
- **UI 経由していない E2E** — UI ボタンを通らず直接 RPC で writeContract する test は UI regression を素通りする → Playwright で `page.getByTestId(...).click()` を介する
- **access control の partial 検証** — `hasAccess(user)` だけ確認し grantor / msg.sender 経路を叩かないと self-grant bypass を素通りする → 全エントリポイントを叩く
- **time-warp の副作用** — `evm_increaseTime` で進めた時間が次 test に残ると flaky 化する → `snapshotChain` / `revertChain` で test 間隔離

詳細 9 種 + self-check 5 問は `references/adversarial-pitfalls.md`。

### Step 9: kiwa-review 自動呼出 (test-review mode)

Step 7 (4 round 連続 PASS) 完了後、 生成 spec.ts の品質を独立 review する。 `/kiwa-review --mode test-review --module {module} --layer e2e --lang $DOC_LANG --test-path tests/*.spec.ts` を内部呼出し、 spec vs spec.ts 整合 / 観点別 cover 率 / UI 起点 e2e で追加すべき test 提案 を 5 軸で判定。

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
- `references/fixture-api.md` — `@kiwa-lab/dapp` 主要 export API リファレンス
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
- npm: `@kiwa-lab/dapp` / `@kiwa-lab/cli` (cookbook の subpackage 化は構想段階で、名称は未定)
