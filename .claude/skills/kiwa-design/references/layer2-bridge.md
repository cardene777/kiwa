# Layer 2 連携 (Layer 1 → Layer 2 skill への引き渡し)

Layer 1 (`/kiwa-design`) が spec を Write した後、 Layer 2 skill が同 file を入力に実装を生成する経路。

## 出力 path × Layer 2 skill 対応

**本 file に対応表を持たない**。 layer / 書き先 / 消費 skill の対応は `docs/layers.json` が SSOT で、
`.claude/skills/kiwa-design/SKILL.md` § 出力 path の決定 の routing 表がそこから生成されている。

引き当てるのは CLI。

```bash
pnpm exec kiwa layers --json --layer "$LAYER" --module "$MODULE" --lang "$DOC_LANG"
```

`spec_path` が書き先、 `consumer_skill` と `also_consumed_by` が Layer 2 skill になる。

写しを置かない理由は、 **置いた写しが実際に腐ったから**。 本節は 5 行の表を持ち、
宣言のうち大半の layer が抜けたまま、 `integration` の消費 skill を決まっていないものとして
書き続けていた (`docs/layers.json` は `kiwa-api` を消費 skill として宣言している)。

## 引き渡し flow

```mermaid
graph LR
    A[/kiwa-design 起動] --> B[5 段階フロー]
    B --> C[kiwa layers が返す spec_path に Write]
    C --> D[kiwa layers の consumer_skill を起動]
    D --> E[test_outputs が宣言する path に Write]
```

分岐先を図に列挙しない。 どの layer がどの skill に行くかは `docs/layers.json` が持ち、
図に写すと layer が増えるたびに図だけ古くなる。

skill は 5 段階フロー完了後、 最終応答で「次の Layer 2 候補」を 1 件以上推奨する (`docs/SKILL-DESIGN.md` § 完了条件 と整合)。

## ケース表の parser 契約

Layer 2 skill は `tests/spec/test-spec-{module}.md` の以下を機械的に抽出する。

- `## テストケース一覧` section
- 観点別の `### 観点 N: {name}` サブセクション
- 9 column 表 (`テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化`)

**列の名前は layer で変わる**。 上の並びは汎用形で、 `SKILL.md` に `#### {layer} layer 専用 column`
節を持つ layer はそちらが優先される (`--layer api` は `Mode` / `Route` を持つ等)。
列数 9 と `## テストケース一覧` の anchor はどの layer でも変わらない。

Layer 1 skill は本 contract を維持するため、 以下を絶対変更しない (`references/output-skeleton.md` § placeholder 規約 と整合)。

| 変更禁止 | 理由 |
|---|---|
| `## テストケース一覧` 文字列 | Layer 2 parser の anchor |
| 9 column の名前 / 順序 | parser が column index で読む |
| 3 列目 `テスト観点` の存在 | section ヘッダで暗黙的に分かるが行単位でも明示 |
| `TC-XXX` の prefix `TC-` | Layer 2 が TC ID を関数名に変換 |

## 観点 → ランナー特化 helper のマッピング

Layer 2 skill が観点を実 helper に変換する recommended マッピング。

### Foundry (`*.t.sol`)

| 観点 | helper |
|---|---|
| 正常系 | `function test_Mint_HappyPath() public` |
| 異常系 | `vm.expectRevert(IERC721.NotApprovedOrOwner.selector); ...` |
| 境界値 | `function testFuzz_Boundary(uint256 x) public { vm.assume(...); ... }` |
| 状態遷移 | `function invariant_StateNeverReverts() public` |
| 権限 | `vm.prank(admin); ...` |
| 入力バリデーション | `function testFuzz_Validation(string memory s) public { ... }` |
| 冪等性 | `vm.expectRevert(NonceUsed.selector); ...` (2 回目) |
| 並行処理 | (Solidity の同期実行のため tx ordering test) |
| 性能 | `forge test --gas-report` + assertion |
| セキュリティ | `function invariant_NoReentrancy() public` |

### Hardhat (`*.test.ts`)

custom error 名は対象 contract の actual error 名に置き換える (例 OZ ERC-721 v5.x なら `ERC721IncorrectOwner` / `ERC721InsufficientApproval`)。 下記は形式の例示。

| 観点 | helper |
|---|---|
| 正常系 | `it('mints correctly', async () => { ... })` |
| 異常系 | `await expect(c.fn(...)).to.be.revertedWithCustomError(c, '{ActualErrorName}')` |
| 境界値 | `fc.assert(fc.property(fc.bigUintN(256), async (x) => { ... }))` (fast-check) |
| 状態遷移 | `before/after` で state seed + `it.each(states)` |
| 権限 | `await c.connect(admin).pause()` |
| 入力バリデーション | `fc.string()` 等で property test + revert assertion (chai 単体は assertion 専用、 schema は `fast-check` / `zod` / `chai-json-schema` で別途) |
| 冪等性 | 2 回 call して 2 回目 revert |
| 並行処理 | `Promise.all([tx1, tx2])` race |
| 性能 | `hardhat-gas-reporter` |
| セキュリティ | `ethers.getContractAt(...)` + signature recovery / role assertion (`verify` は Etherscan 検証用で test helper ではない、 セキュリティ test は assertion + invariant で構成) |

### Playwright (`*.spec.ts`)

| 観点 | helper |
|---|---|
| 正常系 | `test('connects and mints', async ({ page, anvilPort }) => { ... })` |
| 異常系 | `createRpcHandler({ pattern: /eth_call/, response: 503 })` |
| 境界値 | parameterized `test.describe.each` |
| 状態遷移 | `snapshotChain` / `revertChain` で state seed |
| 権限 | wallet account 切替 (`makeClients(port, OTHER_PK)`) |
| 入力バリデーション | `page.getByTestId('input').fill(...)` + assertion |
| 冪等性 | retry test (`test.describe.serial`) |
| 並行処理 | multi-tab (`context.newPage()`) |
| 性能 | Playwright trace + perf metrics |
| セキュリティ | signature flow E2E (`verifySignature`) |

## 関連

- SSOT: `docs/SKILL-DESIGN.md` § Layer 2 specialization / § Roadmap
- 既存 e2e skill (Layer 2 候補): `.claude/skills/kiwa-play/SKILL.md`
- 観点マッピング: `references/viewpoints-catalog.md` § 観点 × Layer 2 ランナーの推奨マッピング
