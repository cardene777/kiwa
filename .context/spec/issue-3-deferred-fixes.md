# spec: issue-3-deferred-fixes

## タスクサマリ

PR #2 で MVP merge 済の kiwa core に対し、adversarial review で deferred 判定された 11 finding (F-09 / F-11〜F-20) を error 正規化 / lifecycle 堅牢化 / public surface clean-up の 3 軸で解消する。
public API contract (EIP-1193 error code + Playwright 標準 method 非破壊) を v0.1.0 publish 前に確定し、v0.2 以降の breaking を最小化する。

## 受入条件 (AC)

- AC 1 (error 正規化): EIP-1193 `code` property が `page.exposeFunction` 境界を越えて page 側 catch まで保持され、`eth_subscribe` reject で page 側 try/catch から `err.code === 4200` が観測できる
- AC 2 (error 正規化): malformed input (`JSON.parse` 失敗 / anvilProxy non-200 / sendTransaction 失敗) が無条件 throw でなく `Eip1193Error(code, msg)` に正規化され、revert は `code 3` / parse error は `-32700` / transport は `-32603` で区別される
- AC 3 (lifecycle 堅牢化): real dApp の page boot 時点で `window.ethereum` が定義済みであることが保証され、`page.setContent` / `page.click` が Playwright 標準仕様のまま (monkey-patched でない) test fixture から使える
- AC 4 (lifecycle 堅牢化): anvil binary 不在時に `startAnvil` が `ENOENT` を child error listener で捕捉し、`SIGKILL` 後は実プロセス exit を待ってから reservedPorts から解放する
- AC 5 (public surface clean-up): `examples/basic-connect/package.json` の `viem` が `dependencies` から `devDependencies` へ移動し、`rpc-handlers.ts` の `eth_sendTransaction` 動的 import が静的 import に置換され、`personal_sign` の hex/text policy が `docs/ERRORS.md` (Issue #6 と並走で先行追加可) または source コメントで明文化される
- AC 6 (回帰非破壊): 既存 vitest 25 + Playwright E2E 6 が全 PASS 維持、新規 negative test 4-8 件追加で error 正規化と lifecycle 改善を検証する

## スコープ境界

### in (本 Issue で対応)

| 観点 | in |
|---|---|
| error envelope | page bridge で `{ result } | { error: { code, message } }` 形式、injector-script で page 側 Error 再構築 |
| RPC handler 例外 | `JSON.parse(typedDataJson)` を try/catch で `Eip1193Error(-32700)` 化、`anvilProxy` で `res.ok` + JSON shape 検証 |
| TX error 分類 | viem error type を判定し revert は `code 3`、transport は `-32603`、invalid params は `-32602` |
| fixture lifecycle | `addInitScript` を `page.setContent` 前に保証する API 設計、`setContent` / `click` の monkey patch 撤去 |
| anvil error handling | `stopProcess` で `SIGKILL` 後 `exit` 待機 (F-13 child.on('error') は PR #2 で実装済み、本 Issue scope 外) |
| Pending RPC 同期 | `__dappE2ePendingRpcCount` 削除、`DappE2eApi.waitForRpcIdle()` 明示 API 追加、Node 側で request ID 管理 |
| public surface | examples viem 移動、rpc-handlers 動的 import 静的化、personal_sign hex policy 明文化 (source コメント) |
| 新規 test | `eth_subscribe` page reject / malformed typed data / anvilProxy transport / tx revert vs transport 区別 / waitForRpcIdle (6 件) |

### out (本 Issue で対応しない)

| 観点 | out |
|---|---|
| F-01〜F-08 + F-13 (PR #2 で対応済) | wallet_switchEthereumChain / signer 検証 / from 検証 / port allocator / child.on('error') ENOENT 等は再修正しない |
| Changesets / CI workflow | Issue #4 で対応 |
| CLI init template | Issue #5 で対応 |
| README + docs/ (全面) | Issue #6 で対応、本 Issue は personal_sign hex policy だけ source コメント or README 1 行追記まで |
| EIP-6963 announce | Issue #7 (v0.2 目玉) で対応 |
| 新規 RPC method 追加 | スコープ外、現状 10 RPC + anvilProxy fallback 維持 |
| 新規 event 追加 | スコープ外、現状 4 event 維持 |
| public API 拡張 (新 fixture option 等) | `waitForRpcIdle` の追加と error envelope 以外は追加しない |
| Playwright バージョン bump | 別 Issue (依存 update は changesets 経由) |

## 反例ケース (動かないはず・対象外)

- 反例 1: 本 Issue で新規 RPC method (例 `eth_subscribe` を support 化、`eth_signTransaction` 追加) を実装する PR は親 roadmap spec の「現状 10 RPC + anvilProxy fallback 維持」違反、reject 対象
- 反例 2: `waitForRpcIdle` 以外に新しい `DappE2eApi` メソッド (`waitForChainChange` 等の event 待ち helper) を追加する PR はスコープ外 (Issue #7 候補)
- 反例 3: `examples/basic-connect` 以外の新 example package を追加する PR はスコープ外 (Issue #5 CLI template 起票範囲)
- 反例 4: `page.setContent` モンキーパッチを「より堅牢に」する PR は AC 3 違反 (monkey patch 自体を撤去するのが正解、Playwright 標準 method を保つ)
- 反例 5: `__dappE2ePendingRpcCount` を維持しつつ別の同期手段を追加する PR は AC 4 違反 (counter 自体を削除して `waitForRpcIdle` 明示 API に統一)

## 影響範囲 (touched file 候補)

grep ベースで確認済み、6 file (5 src + 1 examples) の修正 + 4 file 新規 (test + docs 部分追記)。

### 修正対象 (5 src + 1 examples)

- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/injector-script.ts` (F-12 envelope unwrap, F-18 counter 削除)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/fixture.ts` (F-09 setContent 順序, F-18 click monkey patch 撤去 + waitForRpcIdle 配線, F-12 envelope wrap)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/rpc-handlers.ts` (F-14 JSON.parse try/catch, F-15 anvilProxy ok + shape 検証, F-20 動的 import 静的化, F-11 hex policy comment)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/tx.ts` (F-16 viem error type で code 3 / -32603 / -32602 分岐)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/anvil.ts` (F-13 child.on('error') 追加, F-17 SIGKILL 後 exit 待機)
- `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/package.json` (F-19 viem を dependencies → devDependencies)

### 新規 / 拡張 (4 file)

- `/Users/cardene/Desktop/projects/kiwa/packages/core/src/types.ts` (拡張 — `DappE2eApi.waitForRpcIdle()` シグネチャ + error envelope 型)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/injector.test.ts` (拡張 — malformed typed data / anvilProxy error / hex policy negative test 追加)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/tx.test.ts` (拡張 — revert vs transport error 区別 negative test 追加)
- `/Users/cardene/Desktop/projects/kiwa/packages/core/tests/anvil.test.ts` (拡張 — ENOENT child error 即時 reject test 追加)
- `/Users/cardene/Desktop/projects/kiwa/examples/basic-connect/tests/connect.spec.ts` (拡張 — eth_subscribe code 4200 page 側 catch + waitForRpcIdle test 追加)

合計 — 修正 6 file (5 src + 1 examples package.json) + 拡張 5 file (1 types + 4 test) = **11 file**。
test は新規 file ではなく既存 test ファイル拡張で対応 (Issue 粒度を抑える)。

## 既知のリスク・前提

### error envelope の public API 影響

`{ result } | { error: { code, message } }` envelope は page 境界の internal 設計だが、page 側 injector script の挙動 (`window.ethereum.request` の reject error 形状) が変わる。
dApp 側 `try { await ethereum.request(...) } catch (e) { e.code }` パターンは保持されるよう Error 再構築で吸収する。

### `waitForRpcIdle` の API 形

`DappE2eApi.waitForRpcIdle(timeoutMs?: number): Promise<void>` を追加。
内部実装は Node 側の pending request `Map<id, Promise>` を `Promise.all` で待機。
default timeout 10s、超過時は `Eip1193Error(-32603, 'waitForRpcIdle timeout')`。

### Playwright 標準 method の非破壊

PR #2 で `page.setContent` / `page.click` を monkey patch していたが、本 Issue で撤去する。
代替手段は以下の 2 段構成:

1. fixture で `page.addInitScript` を contextOptions 経由で確実に navigate 前 inject
2. `page.click` の RPC drain 待ちは `waitForRpcIdle()` 明示呼び出しに移行 (test 側で必要なら呼ぶ)

これにより locator clicks / programmatic DOM clicks / 遅延 RPC でも drain 待ちが効くようになる。

### test 追加方針

新規 negative test は 4-8 件で抑える。
具体的:
- T-INJ-013 malformed typed data → -32700 reject
- T-INJ-014 anvilProxy 接続失敗 → -32603 reject
- T-INJ-015 personal_sign に invalid hex (`0xg`) → -32602 reject
- T-TX-004 revert と transport error の code 区別
- T-E2E-007 eth_subscribe を page 側 catch で code 4200 確認
- T-E2E-008 waitForRpcIdle で chained RPC 完了待機

vitest 25 → 29 (+4)、E2E 6 → 8 (+2)、計 31 → 37 test。

(T-ANV-005 候補は RED 化検証時に anvil.ts L72-79 で child.on('error') が既に PR #2 実装済みと判明、F-13 を out scope に移動済み)

### 粒度判定

- AC 数: 6 件 (推奨 3-5 上限を 1 超え、定量基準上は **黄**)
- 影響範囲 file 数: 11 file (推奨 5 以下を超過、定量基準上は **赤**)
- 推定実装時間: 60 分 (6 AC × 10 分、定量基準上は **赤**)

定量判定: **赤 (分割推奨)**。

ただし以下の理由で単発 Issue 化を許容する:

- 3 軸 (error / lifecycle / surface) は同一 PR 内で整合性確保が必要 (例 error envelope と waitForRpcIdle は injector-script で結合、分割すると 2 度修正リスク)
- 11 file のうち 5 は test 拡張で挙動修正なし、修正 src は 5 file + examples 1 file の 6 file
- v0.1.0 publish 前の public API 確定が目的、Issue 分割で publish 遅延すると Issue #4-#6 の依存が動かない
- 親 roadmap spec で「3 軸統合の 1 PR」と明示済み

### 親 roadmap spec との整合

本 Issue は `.context/spec/kiwa-v0.1.0-roadmap.md` の Issue #3 行に対応。
roadmap で示した「11 finding 解消」「v0.1.0 publish 前提」「Issue #4 (Changesets) は本 Issue merge 後着手」の依存順序を守る。

### 後続 Issue との依存

- 本 Issue merge 後、Issue #4 (Changesets + CI + provenance) が着手可能になる
- Issue #5 (CLI init) と Issue #6 (README + docs/) は本 Issue の error envelope / hex policy 仕様確定を待つ
- Issue #7 (EIP-6963) は本 Issue の injector-script リファクタを起点に拡張する

### Non-Goal の再確認 (親 roadmap から継承)

WalletConnect v2 / Hardware wallet / Solidity unit test / vitepress site / CLI record/run / wallet 別 class 化 / 独自 RLP 実装 は永続的 out of scope。
