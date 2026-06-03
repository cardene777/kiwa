# spec: issue-14-set-approval-mode

## タスクサマリ

`dappE2e.setApprovalMode(mode: 'approve' | 'reject')` を追加し、`personal_sign` / `eth_signTypedData_v4` / `eth_sendTransaction` / `wallet_switchEthereumChain` の 4 method で User Reject (EIP-1193 code 4001) 経路を test 側から任意発火可能にする。
v0.2 マイルストーン最優先機能で、実 MetaMask 損代カバレッジを 90% (Approve 経路のみ) → 95% (Reject 経路含む) へ引き上げる。

## 受入条件 (AC)

- AC 1: `dappE2e.setApprovalMode('reject')` 呼出後、`personal_sign` / `eth_signTypedData_v4` / `eth_sendTransaction` / `wallet_switchEthereumChain` 4 method が EIP-1193 code 4001 (`User rejected the request.`) で reject される
- AC 2: `dappE2e.setApprovalMode('approve')` で既存挙動 (常に approve) に戻ること、各 test 開始時の default は `approve` (既存テスト breaking なし)
- AC 3: `packages/core/tests/approval-mode.test.ts` (新規) で approval mode 切替の 4-6 ケースが全 PASS する (approve default / reject 切替 / 4 method 個別 reject / mode 復帰)
- AC 4: `examples/basic-connect/tests/connect.spec.ts` に Reject 経路の e2e ケースが 1-2 件追加され全 PASS する
- AC 5: `docs/RPC.md` の 4 method (`personal_sign` / `eth_signTypedData_v4` / `eth_sendTransaction` / `wallet_switchEthereumChain`) error code 列に `4001 (User Rejected)` が追加され、approval mode 利用例セクションが追記されている

## スコープ境界

### in (本 Issue で対応)

- `packages/core/src/types.ts` に `ApprovalMode = 'approve' | 'reject'` 型と `DappE2eApi.setApprovalMode(mode)` method 追加
- `packages/core/src/rpc-handlers.ts` の `RpcContext` に `approvalMode: { current: ApprovalMode }` 形式の mutable field 追加、4 method 冒頭に approval check 追加
- `packages/core/src/fixture.ts` の `dappE2e` API に `setApprovalMode(mode)` を export、default `'approve'` で初期化
- `packages/core/tests/approval-mode.test.ts` を新規追加 (vitest 4-6 ケース)
- `examples/basic-connect/tests/connect.spec.ts` に Reject e2e 1-2 ケース追加
- `docs/RPC.md` に code 4001 列追加 + approval mode 利用例セクション追加

### out (本 Issue で対応しない)

- `eth_requestAccounts` / `eth_accounts` / `eth_chainId` / `net_version` への approval check (read-only method は wallet popup 不在の経路と整合しない、反例 1)
- `window.ethereum.setApprovalMode` という dApp 側 API 露出 (test fixture API 限定、反例 2)
- `'auto'` mode の user-defined predicate 実装 (将来拡張ポイントとして type 上は残すが、本 PR では `'approve' | 'reject'` の 2 値のみ実装)
- `chainChanged` / `accountsChanged` event の approval check (event は user 操作の通知、approval 不要、反例 4)
- `docs/APPROVAL.md` 新規 file 作成 (RPC.md セクション追記で十分、粒度過剰)
- 既存 sign 系 RPC の signature 値 mock (本 PR では reject 経路のみ、approve 経路は viem signer の既存挙動を維持)

## 反例ケース (動かないはず・対象外)

- 反例 1: `eth_requestAccounts` / `eth_accounts` / `eth_chainId` / `net_version` に approval check を追加する PR → read-only method は wallet popup 不在の経路と整合しない、scope 違反
- 反例 2: `window.ethereum.setApprovalMode` で dApp 側から呼べるようにする PR → test 側 fixture API としてのみ提供、dApp コードから呼ぶ経路は意味ない
- 反例 3: default を `'reject'` にする PR → 既存 test の全 breaking、default は `'approve'` で既存挙動互換 (AC 2)
- 反例 4: `chainChanged` / `accountsChanged` event を approval check 対象に含める PR → event は user 操作の通知、approval 不要
- 反例 5: `setApprovalMode` を class instance method ではなく global variable で実装する PR → test 並列実行時の state 漏れ、`RpcContext` 単位で持たせる
- 反例 6: approval check を `BLOCKED_METHODS` set に統合する PR → blocked は永久 unsupported 扱い (code 4200)、reject は user 拒否扱い (code 4001) で意味が異なる

## 影響範囲 (touched file 候補)

新規 1 file:
- `packages/core/tests/approval-mode.test.ts` (AC 3、vitest 4-6 ケース)

修正 6 file:
- `packages/core/src/types.ts` (AC 1, AC 2、`ApprovalMode` 型 + `DappE2eApi.setApprovalMode` 追加)
- `packages/core/src/rpc-handlers.ts` (AC 1、`RpcContext` 拡張 + 4 method 冒頭 approval check)
- `packages/core/src/fixture.ts` (AC 1, AC 2、`dappE2e.setApprovalMode` export + default `approve` 初期化)
- `examples/basic-connect/tests/connect.spec.ts` (AC 4、Reject e2e 1-2 ケース)
- `docs/RPC.md` (AC 5、code 4001 列追加 + approval mode セクション)
- `packages/core/src/index.ts` (AC 1、`ApprovalMode` 型 export 必要なら)

grep ベース確認結果。

```text
packages/core/src/fixture.ts:7:    handleRpcRequest, type RpcContext  (RpcContext import 経路)
packages/core/src/rpc-handlers.ts:11-16: RpcContext interface 定義 (approvalMode field 追加位置)
packages/core/src/rpc-handlers.ts:31:    handleRpcRequest 関数本体 (approval check 追加位置)
packages/core/src/types.ts:78:   DappE2eApi interface (setApprovalMode method 追加位置)
docs/RPC.md: code 列 + 各 method 説明 (4001 行追加 + approval mode セクション)
```

合計 6-7 file (新規 1 + 修正 5-6)。

## 既知のリスク・前提

- リスク 1: approval check を method ごとに重複コピペで書くと保守性低下 → `assertApproved(ctx, methodName)` のような helper を rpc-handlers.ts 内に private 関数として抽出、4 method 冒頭で 1 行呼び出しする設計
- リスク 2: `RpcContext.approvalMode` を直接 string で持つと test 並列実行で state 共有事故 → `{ current: ApprovalMode }` のような mutable ref で持たせて fixture 単位で reset
- リスク 3: `'auto'` mode を type 上残すと未実装挙動に doc 等が言及するリスク → 本 PR では `'approve' | 'reject'` のみ実装、`'auto'` は type 拡張ポイントとして残さず後続 Issue で追加 (type は `'approve' | 'reject'` のみで宣言)
- リスク 4: examples/basic-connect の e2e test 追加で flaky になる懸念 → Reject 経路は popup 不要の deterministic 動作、flaky リスクは Approve 経路より低い
- 前提 1: `Eip1193Error` class は既に packages/core/src/types.ts に存在 (L13-21)、`throw new Eip1193Error(4001, 'User rejected the request.')` で発火可能
- 前提 2: `DappE2eApi` interface は packages/core/src/types.ts L78-86 に存在、`setApprovalMode` method 追加箇所が明確
- 前提 3: `RpcContext` は packages/core/src/rpc-handlers.ts L12-17 に存在、`approvalMode` field 追加箇所が明確
- 前提 4: 既存 BLOCKED_METHODS (L19-25) は永久 unsupported (code 4200) で、approval check (code 4001) と意味が異なる → 別経路で実装する

## 粒度判定

- AC 数: 5 (推奨 3-5 上限、緑)
- 影響ファイル数: 6-7 (推奨 5 以下を上限超過、黄)
- 推定実装時間: 約 60-90 分 (実装 30 分 + vitest 20 分 + e2e 20 分 + docs 10 分、推奨 30 分超過、黄〜赤境界)

**判定: 黄 (警告)** — AC は 5 件で許容範囲だが、影響ファイル数 6-7 + 推定実装時間 60-90 分は中規模スコープ。
v0.2 マイルストーン本筋機能で AC 5 は分割困難 (機能 1 つ = test 1 セット = docs 1 set で密結合)。
本 PR で単発実装する方針、PR 内でレビュー round が 2-3 回発生する想定。
