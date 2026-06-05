---
name: contract-test-hardhat
description: |
  /test-design (Layer 1) が出力した `.context/spec/contract/test-spec-{module}.md` を入力に、 Hardhat の `test/*.test.ts` を Write して `npx hardhat test` で動作確認する Layer 2 contract test skill。
  10 観点 (正常系 / 異常系 / 境界値 / 状態遷移 / 権限 / 入力バリデーション / 冪等性 / 並行処理 / 性能 / セキュリティ) を chai matchers / fast-check / Promise.all race / hardhat-gas-reporter / hardhat-coverage に変換し、 line coverage 評価まで一気通貫。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /contract-test-hardhat — Layer 2 Hardhat contract test skill

`/test-design` (Layer 1) が出力した仕様書を Hardhat の `test/*.test.ts` に変換し、 `npx hardhat test` で動作確認、 `hardhat-coverage` で line coverage を評価する。

Foundry 並立 (Phase E-4) と並ぶ Layer 2 contract test skill。 JS/TS 中心の dApp 開発 workflow をカバーする。

## 前提

- Hardhat インストール済 (`npx hardhat --version` で確認)
- `@nomicfoundation/hardhat-toolbox` または `hardhat-chai-matchers` がインストール済 (custom error / time helper のため)
- 対象 contract が `contracts/` 配下に存在 (`hardhat.config.ts` の `paths.sources` 経由でも可)
- `npx hardhat compile` が PASS する状態

## ユーザーのリクエスト

$ARGUMENTS

## オプション

- `--module {name}` — Layer 1 spec の module 名 (`.context/spec/contract/test-spec-{name}.md` を Read)
- `--spec-path {path}` — Layer 1 spec の path を明示 (`--module` の代替)
- `--contract {name}` — 対象 contract 名 (省略時は spec の「対象機能」section から推定)
- `--gas-report` — `hardhat-gas-reporter` で gas 測定込みで実行
- `--coverage-threshold {N}` — `solidity-coverage` の line coverage 目標 (default 80%)
- `--no-tests` — `npx hardhat test` 実行をスキップ (Write のみ)

## 実行フロー

5 段階で Layer 1 spec → `.test.ts` → 実行 → 評価まで進む。

### Step 1: Layer 1 spec 読込

`--module` または `--spec-path` で指定された Layer 1 spec を Read し、 以下を抽出:

| 抽出対象 | source section |
|---|---|
| 対象 contract 名 / function 一覧 / error 一覧 | `## 対象機能` / `## 仕様の要約` § API 契約 |
| 優先度別ケース一覧 | `## テストケース一覧` の 9 column 表 |
| 観点別 grouping | `### 観点 N: {name}` サブセクション |

spec が存在しない場合は「Layer 1 spec が未生成、 `/test-design --layer contract --module {name}` を先に起動」と return してエラー停止。

### Step 2: contract 実体確認

```bash
ls contracts/ src/ 2>/dev/null
grep -E "function |event |error |modifier " contracts/*.sol src/*.sol 2>/dev/null
npx hardhat compile 2>&1 | tail -10
```

spec の function / error が実 contract に存在しなければ「不足している仕様」として記録、 Step 3 に進む前にユーザーに報告。

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

### Step 5: `solidity-coverage` 評価 (必須、 未達は test-passed marker 作成不可)

**本 step は省略不可**。 `npx hardhat test` PASS だけでは test-passed marker を作らず、 coverage 計測 + threshold チェックまで通って初めて完了とみなす (`rules/quality.md` § テスト品質 と整合)。

solidity-coverage 未インストールの場合は **install を強制** (skip 不可):

```bash
npm ls solidity-coverage >/dev/null 2>&1 || pnpm add --save-dev solidity-coverage
npx hardhat coverage 2>&1 | tail -20
```

`--coverage-threshold` で指定された 4 metric 目標を **全て満たしているか** 評価する。 default は OSS 公開水準として以下:

| metric | default threshold | 引数 override |
|---|---|---|
| Statements | 90% | `--coverage-statements {N}` |
| **Branches** | **80%** | `--coverage-branches {N}` |
| Functions | 90% | `--coverage-functions {N}` |
| Lines | 90% | `--coverage-lines {N}` |

Branches を 80% に下げているのは Solidity の require/revert/short-circuit 評価で 100% 到達が現実的に困難なため。 残り 3 metric は 90%。

| 結果 | アクション |
|---|---|
| 全 4 metric が threshold 以上 | 完了、 `test-passed` marker を Write |
| いずれかの metric が threshold 未満 | **完了とみなさない**。 Layer 1 spec の「不足している仕様」に「{metric} {N}% < {threshold}% で不足」を追記し、 「不足観点 / 未テスト error path / 未テスト event」を bullet で列挙してユーザーに報告 |
| `hardhat coverage` 失敗 | `npx hardhat test` PASS でも completion とせず原因を報告 (silent skip 禁止) |

coverage が落ちる典型パターン (Step 4 完了時に self-check):

- contract に定義された custom error 全てに `revertedWithCustomError(c, 'Error')` test があるか
- event 全てに `.to.emit(c, 'Event').withArgs(...)` で args 検証 test があるか
- `c.connect(signer)` で role 別の OK / revert 両方が test されているか
- `if (condition)` の true / false 両 branch が test されているか

## 完了条件

- Layer 1 spec の「自動化すべきテスト」リストの全ケースが `test/{Contract}.test.ts` に Write 済
- `npx hardhat compile` が exit 0
- `npx hardhat test` で全 it block PASS (failure 0 件)
- `npx hardhat coverage` で **4 metric (Statements / Branches / Functions / Lines) 全てが threshold 以上** (default Statements 90% / Branches 80% / Functions 90% / Lines 90%)
- 観点別 grouping (`describe('観点 N: {name}', () => {...})`) が spec と一致
- 未達成 metric は 1 つでも残れば test-passed marker を作らず、 不足理由を Layer 1 spec の「不足している仕様」に記録してユーザーに報告

## references

- `references/hardhat-mapping.md` — 10 観点 → Hardhat helper の完全マッピング + Code snippet + hardhat-toolbox helper 早見表
- `references/fast-check-patterns.md` — `fast-check` property test の実装パターン詳細 (asyncProperty / fc.bigUintN / fc.constantFrom / shrinking 戦略)

## examples

- `examples/example-token-gating.test.ts` — `examples/nextjs-token-gating/contracts/GatedContent.sol` ベースの完全な .test.ts サンプル (TC-001 〜 TC-013 の 6 観点 grouping、 chai matchers + fast-check 込み)

## 関連 link

- 仕様書 SSOT: `docs/SKILL-DESIGN.md` / `docs/SKILL-DESIGN.ja.md`
- Layer 1 skill: `.claude/skills/test-design/SKILL.md` (`--layer contract` で本 skill 用 spec を生成)
- 並立 Layer 2: `.claude/skills/contract-test-foundry/SKILL.md` (Foundry 用)、 `.claude/skills/dapp-e2e-test/SKILL.md` (Playwright e2e 用)
