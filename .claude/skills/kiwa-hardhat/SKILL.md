---
name: kiwa-hardhat
description: |
  /kiwa-design (Layer 1) が出力した `tests/spec/contract/test-spec-{module}.md` を入力に、 Hardhat の `test/*.test.ts` を Write して `npx hardhat test` で動作確認する Layer 2 contract test skill。
  11 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ / 回帰) を chai matchers / fast-check / Promise.all race / hardhat-gas-reporter / hardhat-coverage に変換し、 line coverage 評価まで一気通貫。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-hardhat — Layer 2 Hardhat contract test skill

`/kiwa-design` (Layer 1) が出力した仕様書を Hardhat の `test/*.test.ts` に変換し、 `npx hardhat test` で動作確認、 `hardhat-coverage` で line coverage を評価する。

Foundry 並立 (Phase E-4) と並ぶ Layer 2 contract test skill。 JS/TS 中心の dApp 開発 workflow をカバーする。

## 前提

- Hardhat インストール済 (`npx hardhat --version` で確認)
- `@nomicfoundation/hardhat-toolbox` または `hardhat-chai-matchers` がインストール済 (custom error / time helper のため)
- 対象 contract が `contracts/` 配下に存在 (`hardhat.config.ts` の `paths.sources` 経由でも可)
- `npx hardhat compile` が PASS する状態

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名。 path は § 入力 spec の path は CLI から受け取る で解決する
- `--project-root {path}` — 生成先 (`{example}/...`) の起点。 `kiwa layers --project-root` にそのまま渡す (省略時は cwd)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--contract {name}` — 対象 contract 名 (省略時は spec の「対象機能」section から推定)
- `--gas-report` — `hardhat-gas-reporter` で gas 測定込みで実行
- `--coverage-threshold {N}` — `solidity-coverage` の全 metric 共通 threshold (default 100%、 production target のみ評価対象)
- `--coverage-lines {N}` / `--coverage-statements {N}` / `--coverage-branches {N}` / `--coverage-functions {N}` — metric 別 threshold override (指定時は `--coverage-threshold` より優先)
- `--lang {ja|en|<ISO 639-1>}` — spec の言語と coverage report の生成言語 (省略時は起動元が渡した値、 単体起動なら `ja`)
- `--no-tests` — `npx hardhat test` 実行をスキップ (Write のみ)
- `--no-review` — Step 6 の kiwa-review 自動呼出 (test-review) を skip (CI / 自動化用)

### 入力 spec の path は CLI から受け取る

`--spec-path` を省略した時、 **自前で組み立てず `kiwa layers` に訊く**。 本 skill が扱う layer は `contract` の 1 つ。

```bash
pnpm exec kiwa layers --json --layer contract --lang "$DOC_LANG" --module "$MODULE" \
  --producer kiwa-hardhat --project-root "$PROJECT_ROOT"
```

返る `spec_path` は言語と module 名まで解決済 (`packages/cli/src/detect/layers.ts` の `withLangSuffix` / `withModule`)。 skill 側で `sed` を挟まない = module 名に separator が入ると path が spec directory の外を指す (`test-spec-../../etc/passwd.ui.md` を実測)。 CLI が `[a-z0-9-]` 1-32 字を強制して弾く。

`$DOC_LANG` は skill 引数の `--lang`。 **`LANG` を使わない** = shell の locale 変数で `ja_JP.UTF-8` 等が入っており、 CLI が ISO 639-1 でないとして拒否する。 `--lang` 省略時の既定は起動元が渡した値、 単体起動なら `ja`。

`$MODULE` は skill 引数の `--module`。 必須で、 推測しない。

`$PROJECT_ROOT` は skill 引数の `--project-root` (省略時は `.`)。 **返る `spec_path` はこれを起点にする**ため、 省くと example 配下の spec を repo root から探すことになる。

#### 2 つの path は起点が違う

**`spec_path` は `--project-root` 起点、 `test_paths.files` は cwd 起点**。 同じ応答の中で基準が分かれているので、 同列に「返った値を Read する」 と読むと spec だけ外す。

| field | 起点 | Read する時 |
|---|---|---|
| `spec_path` | `--project-root` (省略時は cwd) | `$PROJECT_ROOT` を前置して開く |
| `test_paths.patterns` / `test_paths.files` | cwd | そのまま開く |

CLI 側は `spec_path` に lang と module しか差し込まず (`applyLang`)、 `test_paths` だけ `relativeTo(cwd, join(projectRoot, …))` で cwd 基準に直している。 宣言の出所が `docs/layers.json` と生成先で違うためで、 揃える先は skill ではなく CLI にあるが、 **読む側が起点を知らないまま使うと必ず外す** (`skills/kiwa-review/SKILL.md` § 2 つの path は起点が違う SSOT)。

実測 (cwd = repo root、 `examples/cli-poc` の `cli` layer)。 応答は下の検証表を全行 pass するが、 そのまま `spec_path` を開くと `No such file or directory` になる。


`kiwa-forge` は同じ `contract` layer を消費する。 runner が違うだけで spec は 1 つなので、 `/kiwa-test --runner both` の経路では両 skill が同じ path を受け取る。

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
| `$PROJECT_ROOT` を前置した path に file が無い | spec が未生成か `--project-root` が誤り。 **開いた path をそのまま添えて中断** |
| 上記いずれでもない | その `spec_path` を `$PROJECT_ROOT` 起点で開く |

「解決先に file が無い」 行を置くのは、 **上の全行を pass した応答でも Read が落ちる**から。 検査が「応答の形」 までで止まっていると、 起点違いも spec 未生成も同じ「spec が無い」 に潰れる。

`.layers[] | select(.id == "<layer>")` で先に絞ってから、 取れた 1 件を見る。

`jq` が無い環境では `--json` の出力をそのまま読む。 `jq` は整形の手段であって、 解決の一部ではない。

#### 解決した値を下流に渡す

Step の最後で `/kiwa-review` を呼ぶ時、 **同じ layer と同じ `--lang` を渡す**。 渡さないと review が別の spec を読み、 生成した test と突き合わせる相手が変わる。

自前で suffix を組むと 2 経路になり、 CLI 側の規約が変わった時に取り残される。 `--lang ja` を付けると Layer 1 が書いた file を Layer 2 が探せなかったのがこの形 (#1855 / #1861)。

本 SKILL.md 内の spec path 表記は説明のための例示で、 解決の指示ではない。

## 実行フロー

5 段階で Layer 1 spec → `.test.ts` → 実行 → 評価まで進む。

### Step 0: 文書生成言語の決定 (skill 起動時 1 回)

`--lang` が渡っていればそれを使う。 渡っていなければ **起動元が渡した値、 単体起動なら `ja`** を既定にする (option 宣言と同じ規則)。

`/kiwa-app` や `/kiwa-test` から起動される経路では常に値が渡るため、 尋ねる契機は単体起動に限られる。 その場合も既定があるので **AskUserQuestion は出さない** = 既定が決まっている問いを毎回聞くと chain が止まる。

確定後の言語 `$DOC_LANG` は入力 spec の解決と Step 5c (coverage report Write) の両方で参照する。 coverage report の出力 path (Issue #341 lang suffix SSOT、 `/kiwa-design` § lang suffix 規約 と整合):

- ja → `tests/reports/contract/coverage-report-{module}-hardhat.ja.md` (+ round 別)
- en → `tests/reports/contract/coverage-report-{module}-hardhat.md`
- その他 → `tests/reports/contract/coverage-report-{module}-hardhat.{lang_code}.md`

**`-hardhat` を落とさない**。 `/kiwa-forge` は同じ dir に suffix 無しで書くため、 落とすと
`--runner both` で 2 枚目が 1 枚目を上書きする。 repo の実 file がこの形になっている
(`coverage-report-mint-nft.ja.md` = Foundry、 `coverage-report-mint-nft-hardhat.ja.md` = Hardhat)。

round 別 report は canonical の **runner suffix の直後** に round を挟む (`coverage-report-{module}-hardhat-round-{N}.ja.md`)。 lang suffix は常に末尾 (`/kiwa-design` § lang suffix 規約)。

**以降の step で path を組み立て直さない**。 本節が唯一の SSOT で、 写しを置くと lang suffix を落とす (#2082 で 11 箇所が落としていた)。

### Step 1: Layer 1 spec 読込

`--spec-path` が渡っていればその path、 無ければ § 入力 spec の path は CLI から受け取る で解決した path を Read し、 以下を抽出:

| 抽出対象 | source section |
|---|---|
| 対象 contract 名 / function 一覧 / error 一覧 | `## 対象機能` / `## 仕様の要約` § API 契約 |
| 優先度別ケース一覧 | `## テストケース一覧` の 9 column 表 |
| 観点別 grouping | `### 観点 N: {name}` サブセクション |

spec が存在しない場合は「Layer 1 spec が未生成、 `/kiwa-design --layer contract --module {name} --lang $DOC_LANG` を先に起動」と return してエラー停止。

### Step 2: contract 実体確認

```bash
grep -nHE "^[[:space:]]*(function|event|error|modifier)[[:space:]]" -- "${CONTRACT_PATHS[@]}"
npx hardhat compile 2>&1 | tail -10
```

`$CONTRACT_PATHS` は Step 1 で spec の「対象機能」 から抽出した、 対象実装の repo 相対 path
だけを持つ配列。 各要素が repo 内の通常 file であることを Read 前に確認し、 絶対 path / `..` /
symlink は拒否する。 0 件なら Step 2 を中断し、 対象 path が spec に無いと報告する。 `grep` の
`--` は、 `-` から始まる path を option として解釈させないために省略しない。

**glob を並べず、 project 全体も探索しない**。 `contracts/*.sol src/*.sol` の形は、 片方の dir が
無いと zsh が `no matches found` で **command 全体を止める** = 出力 0 件になる (実測 =
`examples/mint-nft` は `src/` を持たず、 `contracts/` があるのに 1 行も出ない)。 一方で
`find . -name '*.sol'` は `test/` や別 contract まで含み、 production に無い API が test 側に
あるだけで実装済みと誤判定する。 `/kiwa-forge` Step 2 と同じ形。

spec の function / error が実 contract に存在しなければ「不足している仕様」として記録、 Step 3 に進む前にユーザーに報告。

#### Step 2b: spec 期待結果 ↔ contract logic 矛盾検出 (改善 1 / Issue #226)

`/kiwa-forge` Step 2b と同じ仕様で、 spec の「期待結果」 column と contract logic を grep ベースで比較する (両 skill で共通 logic、 SSOT は `/kiwa-forge` SKILL.md § Step 2b)。

判定 logic 概要。

1. spec「期待結果」 column から条件 + 期待値の pair を抽出
2. contract 該当 function を `grep -A 20 "function {name}" contracts/**/*.sol` で抽出し early return / require / event emit の矛盾を検出
3. 矛盾検出時は report Section 4「Layer 1 spec への書き戻し提案」 に bullet 追加 (format は `/kiwa-forge` SKILL.md § Step 2b と同じ)
4. 検出時は test code 生成を継続 (期待結果を contract 側に合わせて Write)、 report に書き戻し提案を残す

詳細 format と PR #223 実例は `/kiwa-forge` SKILL.md § Step 2b を Read (本 skill では重複避けるため SSOT 参照)。

### Step 3: 観点別 Hardhat helper 変換

Layer 1 spec の各ケース行を 観点別に Hardhat helper へ変換 (詳細マッピングは `references/hardhat-mapping.md`)。

| Layer 1 観点 | Hardhat helper | 関数命名規約 |
|---|---|---|
| 1. 正常系 | `it('...')` 通常 | `it('{TC-ID} {summary}')` |
| 2. 異常系 | `await expect(...).to.be.revertedWithCustomError(c, '{ActualError}')` | `it('{TC-ID} reverts when ...')` |
| 3. 境界値 | `fast-check` property test | `it('{TC-ID} fuzz boundary')` |
| 4. 状態遷移 | `beforeEach` で state seed + `describe.each(states)` | `describe('state transition')` |
| 5. 権限 | `await c.connect(signer).fn(...)` | `it('{TC-ID} only authorized')` |
| 6. 入力バリデーション | `fast-check` + revert assertion | `it('{TC-ID} rejects invalid input')` |
| 7. 冪等性 | 2 回 call → 2 回目 expect revert | `it('{TC-ID} rejects replay')` |
| 8. 並行処理 | `Promise.all([tx1, tx2])` race | `it('{TC-ID} race condition')` |
| 9. 性能 | `hardhat-gas-reporter` 設定 + per-fn 比較 | `it('{TC-ID} gas under {Budget}')` |
| 10. セキュリティ | signature recovery + role assertion + reentrancy attacker contract | `it('{TC-ID} {security check}')` |

各観点の Hardhat 実装例 (Code snippet) は `references/hardhat-mapping.md` § Hardhat helper 詳細 を Read。

### Step 4: `.test.ts` Write + `npx hardhat test` 実行

`test/{Contract}.test.ts` を Write し、 `npx hardhat test` を実行する。

```typescript
// test/{Contract}.test.ts (自動生成、 Layer 1 spec ベース)
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import fc from 'fast-check';

describe('{Contract}', () => {
  async function deployFixture() {
    const [owner, user, otherUser] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory('{Contract}');
    const target = await Contract.deploy({constructor args});
    return { target, owner, user, otherUser };
  }

  describe('観点 1: 正常系', () => {
    it('TC-001 {summary}', async () => {
      const { target, owner } = await loadFixture(deployFixture);
      // Layer 1 spec の「前提条件」「入力値」「操作手順」「期待結果」を実装
    });
  });

  describe('観点 2: 異常系', () => {
    it('TC-NNN reverts when invalid', async () => {
      const { target, user } = await loadFixture(deployFixture);
      await expect(target.connect(user).fn(invalidArgs))
        .to.be.revertedWithCustomError(target, '{ActualErrorName}');
    });
  });

  describe('観点 3: 境界値', () => {
    it('TC-NNN fuzz boundary', async () => {
      const { target, owner } = await loadFixture(deployFixture);
      await fc.assert(
        fc.asyncProperty(fc.bigUintN(64), async (value) => {
          if (value === 0n || value > MAX) return;
          const result = await target.fn(value);
          expect(result).to.equal(/* expected */);
        }),
        { numRuns: 100 }
      );
    });
  });
});
```

実行:

```bash
npx hardhat compile 2>&1 | tail -10
npx hardhat test 2>&1 | tail -30
```

failure があれば spec の「期待結果」と実 contract behavior の整合確認 (`rules/quality.md` § 実装整合性確認)、 Layer 1 spec の「不足している仕様」に追加項目として記録。

### Step 5: `solidity-coverage` 評価 + auto loop (production target 100% or 「不可能」判定まで無制限 loop)

**本 step は省略不可**。 `npx hardhat test` PASS だけでは test-passed marker を作らず、 coverage 計測 + auto loop + report 生成まで通って初めて完了とみなす (`rules/quality.md` § テスト品質 と整合)。

solidity-coverage 未インストールの場合は **install を強制** (skip 不可):

```bash
npm ls solidity-coverage >/dev/null 2>&1 || pnpm add --save-dev solidity-coverage
```

#### Step 5a: coverage 計測 + file 分類

```bash
mkdir -p tests/reports/contract
npx hardhat coverage 2>&1 | tee tests/reports/contract/coverage-{module}.log
cat coverage/coverage-final.json 2>/dev/null || cat coverage/lcov.info
```

`tee` は親 dir を作らない。 `mkdir -p` を前段に置かないと log が保存されない (実測 =
`tee: tests/reports/contract/coverage-mint-nft.log: No such file or directory`、 pipeline の
exit code は 0 のままなので気付きにくい)。

読む先は **`coverage-final.json`**。 solidity-coverage が書くのは `coverage/coverage-final.json`
/ `coverage/lcov.info` / `./coverage.json` で、 **`coverage-summary.json` は生成されない**
(istanbul の `json-summary` reporter を有効にした時だけ出る、 実測)。 存在しない file を
primary に置くと毎回 fallback に落ち、 分類が想定と違う構造を読む。

solidity-coverage 出力 (json / lcov) を file path で分類 (rule SSOT は `references/coverage-classify.md`):

| file path pattern | カテゴリ | threshold 対象? |
|---|---|---|
| `contracts/**/*.sol` / `src/**/*.sol` | production | ✅ 対象 |
| `test/**/*.sol` | test 自身 | ❌ 対象外 |
| `test/helpers/**/*.sol` / `test/mocks/**/*.sol` | mock helper | ❌ 対象外 |
| `script/**/*.sol` | deploy script | ❌ 対象外 |

threshold は **production target に対してのみ** 適用。 default は 100%:

| metric | default threshold | 引数 override |
|---|---|---|
| Statements | 100% | `--coverage-statements {N}` |
| Branches | 100% | `--coverage-branches {N}` (短絡評価 / unreachable で下回る場合は Step 5b 判定で「不可能」分類) |
| Functions | 100% | `--coverage-functions {N}` |
| Lines | 100% | `--coverage-lines {N}` |

#### Step 5b: auto loop (production target threshold 未達時)

production target で threshold 未達なら以下を **上限なし** で loop。

1. uncovered line / branch を抽出
2. 各 uncovered を 5 分類 (rule SSOT `references/coverage-classify.md`):
   - **削除候補** — `test/helpers/**` の未使用 API (他 test から grep ヒット 0)
   - **defensive code** — `require(false, "...")` / `revert "INVARIANT"` / 到達不能な assert
   - **外部依存** — `block.timestamp` 特定値 / `blockhash` / chain-specific opcode 依存で test 再現困難
   - **計測除外** — `solidity-coverage` の skipFiles / contract.skip 経路、 もしくは `--no-tags` 等で除外されている test
   - **真の未踏** — 上記いずれにも該当しない、 追加 test で cover 可能
3. **真の未踏** に対して test 追加生成:
   - Layer 1 spec (`tests/spec/contract/test-spec-{module}.md`) の「テストケース一覧」に新規 TC-NNN として追記
   - Layer 2 で `test/{Contract}.test.ts` に新規 it block を追記 (既存 it block を上書きしない)
   - 観点 describe (`describe('観点 N: {name}', () => {...})`) を spec と一致させる
4. 再 `npx hardhat test` + `npx hardhat coverage` で計測、 round 別 report を Step 0 が定める path (round 別) に Write
5. loop 終了条件 (いずれか):
   - production target 全 4 metric 100% 到達 → Step 5c へ
   - 残 uncovered (production 側) が全て「削除候補 / defensive / 外部依存」分類 → Step 5c へ (production 100% は理論不能と確定)
   - 前 round からの coverage delta 0 が **2 round 連続** → 「停滞」判定で Step 5c へ + report に停滞理由

**loop 上限なし**。 user 介入なしで自律 loop する。

#### Step 5c: coverage report Write (canonical)

Step 0 が定める canonical path に 4 section format で Write (template SSOT `references/coverage-report-template.md`)。

```markdown
# Contract Coverage Report — {module}

Generated: {ISO8601}
Skill: /kiwa-hardhat | Run: round {N} (final)
Loop terminated: {production_100_achieved | residual_uncoverable | stalled_2round}

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Statements | ✅/❌ {pct}% ({covered}/{total}) | {pct}% ({covered}/{total}) |
| Branches | ... | ... |
| Functions | ... | ... |
| Lines | ... | ... |

**判定 — ✅ PASS / ❌ FAIL** ({reason})

## 2. file 別 coverage 内訳 (production / test / mock 分類)

| File | カテゴリ | Stmts | Branches | Funcs | Lines | threshold 対象? |
|---|---|---|---|---|---|---|
| {path} | {production / test 自身 / mock helper / deploy script} | ... | ... | ... | ... | ✅/❌ |

## 3. 未到達 line の分類と判断

### {file_path} - {N} line uncovered

- L{line_range} {function_name} — 分類: {削除候補 | defensive | 外部依存 | 計測除外 | 真の未踏}
  - **判断**: {具体理由}

(全 uncovered を file ごとに集約して列挙)

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| coverage 除外スコープ (production target のみ threshold 対象) | 「不足している仕様」 | bullet 追加 |
| mock 未使用 API (削除候補) | 「不足している仕様」 | bullet 追加 (cleanup PR の余地) |
| 追加 test TC-{NNN} (auto loop で追加) | 「テストケース一覧」§ 観点 {N} | 9 column 表に追加 |
| **runner 差異 (Hardhat 制約による未踏 branch)** | **「不足している仕様」§ runner 差異** | **bullet 自動追加 (block.timestamp 巻き戻し不可等を検出時)** |

### runner 差異 bullet の自動追加 logic (改善 4 / Issue #227)

Step 5c の Section 4 で未踏 branch を判定する際、 以下のいずれかが Hardhat の構造的制約で cover できない branch に該当する場合、 spec の「不足している仕様 > runner 差異」 セクションに bullet 追加を提案する (実書き戻しは user 手動 or `/kiwa-design --mode update`)。

| 検出 trigger | format |
|---|---|
| `block.timestamp == 0` 等の「時刻を 0 / 過去に巻き戻す」 前提の branch | `{branch_path} は Foundry vm.warp(0) でのみ再現可能、 Hardhat は block.timestamp 巻き戻し不可制約により未踏 (許容)` |
| `vm.prank(address(0))` 等の Hardhat 非対応 cheatcode 前提の branch | `{branch_path} は Foundry 固有 cheatcode 前提で再現、 Hardhat 側未踏 (許容、 代替アサーションで類似化検討余地)` |
| `hardhat_setStorageAt` 等で再現可能だが現 test 未実装の branch | `{branch_path} は hardhat_setStorageAt で再現可能だが現 test 未実装、 後追い test 追加候補` (許容ではなく改善余地) |

> 注 — 本 skill (Layer 2) は spec を **書き換えず**、 上記提案を report に列挙のみ。 spec への反映は user 手動 or `/kiwa-design --mode update` (別 Issue 検討予定)。
```

round 別 report は Step 0 の round 別 path に累積保存、 final round の内容を canonical path に複製。 path / format は `/kiwa-forge` と統一 (skill 違いを吸収して同じ report format)。

canonical report を Write したら、 **実際に書いた path を chain return に含める**。 呼出元は
この値をそのまま集約し、 file 名を組み立て直さない。

#### Step 5d: test-passed marker 作成

以下のいずれかで marker 作成:

| 条件 | アクション |
|---|---|
| production target 全 4 metric 100% 到達 | `test-passed` marker を Write |
| production 未達だが残 uncovered が全て「不可能」分類 (削除候補 / defensive / 外部依存) | `test-passed` marker を Write (理由を report Section 1 に明示) |
| 「停滞」判定 (delta 0 が 2 round 連続) | marker を **作らず**、 report Section 1 に「停滞、 manual review 推奨」 を明示してユーザーに報告 |
| `hardhat coverage` 失敗 (json / lcov 生成エラー等) | marker を **作らず**、 原因を報告 (silent skip 禁止) |

### Step 6: kiwa-review 自動呼出 (test-review mode)

Step 5d で test-passed marker 作成成功後、 `--no-review` 未指定なら生成 test の品質を独立 review する。 `/kiwa-review --mode test-review --module {module} --layer contract --lang $DOC_LANG --producer kiwa-hardhat --project-root .` を内部呼出し、 spec vs test 整合 / 観点別 cover 率 / 追加 test 提案 を 5 軸で判定。

呼出例:
```text
/kiwa-review --mode test-review --module nft-marketplace --layer contract --lang $DOC_LANG --producer kiwa-hardhat --project-root .
```

review 結果は kiwa-forge と同形式 (PASS / CONDITIONAL / FAIL critical なし / FAIL critical あり の 4 分岐)。 CONDITIONAL は chain を継続し、 未検証の観点を統合 report に載せる (`skills/kiwa-review/SKILL.md` § Step 4)。 report 出力先は `/kiwa-review` Step 0 の言語別出力 path (`test-review` mode)。

`--no-review` 引数で skip 可能 (CI 用)。

## 完了条件

- Layer 1 spec の「自動化すべきテスト」リストの全ケースが `test/{Contract}.test.ts` に Write 済
- `npx hardhat compile` が exit 0
- `npx hardhat test` で全 it block PASS (failure 0 件)
- `npx hardhat coverage` で **production target (contracts/ 配下) 全 4 metric 100% 到達** もしくは 「残 uncovered が全て不可能分類」 と report で明示
- Step 0 が定める coverage report path が 4 section format で Write 済 (final + round 別)
- 観点別 grouping (`describe('観点 N: {name}', () => {...})`) が spec と一致
- 「停滞」判定や `hardhat coverage` 失敗時は test-passed marker を作らず、 report Section 1 に理由を明示してユーザーに報告
- カバレッジの残りを確認済 = `/kiwa-gap --metric coverage --package {pkg}` を実行し、未達 0 件、または `/kiwa-loop` を回した上で残った分を `/kiwa-verdict` の 4 分類つきで report に記録 (#2193)。 **`unknown` や「埋められない」 で終わらせない**
- 遅い test の上位を確認済 = `/kiwa-gap --metric duration --report {vitest json}` を実行し、lever 別の偏りを読んで対処したか、対処しない理由を report に記録 (#2186 / #2193)。**遅い順ではなく lever 別の合計を見る** = 実測で release-smoke は 164.6s のうち 131.1s (80%) が `subprocess` に集中しており、偏りを見れば直す手が 1 つに絞れる

## references

- `references/hardhat-mapping.md` — 11 観点 → Hardhat helper の完全マッピング + Code snippet + hardhat-toolbox helper 早見表
- `references/fast-check-patterns.md` — `fast-check` property test の実装パターン詳細 (asyncProperty / fc.bigUintN / fc.constantFrom / shrinking 戦略)
- `references/coverage-classify.md` — file 分類 rule (production / test / mock / script) + uncovered 5 分類 (kiwa-forge と共用 SSOT)
- `references/coverage-report-template.md` — coverage report 4 section format の完全 template (kiwa-forge と共用 SSOT、 Step 0 が定める path への生成用)
- `references/doc-language-selection.md` — Step 0 文書生成言語選択 共通 SSOT (kiwa-forge と共用、 ja / en / その他 ISO 639-1)

## examples

- `examples/example-token-gating.test.ts` — `examples/nextjs-token-gating/contracts/GatedContent.sol` ベースの完全な .test.ts サンプル (TC-001 〜 TC-013 の 6 観点 grouping、 chai matchers + fast-check 込み)

## 既存 test の再利用

Layer 1 (`/kiwa-design`) が仕様書に書く `## 既存 test との対応` を読み、 **`未覆` / `不明` の TC だけ** を書く。
`既覆 (候補)` の TC は候補として挙がった test を Read し、 TC の入力と期待を実際に走らせているかを確かめてから決める (名前の一致は中身の一致を意味しない)。
section を持たない仕様書は全 TC を `不明` として扱う。

既存 test file があればそこに追記し、 無ければ本 skill の既定出力先へ新規 Write する。
**既存 test の削除と期待値の書き換えは行わない**。

判定の読み方 / 追記先の決め方 / 禁止事項の全文は `.claude/skills/kiwa-design/references/existing-test-reuse.md` を Read する。

## 関連 link

- 仕様書 SSOT: `docs/SKILL-DESIGN.md` / `docs/SKILL-DESIGN.ja.md`
- Layer 1 skill: `.claude/skills/kiwa-design/SKILL.md` (`--layer contract` で本 skill 用 spec を生成)
- 並立 Layer 2: `.claude/skills/kiwa-forge/SKILL.md` (Foundry 用)、 `.claude/skills/kiwa-play/SKILL.md` (Playwright e2e 用)
