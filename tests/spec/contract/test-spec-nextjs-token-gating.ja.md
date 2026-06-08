# test-spec-nextjs-token-gating.md

> Layer 1 (`/kiwa-design --layer contract`) 出力 — Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat`) が消費する仕様書

## 対象機能

`nextjs-token-gating` — `GateNFT` (誰でも mint 可能な minimal ERC721) と `GatedContent` (NFT holder 限定で `getSecret()` 取得 + 期限付き access 付与) の 2 contract 連携で、 NFT 所有を gating の鍵にする token-gating dApp の contract 層。

対象 file:

- `examples/nextjs-token-gating/contracts/GateNFT.sol` (mint + transferFrom + ownerOf / balanceOf / totalSupply)
- `examples/nextjs-token-gating/contracts/GatedContent.sol` (constructor で GateNFT 紐付け、 getSecret / isGated / grantTimedAccess / hasAccess)

## 仕様の要約

### ユーザー操作

- 任意の address が `GateNFT.mint()` を呼び出して新規 tokenId を 1 から連番で発行する。
- NFT 所有者が `GateNFT.transferFrom(from, to, tokenId)` で別 address に転送する (自分の token のみ転送可)。
- NFT を 1 個以上保有する address が `GatedContent.getSecret()` を呼んで定数 `SECRET = "alpha-pass-2025"` を取得する (`accessCount` 加算 + `Accessed` event)。
- NFT 保有者が `GatedContent.grantTimedAccess(user, ttlSeconds)` で別 address に期限付き access を付与する (`block.timestamp + ttlSeconds` まで有効)。
- 任意 address が `GatedContent.isGated(user)` / `hasAccess(user)` を view で呼び出して access 可否を確認する。

### API 契約 (HTTP / RPC)

contract 関数の呼び出し契約は以下。 全て on-chain tx もしくは `view` call。

| 関数 | 種別 | 引数 | 戻り値 | event |
|---|---|---|---|---|
| `GateNFT.mint()` | tx | (なし) | `uint256 tokenId` | `Transfer(0, msg.sender, tokenId)` |
| `GateNFT.transferFrom(from, to, tokenId)` | tx | `address from, address to, uint256 tokenId` | (なし) | `Transfer(from, to, tokenId)` |
| `GateNFT.ownerOf(tokenId)` | view | `uint256 tokenId` | `address` | (なし) |
| `GateNFT.balanceOf(owner)` | view | `address owner` | `uint256` | (なし) |
| `GateNFT.totalSupply()` | view | (なし) | `uint256` | (なし) |
| `GatedContent.getSecret()` | tx | (なし) | `string` | `Accessed(msg.sender)` |
| `GatedContent.isGated(user)` | view | `address user` | `bool` | (なし) |
| `GatedContent.grantTimedAccess(user, ttlSeconds)` | tx | `address user, uint256 ttlSeconds` | `uint256 expiresAt` | `TimedAccessGranted(msg.sender, user, expiresAt)` |
| `GatedContent.hasAccess(user)` | view | `address user` | `bool` | (なし) |

### DB / State 更新

| State | 触れる field | tx 境界 |
|---|---|---|
| `GateNFT.ownerOf` | `tokenId → owner` | mint 1 tx / transferFrom 1 tx |
| `GateNFT.balanceOf` | `owner → count` | mint 加算 / transferFrom で from -1 + to +1 |
| `GateNFT.totalSupply` | scalar | mint で +1 (transferFrom は不変) |
| `GatedContent.accessCount` | scalar | getSecret で +1 |
| `GatedContent.timedAccessExpiry` | `user → expiresAt` | grantTimedAccess で上書き |
| `GatedContent.timedAccessGrantor` | `user → grantor` | grantTimedAccess で上書き |

### 権限モデル

- `GateNFT.mint()` — 誰でも実行可、 access control なし。 free mint 設計。
- `GateNFT.transferFrom(from, to, tokenId)` — `ownerOf[tokenId] == from` かつ `msg.sender == from` を要求 (`NotOwner` revert)、 OZ ERC721 と異なり approve / operator 経路は未実装。
- `GatedContent.getSecret()` — `hasAccess(msg.sender) == true` を要求 (`NotGated` revert)、 NFT 直接保有 or grantor 経由の期限付き access のいずれかで通る。
- `GatedContent.grantTimedAccess(user, ttl)` — 呼び出し元が NFT 保有 (`balanceOf(msg.sender) > 0`) を要求 (`NotGated` revert)、 `ttl == 0` で `InvalidTtl` revert。

### 外部連携

- `GatedContent` は constructor で `IGateNFT(gateNft)` interface を保持し `balanceOf` 経由で gating 判定する。 別 contract で同 interface を実装したものを渡せば任意の ERC721-like を gate にできる (interface 切替え可能)。
- 標準 ERC721 metadata (`tokenURI` 等) は未実装、 marketplace 互換性なし (本実装は最小 NFT)。
- 外部 oracle / RPC 依存なし、 全 state は on-chain self-contained。

### 失敗 mode

- `transferFrom` で非 owner が呼ぶ / from != ownerOf → `NotOwner` revert (custom error)。
- `transferFrom` で `to == address(0)` → `InvalidRecipient` revert (burn 経路を塞ぐ防御)。
- `getSecret` で `hasAccess(msg.sender) == false` → `NotGated` revert。
- `grantTimedAccess` で 呼び出し元が NFT 未保有 → `NotGated` revert。
- `grantTimedAccess` で `ttlSeconds == 0` → `InvalidTtl` revert。
- `hasAccess` で grantor が NFT を手放した場合、 既存 grantee の access は自動で revoke される (`gate.balanceOf(grantor) > 0` 判定が view 評価時に偽になる)。
- token がない address に対する view 呼び出し (`ownerOf[unknownId]`, `balanceOf[unknownAddr]`) は 0 / zero address を返す (revert なし、 Solidity mapping のデフォルト挙動)。

## 主な品質リスク

| 入力要素 | 売上影響 | セキュリティ影響 | データ破壊 | 利用頻度 | 過去障害 | 根拠 |
|---|---|---|---|---|---|---|
| `GateNFT.mint()` | 低 | 中 | 中 | 高 | 低 | free mint 設計で売上影響なし、 supply 無制限のため DoS リスクあり (mint loop で `totalSupply` overflow しないか) |
| `GateNFT.transferFrom()` | 低 | 高 | 高 | 中 | 低 | 不可逆 write、 owner check bypass で他人 NFT 移転リスク。 zero address burn 経路の防御テスト必須 |
| `GatedContent.getSecret()` | 中 | 高 | 低 | 高 | 低 | gating の核心、 hasAccess 経路 bypass で secret 漏洩。 `accessCount` 改ざんはない |
| `GatedContent.grantTimedAccess()` | 中 | 高 | 中 | 中 | 低 | grantor が NFT を後で手放した場合の自動 revoke ロジック (`hasAccess` が grantor 保有を再判定) が core security、 ttl 境界値で off-by-one |
| `GatedContent.hasAccess()` | 中 | 高 | 低 | 高 | 低 | view 関数だが `getSecret` の判定根拠、 expiry 比較 `< block.timestamp` の境界値 (== の扱い) で expire 直前 / 直後の扱いを確定 |

## 推奨テスト構成

| layer | 目的 | 観点 (Step 3 から選択) |
|---|---|---|
| 単体 | 各 contract 関数の正常系 / revert / 境界値を逐次検証 | 正常系 / 異常系 / 境界値 / 権限 / セキュリティ |
| 統合 | `GateNFT` ↔ `GatedContent` の 2 contract 連携 (mint → getSecret / transfer → revoke / grant → hasAccess 連鎖) を 1 シナリオで検証 | 状態遷移 / 冪等性 / 並行処理 |
| E2E | (本仕様書は contract 層のみ、 E2E は `/kiwa-design --layer e2e` の別仕様書で扱う) | (該当なし) |

## テスト観点一覧

`docs/SKILL-DESIGN.md` § Step 3 の 11 観点から選択。

- 1. 正常系 — 適用 (常に)
- 2. 異常系 — 適用 (revert path 5 種、 `NotOwner` / `InvalidRecipient` / `NotGated` × 2 / `InvalidTtl`)
- 3. 境界値 — 適用 (`totalSupply` の初期 / 連番、 `ttlSeconds` の 0 / 1、 `block.timestamp` と `expiresAt` の == 境界)
- 4. 状態遷移 — 適用 (mint → transfer で `ownerOf` / `balanceOf` 連動、 grant → expire で `hasAccess` true → false 遷移)
- 5. 権限 — 適用 (`transferFrom` の owner check、 `getSecret` の hasAccess gate、 `grantTimedAccess` の grantor 保有 check)
- 6. 入力バリデーション — 適用 (zero address `to`、 `ttlSeconds == 0`、 mapping default 0/zero の view 評価)
- 7. 冪等性 — 適用 (`grantTimedAccess` を同一 user に複数回呼ぶと expiry が上書きされる、 `mint` は per-call で別 tokenId 生成のため非冪等)
- 8. 並行処理 — 適用 (同 tx 内で 2 人が mint 連発しても `totalSupply` 競合せず連番、 同 user への複数 grantor からの grant が `timedAccessGrantor` 上書き経路で 1 つだけ残る)
- 9. 性能 — 非適用 (mint / transfer / getSecret はいずれも O(1) state 更新、 gas 計測は実装側 `forge --gas-report` 標準出力で十分、 性能専用 case は不要)
- 10. セキュリティ — 適用 (transfer の owner bypass / zero address burn 防御 / getSecret の access bypass / grantTimedAccess の grantor 後追い revoke)
- 11. 回帰 — 非適用 (現時点で既存 test / 過去 bug fix 履歴なし、 retrofit 経路なし)

## テストケース一覧

観点別グループ、 グループ内は優先度 (高 → 中 → 低) 順。

### 観点 1: 正常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-001 | 単体 | 正常系 | GateNFT deploy 直後 | (なし) | `mint()` を 1 回呼ぶ | tokenId 1 が返る、 `ownerOf[1] == msg.sender`、 `balanceOf[msg.sender] == 1`、 `totalSupply == 1`、 `Transfer(0, msg.sender, 1)` event | 高 | 推奨 |
| TC-002 | 単体 | 正常系 | TC-001 完了 | from=msg.sender, to=other, tokenId=1 | `transferFrom(from, to, 1)` を呼ぶ | `ownerOf[1] == other`、 `balanceOf[from] == 0`、 `balanceOf[to] == 1`、 `Transfer(from, to, 1)` event | 高 | 推奨 |
| TC-003 | 単体 | 正常系 | GateNFT で alice が mint 済、 GatedContent deploy 済 | (なし) | alice が `getSecret()` を呼ぶ | 戻り値 `"alpha-pass-2025"`、 `accessCount == 1`、 `Accessed(alice)` event | 高 | 推奨 |
| TC-004 | 統合 | 正常系 | alice が GateNFT で mint 済 | user=bob, ttl=3600 | alice が `grantTimedAccess(bob, 3600)` を呼ぶ | `timedAccessExpiry[bob] == block.timestamp + 3600`、 `timedAccessGrantor[bob] == alice`、 `TimedAccessGranted(alice, bob, expiresAt)` event、 直後 `hasAccess(bob) == true` | 高 | 推奨 |
| TC-005 | 統合 | 正常系 | TC-004 完了 (bob に grant 済) | (なし) | bob が `getSecret()` を呼ぶ | 戻り値 `SECRET`、 `accessCount += 1` | 高 | 推奨 |

### 観点 2: 異常系

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-006 | 単体 | 異常系 | NFT 未所有 | (なし) | NFT 未所有 address が `getSecret()` を呼ぶ | `NotGated` revert、 `accessCount` 不変、 event 発行なし | 高 | 推奨 |
| TC-007 | 単体 | 異常系 | NFT 未所有 | user=any, ttl=3600 | NFT 未所有 address が `grantTimedAccess(any, 3600)` を呼ぶ | `NotGated` revert、 state 不変 | 高 | 推奨 |
| TC-008 | 単体 | 異常系 | alice が tokenId 1 所有 | from=alice, to=bob, tokenId=1 | 非 owner (carol) が `transferFrom(alice, bob, 1)` を呼ぶ | `NotOwner` revert、 ownerOf / balanceOf 不変 | 高 | 推奨 |
| TC-009 | 単体 | 異常系 | alice が tokenId 1 所有 | from=alice, to=alice, tokenId=99 | alice が存在しない tokenId 99 で `transferFrom` を呼ぶ | `NotOwner` revert (ownerOf[99] == 0 != alice) | 中 | 推奨 |

### 観点 3: 境界値

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-010 | 単体 | 境界値 | alice が NFT 所有 | user=bob, ttl=0 | alice が `grantTimedAccess(bob, 0)` を呼ぶ | `InvalidTtl` revert、 state 不変 | 高 | 推奨 |
| TC-011 | 単体 | 境界値 | alice が NFT 所有 | user=bob, ttl=1 | alice が `grantTimedAccess(bob, 1)` を呼び、 同 block で `hasAccess(bob)` を view 評価 | `hasAccess(bob) == true` (expiry > block.timestamp) | 高 | 推奨 |
| TC-012 | 統合 | 境界値 | TC-011 完了 | (なし) | `vm.warp(expiresAt)` で expiry ちょうどに進めて `hasAccess(bob)` 評価 | `hasAccess(bob) == false` (`expiry < block.timestamp` を満たさず → grantor 経由 fallback に進むが、 grantor 所有判定で true になる場合あり) ※ 実装上 expiry == block.timestamp は false 扱い | 高 | 推奨 |
| TC-013 | 統合 | 境界値 | TC-011 完了 | (なし) | `vm.warp(expiresAt + 1)` で 1 秒超過 → `hasAccess(bob)` 評価 | grantor (alice) が NFT 保持なら true (grantor 直接 hold で素通り)、 alice の NFT を別 user に transfer 済なら false | 中 | 推奨 |
| TC-014 | 単体 | 境界値 | mint を連続実行 | (なし) | 同一 user が 3 回連続 `mint()` を呼ぶ | tokenId 1, 2, 3 が順に発行、 `totalSupply == 3`、 `balanceOf[user] == 3`、 各 mint で `Transfer` event 計 3 回 | 中 | 推奨 |

### 観点 4: 状態遷移

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-015 | 統合 | 状態遷移 | alice が tokenId 1 所有、 alice が `grantTimedAccess(bob, 3600)` 済 | (なし) | alice が `transferFrom(alice, carol, 1)` で NFT を carol に渡す → 直後に bob で `hasAccess(bob)` 評価 | `hasAccess(bob) == false` (grantor=alice が保有しなくなったため期限内でも自動 revoke、 contract の design 要点) | 高 | 推奨 |
| TC-016 | 統合 | 状態遷移 | TC-015 完了 (bob の grant が revoke 済) | (なし) | bob が `getSecret()` を呼ぶ | `NotGated` revert (期限切れ前でも grantor 喪失で access lost) | 高 | 推奨 |

### 観点 5: 権限

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-017 | 単体 | 権限 | alice が tokenId 1 所有、 alice が bob に approve 経路は実装なし | from=alice, to=carol, tokenId=1 | bob が `transferFrom(alice, carol, 1)` を呼ぶ (approve 経由想定の攻撃) | `NotOwner` revert (msg.sender != from のため、 approve 経路は実装されていないことを明示的に確認) | 高 | 推奨 |

### 観点 6: 入力バリデーション

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-018 | 単体 | 入力バリデーション | alice が tokenId 1 所有 | from=alice, to=address(0), tokenId=1 | alice が `transferFrom(alice, address(0), 1)` を呼ぶ | `InvalidRecipient` revert、 state 不変 (burn 経路の明示的封鎖) | 高 | 推奨 |
| TC-019 | 単体 | 入力バリデーション | alice が NFT 所有 | user=address(0), ttl=3600 | alice が `grantTimedAccess(address(0), 3600)` を呼ぶ | tx success (`address(0)` への grant は実装上許可されるが `hasAccess(0)` 評価は zero address のため意味なし、 仕様の明確化が必要) | 中 | 推奨 |

### 観点 7: 冪等性

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-020 | 統合 | 冪等性 | alice が NFT 所有 | user=bob, ttl=3600 (2 回連続) | alice が `grantTimedAccess(bob, 3600)` を 2 回連続で呼ぶ (2 回目の前に `vm.warp(+100)`) | 2 回目の `timedAccessExpiry[bob]` が後勝ち (上書き)、 1 回目の expiry は失われる、 `TimedAccessGranted` event 2 回発行 | 中 | 推奨 |
| TC-021 | 単体 | 冪等性 | (なし) | (なし) | 同 user が `mint()` を 2 回呼ぶ | tokenId 1, 2 が別々に発行 (非冪等、 重複なし)、 totalSupply == 2 | 中 | 推奨 |

### 観点 8: 並行処理

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-022 | 統合 | 並行処理 | (なし) | alice / bob 2 user | alice と bob が同 tx 内で順次 `mint()` を呼ぶ (vm.prank 切替で擬似並行) | tokenId 1 が alice、 tokenId 2 が bob、 双方 success、 totalSupply == 2、 balanceOf[alice] == balanceOf[bob] == 1 | 中 | 推奨 |
| TC-023 | 統合 | 並行処理 | alice / carol が NFT 所有 | user=bob, ttl=3600 (alice → 後で carol) | alice が `grantTimedAccess(bob, 3600)` → carol が `grantTimedAccess(bob, 7200)` を順に呼ぶ | `timedAccessGrantor[bob] == carol` (後勝ち)、 `timedAccessExpiry[bob] == carol の grant 時刻 + 7200`、 alice の grant 実質失効 | 中 | 推奨 |

### 観点 10: セキュリティ

| テスト ID | テストレベル | テスト観点 | 前提条件 | 入力値 | 操作手順 | 期待結果 | 優先度 | 自動化 |
|---|---|---|---|---|---|---|---|---|
| TC-024 | 統合 | セキュリティ | alice が NFT 所有 → bob に grant 済 → alice が NFT を carol に transfer | (なし) | bob が `getSecret()` を呼ぶ | `NotGated` revert (TC-015 / TC-016 と整合、 攻撃シナリオ「grant 後に grantor が NFT 売却して escape」を防ぐ) | 高 | 推奨 |
| TC-025 | 単体 | セキュリティ | (なし) | from=address(0), to=alice, tokenId=1 | 任意 user が `transferFrom(address(0), alice, 1)` を呼ぶ | `NotOwner` revert (msg.sender != from かつ ownerOf[1] != address(0) 両方該当、 minted token を zero-address からの transfer 経由で取得する攻撃の防御) | 高 | 推奨 |
| TC-026 | 統合 | セキュリティ | alice が NFT 所有、 alice が bob に grant、 grant 後 alice が NFT を burn (= transferFrom alice → 0... ただし InvalidRecipient で reject される) | (なし) | alice が `transferFrom(alice, address(0), 1)` を試みる | `InvalidRecipient` revert、 burn 経由で grantor 状態を曖昧にする攻撃は不可 | 中 | 推奨 |

## 自動化すべきテスト

優先度順 (高 → 中 → 低)。 Layer 2 skill (`/kiwa-forge` / `/kiwa-hardhat`) が次フェーズで `test/*.t.sol` / `hardhat-test/*.test.cjs` に変換する。

- TC-001 / TC-002 / TC-003 / TC-004 / TC-005 (高) — 正常系 mint / transfer / getSecret / grant / grant 後アクセス
- TC-006 / TC-007 / TC-008 (高) — 異常系 `NotGated` / `NotOwner` revert
- TC-010 / TC-011 / TC-012 (高) — 境界値 ttl=0 / ttl=1 / expiry 境界
- TC-015 / TC-016 (高) — 状態遷移 grantor の NFT 喪失で自動 revoke
- TC-017 (高) — 権限 approve 経路不在の確認
- TC-018 (高) — 入力バリデーション zero address `to` 拒否
- TC-024 / TC-025 (高) — セキュリティ grantor escape 攻撃 / zero address from 攻撃
- TC-009 / TC-013 / TC-014 (中) — 境界値の補助 case
- TC-019 (中) — 入力バリデーション zero address grant (仕様未確定 / fuzz で網羅)
- TC-020 / TC-021 (中) — 冪等性 grant 上書き / mint 非冪等
- TC-022 / TC-023 (中) — 並行処理 mint 順次 / grant 上書き race
- TC-026 (中) — セキュリティ burn 経由 grantor 状態曖昧化攻撃の不可確認

## 手動確認でよいテスト

(なし) — contract 層は全 case を Foundry / Hardhat で自動化する。 動作の手触り確認 (block explorer での event 表示 / Etherscan ABI 読み込み) は E2E (`/kiwa-design --layer e2e`) で扱う。

## 不足している仕様

- `grantTimedAccess(address(0), ttl)` を意図的に許可するかどうかが仕様書に未定義。 現実装は revert なしで通るが、 zero address grant が `hasAccess(address(0))` 経由で意味のある operation になるかが不明 (TC-019 の期待結果が仕様確定後に変わる可能性)。
- `totalSupply` の上限が無制限 (uint256 max) で運用される設計か、 将来的に supply cap を入れる予定か不明。 DoS / gas 攻撃シナリオの優先度が変動する。
- `transferFrom` で approve / setApprovalForAll 経路を後から追加する予定があるか不明。 現状 ERC721 標準 interface 不完全 (marketplace 互換性なし)、 後追い実装時に既存 test の前提が崩れる可能性。
- `hasAccess` で `timedAccessExpiry[user] < block.timestamp` の比較が `<` なのか `<=` なのかは実装上 `<` だが、 仕様意図 (expiry ちょうどで access 可 / 不可) が文書化されていない。 TC-012 の期待結果はこの解釈に依存。
