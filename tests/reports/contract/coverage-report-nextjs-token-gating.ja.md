# Contract Coverage Report — nextjs-token-gating (Foundry)

Generated: 2026-06-08
Skill: /kiwa-forge | Run: round 2 (final)
Loop terminated: production_100_achieved

## 1. 判定サマリ

| 結果 | production target | Total |
|---|---|---|
| Lines | ✅ 100.00% (35/35) | 100.00% (35/35) |
| Statements | ✅ 100.00% (44/44) | 100.00% (44/44) |
| Branches | ✅ 100.00% (8/8) | 100.00% (8/8) |
| Functions | ✅ 100.00% (7/7) | 100.00% (7/7) |

**判定 — ✅ PASS** (production target 全 4 metric 100% 到達、 残 uncovered 0、 auto loop 2 round で完走、 stalled なし)。

実行サマリ — `forge test` 29 passed / 0 failed / 0 skipped、 wall 110ms、 `forge test --gas-report` で gas 計測も成功 (mint 平均 85,473 gas、 grantTimedAccess 平均 63,263 gas)。

## 2. file 別 coverage 内訳 (production / test / mock 分類)

| File | カテゴリ | Lines | Stmts | Branches | Funcs | threshold 対象? |
|---|---|---|---|---|---|---|
| `contracts/GateNFT.sol` | production | 100% (13/13) | 100% (15/15) | 100% (2/2) | 100% (2/2) | ✅ |
| `contracts/GatedContent.sol` | production | 100% (22/22) | 100% (29/29) | 100% (6/6) | 100% (5/5) | ✅ |
| `test/TokenGating.t.sol` | test 自身 | (計測対象外) | - | - | - | ❌ |

## 3. 未到達 line の分類と判断

(なし) — production 全 4 metric 100% 到達のため、 分類対象なし。

### Round 1 → Round 2 で解消した未踏 branch

- **`GatedContent.sol:54` `if (grantor == address(0)) return false`** の true 分岐
  - **分類**: 真の未踏 (default mapping value の view 挙動)
  - **原因**: 通常運用では `timedAccessExpiry[unknown] == 0` で line 52 `0 < block.timestamp` が true 評価され早期 return false、 line 54 に到達しない。
  - **追加 test**: `test_HasAccess_NeverGranted_GrantorZero` — `vm.warp(0)` で `block.timestamp == 0` に戻し line 52 を false 通過 → line 54 の grantor==0 branch に到達。

## 4. Layer 1 spec への書き戻し提案

| 項目 | 反映先 section | 形式 |
|---|---|---|
| **TC-013 期待結果の訂正** | テストケース一覧 § 観点 3 境界値 | 「grantor が NFT 保有なら true」→ 「`expiry < ts` 早期 return で常に false (grantor 保有有無に関わらず)」 |
| **「不足している仕様」 #4 の解消** | 不足している仕様 / テストケース一覧 | `hasAccess` の `<` 演算子で「expiry == ts は false 経路に入らず、 grantor 経由 fallback で評価される」を明示。 TC-012 / TC-013 で test 化済 |
| **追加 TC-027 — hasAccess の default mapping branch (coverage 補完)** | テストケース一覧 § 観点 6 入力バリデーション | 9 column 表に新規追加 (TC-027: vm.warp(0) で grantor==0 branch を踏む) |

> 注 — 本 skill (Layer 2) は spec を書き換えず、 上記提案を report に列挙のみ。 spec への反映は user 手動 or `/kiwa-design --mode update` (別 Issue 検討予定)。

## 5. test-passed marker

`test-passed` marker 作成条件 — production 全 4 metric 100% 到達 → ✅ 作成済。
