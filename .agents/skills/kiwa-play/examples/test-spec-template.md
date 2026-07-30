# test-spec-{example}.md (template)

実物 example: `nextjs-token-gating` で Step 1.5 通過した仕様書のサンプル。 新規 test を書く時はこれを Write template として流用する。

## 対象 example

`examples/nextjs-token-gating/` — NFT 所有を access control 条件とする dApp、 timed access grant + transfer 連動 revoke を実装。

## 既存 test (現状)

| test 名 | 検証内容 | 状態 |
|---|---|---|
| T-GT-000 | warmup page render | EXISTING |
| T-GT-001 | connect 後 nftBalance / isGated / accessCount 数値表示 | EXISTING |
| T-GT-002 | Mint NFT で nftBalance +1、 isGated=true | EXISTING |
| T-GT-003 | mint 後 Read Secret で secret 取得 + accessCount +1 | EXISTING |
| T-GT-004 | mint 後 isGated=true で読み取り可能 (累積動作確認) | EXISTING |
| T-GT-005 | GatedContent.SECRET 定数 == "alpha-pass-2025" | EXISTING |
| T-GT-006 | TTL expiration test (期限切れで access 失効) | EXISTING |
| T-GT-007 | post-transfer revocation test (NFT 譲渡で grantee 失効) | EXISTING |

## 新規追加 test (本作業)

| test 名 | 検証内容 | AC (受入条件) | 偽陽性リスク |
|---|---|---|---|
| T-GT-008 | grantTimedAccess を NFT 非保有者から呼ぶと NotGated() で revert | simulateContract → NotGated() で expectCustomError、 timedAccessExpiry[user] 不変 | 3 (access control の partial 検証、 NotGated は 1 経路のみ確認なので他 protected fn も同様に叩く) |
| T-GT-009 | grantee 2 名に同時に grant 後、 grantor が NFT を transfer したら 2 名とも同時に access 失効 | hasAccess(granteeA) === false && hasAccess(granteeB) === false | 4 (time-warp なしの test だが、 各 test 後の anvil state リセット要否を確認) |

## contract 改変 (もしあれば)

contract 改変なし — 既存の `grantTimedAccess` + `hasAccess` でカバー可能。

## scope 境界 (やらないこと明示)

- timed access の延長 (grant 後の expiry 上書き) は対象外
- multi-NFT holder の access チェーン (grantor → sub-grantor) は対象外
- gas 最適化は対象外

## 影響範囲

- 既存 test 8 件への regression 可能性: 低 (新 test 追加のみで既存 contract に変更なし)
- 他 example への影響: なし (token-gating 単独)
