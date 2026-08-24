# adversarial-pitfalls.md

kiwa MVP foundation の adversarial review (公開 PR 3 件 — [#145](https://github.com/cardene777/kiwa/pull/145) / [#146](https://github.com/cardene777/kiwa/pull/146) / [#147](https://github.com/cardene777/kiwa/pull/147)) で検出された 9 件の finding (CRITICAL 3 / MAJOR 4 / MINOR 2) から抽出した、 dApp test 設計の典型偽陽性パターン集。

新規 test を書くとき、 これらに該当しないか self-check する。 各 PR の diff は GitHub から直接読めるので、 該当 finding の修正前後のコードを参照しながらパターンを学べる。

## 1. 固定 nonce 偽陽性 (replay 検証)

### 症状

replay 攻撃防御 test で固定値 nonce (例 `replayNonce = 777n`) を使って 2 回 unlock() を叩く。 contract 側で nonce 伝搬が壊れていても test PASS する。

### 検出例

[PR #146](https://github.com/cardene777/kiwa/pull/146) T-BR-007 (`examples/nextjs-bridge/tests/bridge.spec.ts:458`):

```ts
// ❌ 偽陽性
const replayNonce = 777n;
await operatorUnlock(replayNonce, recipient, amount);  // 1 回目: nonce 777 で unlock 成功
await operatorUnlock(replayNonce, recipient, amount);  // 2 回目: AlreadyUnlocked() 期待
```

`bridgeBurn()` → `burnNonce` → `unlock()` の経路全体が壊れても、 nonce 777 で 1 回目を直叩きできれば PASS する。

### 正しい書き方

```ts
// ✅ 動的 nonce
const burnHash = await userClient.writeContract({
  address: destBridge,
  abi: DEST_ABI,
  functionName: 'bridgeBurn',
  args: [amount, l1Recipient],
});
const burnReceipt = await pub.waitForTransactionReceipt({ hash: burnHash });
const burnedNonce = parseBurnedNonceFromLogs(burnReceipt.logs);

await operatorUnlock(burnedNonce, l1Recipient, amount);  // 1 回目: 実 nonce で成功
await expectRevert(() => operatorUnlock(burnedNonce, l1Recipient, amount), 'AlreadyUnlocked');
```

## 2. UI 経由していない E2E 偽陽性

### 症状

「E2E test」と称しているが Playwright で UI を一切操作せず、 直接 RPC で `writeContract` を叩いている。 UI regression を全て見逃す。

### 検出例

[PR #146](https://github.com/cardene777/kiwa/pull/146) T-BR-008 (`examples/nextjs-bridge/tests/bridge.spec.ts:524`):

```ts
// ❌ 偽陽性
await userBridgeBurn(amount, l1Recipient);  // 直接 helper で RPC を叩く
await operatorUnlock(burnedNonce, l1Recipient, amount);
expect(l1Balance).toBe(...);
```

burn-button の onClick wiring が壊れていても、 chain switch 関連の bug が UI に潜んでいても、 test は素通りする。

### 正しい書き方

```ts
// ✅ UI 経由
await page.getByTestId('switch-l2-button').click();
await page.getByTestId('burn-amount-input').fill(String(amount));
await page.getByTestId('burn-recipient-input').fill(l1Recipient);
await page.getByTestId('burn-button').click();
await page.waitForSelector('[data-testid="burn-success"]');

// operator unlock のみ helper (off-chain relayer 相当なので OK)
await operatorUnlock(burnedNonce, l1Recipient, amount);
```

## 3. Access control の partial 検証

### 症状

`hasAccess(user)` のような boolean だけ assertion し、 別エントリポイント (`grantor` / `msg.sender` / `transferFrom`) を叩かないため self-grant bypass を素通りする。

### 検出例

[PR #147](https://github.com/cardene777/kiwa/pull/147) T-GT-007 (`examples/nextjs-token-gating/contracts/GatedContent.sol:48`):

```sol
// ❌ 脆弱な hasAccess
function hasAccess(address user) public view returns (bool) {
  return timedAccessExpiry[user] >= block.timestamp;
}
```

NFT holder A が `grantTimedAccess(B, ttl)` を呼んで B に access 付与 → A が NFT を C に `transferFrom` → 「転送で revoke」前提が崩れ、 B は TTL まで access を持ち続ける。

### 正しい書き方 (contract + test 両方)

```sol
// ✅ grantor balance 再検証
function hasAccess(address user) public view returns (bool) {
  if (gate.balanceOf(user) > 0) return true;
  if (timedAccessExpiry[user] < block.timestamp) return false;
  address grantor = timedAccessGrantor[user];
  if (grantor == address(0)) return false;
  return gate.balanceOf(grantor) > 0;  // ← grantor 現所有も検証
}
```

```ts
// ✅ test 側: grantTimedAccess → transferFrom → hasAccess=false 経路を assertion
await wallet.writeContract({
  address: gatedContent,
  functionName: 'grantTimedAccess',
  args: [grantee, 60n],
});
await wallet.writeContract({
  address: nft,
  functionName: 'transferFrom',
  args: [ownerA, ownerC, tokenId],
});
const granteeHasAccess = await pub.readContract({
  address: gatedContent,
  functionName: 'hasAccess',
  args: [grantee],
});
expect(granteeHasAccess).toBe(false);  // ← 転送で即時失効
```

## 4. time-warp の副作用残留

### 症状

`evm_increaseTime` で進めた時間が anvil process 内に残り、 後続 test が想定外の時間状態で始まる。 単独実行は通るが 4 round 連続で flaky 化。

### 対処

- 全 test を「時間進行前提」に書く (絶対時刻でなく相対時間)
- 個別 anvil 再起動 or `evm_snapshot` / `evm_revert`
- multi-round runner で 4 round 連続 PASS 確認

## 5. operator authentication の単一 path しか叩かない

### 症状

bridge / DAO / lending 等で operator 専用 path が複数 (例 `unlock` + `relayMint`) あるのに、 1 path しか非 operator 拒否 test を書いていない。

### 検出例

[PR #145](https://github.com/cardene777/kiwa/pull/145) (DaoExecutionTarget) — DAO は `executeProposal` で hardcoded admin guard があったが、 別 path の `setValue` で msg.sender == dao を見ていなかった (CRITICAL access control bug)。

### 正しい書き方

operator 専用 function 全てを列挙し、 各々で非 operator から `simulateContract` → `NotOperator()` revert を assertion する。

```ts
const protectedFunctions = ['unlock', 'relayMint', 'setValue'];
for (const fn of protectedFunctions) {
  await expectRevert(
    () => simulateAs(nonOperator, contract, fn, [...args]),
    'NotOperator',
  );
}
```

## 6. stale state の管理 (recovery / proposal / order)

### 症状

recovery request / proposal / market order が古いまま残り、 owner / state が変わっても古い request が finalize できてしまう。

### 検出例

[PR #145](https://github.com/cardene777/kiwa/pull/145) AA SmartAccount — owner が一度 recovery を完了した後も、 古い recovery request が finalize できる (stale recovery)。

### 対処

`ownerEpoch` / `proposalEpoch` 等の monotonic counter を request に埋め込み、 finalize 時に epoch mismatch なら revert する。

```sol
struct RecoveryRequest {
  address proposedOwner;
  uint256 ownerEpoch;
  // ...
}

function finalizeRecovery(uint256 requestId) external {
  RecoveryRequest storage req = _requests[requestId];
  if (req.ownerEpoch != ownerEpoch) revert RecoveryStale();
  // ...
  ownerEpoch++;
}
```

## 7. quorum / threshold の丸め誤り

### 症状

`(totalSupply * quorumBps) / 10_000` で丸め下げになり、 小 totalSupply で quorum = 0 になる (常に proposal が pass する状態)。

### 検出例

[PR #145](https://github.com/cardene777/kiwa/pull/145) SimpleDao — quorumBps=1 で totalSupply=3 だと quorum = 0 → 0 票でも執行可能 (CRITICAL ではないが governance 仕様破壊)。

### 対処

切り上げ算 `(numerator + 10_000 - 1) / 10_000`:

```sol
function quorumVotes() public view returns (uint256) {
  if (quorumBps == 0) return 0;
  uint256 numerator = voteToken.totalSupply() * quorumBps;
  return (numerator + 10_000 - 1) / 10_000;
}
```

## 8. minter 権限と初期保有者の分離忘れ

### 症状

ERC-20 / ERC-721 で `minter = initialHolder` を同一固定。 表示用初期保有者がそのまま無制限 mint 権限を持つ。

### 検出例

[PR #146](https://github.com/cardene777/kiwa/pull/146) SimpleToken — `minter = recipient` で固定、 test only でも教材として誤誘導。

### 対処

`constructor(string name, string symbol, uint256 initialSupply, address initialHolder, address minter)` で 2 引数に分離。

## 9. 0-address ガード忘れ

### 症状

`newOwner = address(0)` や `recipient = address(0)` を受け入れ、 token 焼失 / ownership 喪失。

### 検出例

[PR #145](https://github.com/cardene777/kiwa/pull/145) SmartAccount `proposeRecovery(newOwner)` で 0-address チェックなし。

### 対処

```sol
if (newOwner == address(0)) revert InvalidNewOwner();
```

## 偽陽性 self-check リスト

新規 test を書いたら最終に以下 5 問を自問:

1. 固定値 (nonce / id / address) で偽陽性化していないか?
2. UI 経由を必要とする test なのに直接 RPC を叩いていないか?
3. Access control test が全エントリポイントを叩いているか?
4. time-warp が次 test に副作用を残さないか?
5. happy path のみで失敗系 (revert) を assertion していないか?

該当 YES が 1 つ以上あれば書き直し。
