<!-- kiwa-layers: source=flag layers=contract -->

# test-spec-dogfood-token

- module: dogfood-token
- layer: contract
- 対象実装: `examples/dogfood-foundry-dapp/contracts/DogfoodToken.sol`

## 対象機能

`DogfoodToken` — dogfood app が Foundry 経路を端から端まで動かすための最小 ERC20。

production 品質を狙っておらず、 安定した ABI と少数の state 変化を test から観測できることが目的。
`transfer` / `approve` / `transferFrom` の 3 関数と constructor を持つ。

| 対象 | 1 文要約 |
|---|---|
| `constructor(uint256 initialSupply)` | 全量を deployer に配り `Transfer(address(0), deployer, initialSupply)` を emit する |
| `transfer(address to, uint256 amount)` | 残高が足りれば送信元から受信先へ移し、 `Transfer` を emit して `true` を返す |
| `approve(address spender, uint256 amount)` | allowance を上書きし、 `Approval` を emit して `true` を返す |
| `transferFrom(address from, address to, uint256 amount)` | 残高と allowance が足りれば allowance を減らして移し、 `Transfer` を emit して `true` を返す |

## 仕様の要約

### ユーザー操作

- token 保有者が `transfer` で他 address へ送る
- token 保有者が `approve` で spender に引出枠を与える
- spender が `transferFrom` で枠の範囲内を引き出す

### API 契約 (HTTP / RPC)

該当なし (on-chain contract、 HTTP endpoint を持たない)。

### DB / State 更新

| Table / State | 触れる column | tx 境界 |
|---|---|---|
| `totalSupply` | 全体 | constructor で 1 度だけ |
| `balanceOf` | `from` / `to` | `transfer` / `transferFrom` で 1 tx |
| `allowance` | `owner` → `spender` | `approve` で上書き、 `transferFrom` で減算 |

### 権限モデル

role を持たない。
引出の可否は `allowance[from][msg.sender]` の残量だけで決まり、 owner / admin / pause の概念が無い。

### 外部連携

該当なし。 他 contract を呼ばず、 oracle / bridge にも依存しない。

### 失敗 mode

| 失敗 | 契機 |
|---|---|
| `revert("balance")` | `transfer` / `transferFrom` で送信元の残高が不足 |
| `revert("allowance")` | `transferFrom` で spender の枠が不足 |

## 主な品質リスク

| 基準 | スコア | 根拠 1 文 |
|---|---|---|
| 売上影響 | 低 | dogfood 用の例で、 収益経路に乗らない |
| セキュリティ影響 | 中 | 残高と引出枠を直接動かすため、 検査が緩むと不正な移転を見逃す |
| データ破壊リスク | 中 | on-chain state は不可逆で、 誤った移転を戻せない |
| 利用頻度 | 中 | dogfood app の e2e から毎回呼ばれる |
| 過去障害履歴 | 低 | 該当 contract の bug 報告なし |

**総合リスク = 中**。

## 推奨テスト構成

| 層 | 方針 |
|---|---|
| 単体 (Foundry) | 4 関数すべて。 state 変化 / event / return / revert を別々に見る |
| 統合 | 不要 (他 contract を呼ばない) |
| E2E | dogfood app 側の e2e が別途 cover する |

## テスト観点一覧

| # | 観点 | 適用理由 |
|---|---|---|
| 1 | 正常系 | 常に |
| 2 | 異常系 | `require` 2 種の revert 契約を持つ |
| 3 | 境界値 | 残高ちょうど / 枠ちょうど の 2 境界がある |

`4 状態遷移` は status field を持たないため除外。
`5 権限` は role が無く、 引出の可否が枠の残量だけで決まるため観点 2 (異常系) に吸収される。
`6 入力バリデーション` は zero address の扱いが未定義のため § 不足している仕様 に記録し、 TC を起こさない。
`7 冪等性` / `8 並行処理` / `9 性能` / `10 セキュリティ` は本 contract の範囲に該当しない。
`11 回帰` は既存 test 3 件が存在するが、 過去 bug fix の再発防止を目的とする case が無いため今回は対象外。

## テストケース一覧

### 観点 1 — 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | 未 deploy | `initialSupply = 1_000_000e18` | `new DogfoodToken(1_000_000e18)` | `totalSupply : 0 → 1_000_000e18` | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | 未 deploy | `initialSupply = 1_000_000e18` | `new DogfoodToken(1_000_000e18)` | `balanceOf[deployer] : 0 → 1_000_000e18` | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | alice が 1_000e18 保有 | `to = bob, amount = 100e18` | alice として `transfer(bob, 100e18)` | `balanceOf[alice] : 1_000e18 → 900e18`、 `balanceOf[bob] : 0 → 100e18` | 高 | 推奨 |
| TC-004 | 単体 | 正常系 | alice が 1_000e18 保有 | `to = bob, amount = 100e18` | alice として `transfer(bob, 100e18)` | `emit Transfer(from=alice, to=bob, value=100e18)` | 高 | 推奨 |
| TC-005 | 単体 | 正常系 | alice が 1_000e18 保有 | `to = bob, amount = 100e18` | alice として `transfer(bob, 100e18)` | `return true` | 中 | 推奨 |
| TC-006 | 単体 | 正常系 | alice が 1_000e18 保有 | `spender = bob, amount = 500e18` | alice として `approve(bob, 500e18)` | `allowance[alice][bob] : 0 → 500e18` | 高 | 推奨 |
| TC-007 | 単体 | 正常系 | alice が 1_000e18 保有 | `spender = bob, amount = 500e18` | alice として `approve(bob, 500e18)` | `emit Approval(owner=alice, spender=bob, value=500e18)` | 中 | 推奨 |
| TC-008 | 単体 | 正常系 | alice が 1_000e18 保有、 bob に 500e18 approve 済 | `from = alice, to = bob, amount = 400e18` | bob として `transferFrom(alice, bob, 400e18)` | `balanceOf[alice] : 1_000e18 → 600e18`、 `balanceOf[bob] : 0 → 400e18` | 高 | 推奨 |
| TC-009 | 単体 | 正常系 | alice が 1_000e18 保有、 bob に 500e18 approve 済 | `from = alice, to = bob, amount = 400e18` | bob として `transferFrom(alice, bob, 400e18)` | `allowance[alice][bob] : 500e18 → 100e18` | 高 | 推奨 |

### 観点 2 — 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-010 | 単体 | 異常系 | alice が 1_000e18 保有 | `to = bob, amount = 10_000e18` | alice として `transfer(bob, 10_000e18)` | `revert("balance")` | 高 | 推奨 |
| TC-011 | 単体 | 異常系 | alice が 1_000e18 保有、 bob に 10_000e18 approve 済 | `from = alice, to = bob, amount = 5_000e18` | bob として `transferFrom(alice, bob, 5_000e18)` | `revert("balance")` (枠は足りるが残高が不足) | 高 | 推奨 |
| TC-012 | 単体 | 異常系 | alice が 1_000e18 保有、 bob に 100e18 approve 済 | `from = alice, to = bob, amount = 200e18` | bob として `transferFrom(alice, bob, 200e18)` | `revert("allowance")` | 高 | 推奨 |

### 観点 3 — 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-013 | 単体 | 境界値 | alice が 1_000e18 保有 | `to = bob, amount = 1_000e18` | alice として `transfer(bob, 1_000e18)` | 成功し `balanceOf[alice] : 1_000e18 → 0` | 中 | 推奨 |
| TC-014 | 単体 | 境界値 | alice が 1_000e18 保有、 bob に 500e18 approve 済 | `from = alice, to = bob, amount = 500e18` | bob として `transferFrom(alice, bob, 500e18)` | 成功し `allowance[alice][bob] : 500e18 → 0` | 中 | 推奨 |

## 既存 test との対応

`/kiwa-design` § Step 2 § 既存 test の探索 の実測結果と、 § テストケース一覧 の全 TC を突き合わせた結果。

- 探索した runtime — `solidity` (`docs/layers.json` の `contract` layer)
- 探索した path — `examples/dogfood-foundry-dapp/` 配下の `*.t.sol` と `*.test.ts` / `*.test.cjs` (`node_modules` と `lib` は除外)。 見つかったのは `test/` のみ
- 見つけた既存 test — 4 件 (`contract DogfoodTokenTest` 1 + `function test_*` 3)。 Hardhat 側は 0 件

| TC | 既存 test の候補 | 判定 |
|---|---|---|
| TC-001 | (なし) | 未覆 |
| TC-002 | (なし) | 未覆 |
| TC-003 | `test_transferReducesBalance` (`examples/dogfood-foundry-dapp/test/DogfoodToken.t.sol:17`) | 既覆 (候補) |
| TC-004 | (なし) | 未覆 |
| TC-005 | (なし) | 未覆 |
| TC-006 | (なし) | 未覆 |
| TC-007 | (なし) | 未覆 |
| TC-008 | `test_transferFromRespectsAllowance` (`examples/dogfood-foundry-dapp/test/DogfoodToken.t.sol:24`) | 既覆 (候補) |
| TC-009 | (なし) | 未覆 |
| TC-010 | `test_transferRevertsOnInsufficientBalance` (`examples/dogfood-foundry-dapp/test/DogfoodToken.t.sol:33`) | 既覆 (候補) |
| TC-011 | (なし) | 未覆 |
| TC-012 | (なし) | 未覆 |
| TC-013 | (なし) | 未覆 |
| TC-014 | (なし) | 未覆 |

`既覆 (候補)` の 3 件は中身を読み、 TC の入力と期待の両方を実際に走らせていることを確認した。

- TC-003 — `vm.prank(alice)` で 100e18 を送り、 alice 900e18 / bob 100e18 を `assertEq`
- TC-008 — 500e18 approve 後に bob が 400e18 引き出し、 alice 600e18 / bob 400e18 を `assertEq`
- TC-010 — 残高 1_000e18 に対し 10_000e18 を送り、 `vm.expectRevert(bytes("balance"))`

**TC-009 は候補なし**。
`test_transferFromRespectsAllowance` は名前に allowance を含むが、 assertion は balance 2 件だけで
`allowance` を 1 度も読んでいない。 名前で判定していたら `既覆` に倒れていた。

## 自動化すべきテスト

`未覆` / `不明` を先に置き、 その中で優先度順。

未覆 (11 件)。

1. **TC-001 / TC-002 / TC-006 / TC-009 (高)** — constructor の初期配布と、 `approve` / `transferFrom` が
   allowance に与える変化。 state を直接読む経路が 1 件も無い
2. **TC-011 / TC-012 (高)** — `transferFrom` の revert 2 種。 残高不足と枠不足を取り違えると、
   引出の可否判定が壊れても気付けない
3. **TC-004 / TC-007 (中)** — event の emit。 off-chain の index はこれだけを見るため、
   state が正しくても event が出なければ観測できない
4. **TC-005 (中)** — `transfer` の return 値
5. **TC-013 / TC-014 (中)** — 残高ちょうど / 枠ちょうど の境界

既覆 (候補) 3 件。 実装前に候補の中身を読み、 重複なら書かない。

- TC-003 (高) — `test_transferReducesBalance` が同じ入力と期待を走らせているため書かない
- TC-008 (高) — `test_transferFromRespectsAllowance` が同じ入力と期待を走らせているため書かない
- TC-010 (高) — `test_transferRevertsOnInsufficientBalance` が同じ入力と期待を走らせているため書かない

## 手動確認でよいテスト

(なし)

外部依存 / 時刻 / network のいずれにも触れず、 `forge test` で決定的に走るため手動確認を要する経路が無い。

## 不足している仕様

- **zero address への `transfer` / `transferFrom` の扱いが未定義**。 実装は `to == address(0)` を
  拒まないため、 送った token は誰も動かせなくなる。 「burn として許す」 のか「revert する」 のかが
  doc から読めないため、 本 spec では TC を起こしていない (観点 6 を非適用にした理由)
- **`approve` の上書き挙動が未定義**。 実装は既存 allowance を無条件で上書きするが、 ERC20 の
  known issue (approve race) に対する立場が書かれていない。 0 を経由させる運用にするかを決める必要がある
- **`totalSupply` を動かす経路が無い**。 mint / burn を持たないため supply は不変だが、 それが意図か
  未実装かが読めない
- 本 spec は Layer 2 の追記経路を確かめる dogfood として作成した。 contract 側の変更提案は含まず、
  現状の契約をそのまま記述している
