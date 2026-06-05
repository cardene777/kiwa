# Foundry mapping (10 観点 → forge helper)

SSOT (`docs/SKILL-DESIGN.ja.md` § Step 3) の 10 観点を Foundry の helper / cheat code / 規約に変換する完全マッピング。 `/contract-test-foundry` Step 3 で本 file を Read する。

## 10 観点 × forge helper 一覧

| # | Layer 1 観点 | forge helper | 関数命名規約 | 主要 cheat code |
|---|---|---|---|---|
| 1 | 正常系 | 通常 `test_*` 関数 | `test_{Function}_HappyPath` | (なし、 通常 call) |
| 2 | 異常系 | `vm.expectRevert({Error}.selector)` | `test_{Function}_Reverts_When_{Condition}` | `vm.expectRevert` |
| 3 | 境界値 | `testFuzz_*` (fuzz test) | `testFuzz_{Function}_{Parameter}` | `vm.assume` |
| 4 | 状態遷移 | `invariant_*` (invariant test) | `invariant_{State}NeverReverts` | `targetContract` / `targetSelector` |
| 5 | 権限 | role 別 test + `vm.prank` | `test_{Function}_OnlyAuthorized` | `vm.prank` / `vm.startPrank` |
| 6 | 入力バリデーション | `testFuzz_*` + revert assertion | `testFuzz_{Function}_RejectsInvalidInput` | `vm.assume` + `vm.expectRevert` |
| 7 | 冪等性 | 2 回 call → 2 回目 revert | `test_{Function}_RejectsReplay` | `vm.expectRevert` |
| 8 | 並行処理 | tx ordering test (同期実行のため) | `test_{Function}_OrderingMatters` | `vm.warp` で block 境界制御 |
| 9 | 性能 | gas 測定 + assertion | `test_{Function}_GasUnder{Budget}` | `gasleft()` 比較 / `forge --gas-report` |
| 10 | セキュリティ | `invariant_*` + reentrancy + signature recovery | `invariant_NoReentrancy` / `test_{Function}_RejectsForgedSignature` | `vm.signature` / `attacker contract` deploy |

## 観点別 Foundry helper 詳細

### 観点 1: 正常系

```solidity
function test_Mint_HappyPath() public {
    vm.prank(owner);
    uint256 tokenId = target.mint();
    assertEq(target.ownerOf(tokenId), owner);
    assertEq(target.balanceOf(owner), 1);
}
```

assertion は forge-std の `assertEq` / `assertTrue` / `assertGt` 等を使う。 spec の「期待結果」を行ごとに assertion に対応させる。

### 観点 2: 異常系

```solidity
function test_GrantTimedAccess_Reverts_When_NotNftHolder() public {
    vm.prank(nonHolder);
    vm.expectRevert(GatedContent.NotGated.selector);
    target.grantTimedAccess(grantee, 3600);
}
```

custom error は `Contract.ErrorName.selector` で指定。 require/revert string の場合は `vm.expectRevert(bytes("error string"))`。

### 観点 3: 境界値

```solidity
function testFuzz_GrantTimedAccess_Boundary(uint256 ttl) public {
    vm.assume(ttl > 0 && ttl < 365 days);
    vm.prank(holder);
    uint256 expiresAt = target.grantTimedAccess(grantee, ttl);
    assertEq(expiresAt, block.timestamp + ttl);
}
```

`vm.assume` で fuzz 範囲を絞る。 `forge test --fuzz-runs 1000` で 1000 回実行 (default 256)。

### 観点 4: 状態遷移

```solidity
function setUp() public {
    target = new GatedContent(address(gateNft));
    // invariant test の target を指定
    targetContract(address(target));
    targetSelector(FuzzSelector({
        addr: address(target),
        selectors: _array(GatedContent.grantTimedAccess.selector, GatedContent.getSecret.selector)
    }));
}

function invariant_TimedAccessExpiryNonZeroAfterGrant() public {
    // 全 grantee の expiresAt は grant 後 > 0
    assertGt(target.timedAccessExpiry(grantee), 0);
}
```

invariant test は `targetContract` で対象を指定、 `forge test --invariant-runs 256 --invariant-depth 32` で実行。

### 観点 5: 権限

```solidity
function test_GrantTimedAccess_OnlyNftHolder() public {
    // holder OK
    vm.prank(holder);
    target.grantTimedAccess(grantee, 3600);

    // nonHolder revert
    vm.prank(nonHolder);
    vm.expectRevert(GatedContent.NotGated.selector);
    target.grantTimedAccess(grantee, 3600);
}
```

`vm.prank(addr)` は次の 1 call だけ msg.sender を変える。 連続呼び出しは `vm.startPrank` + `vm.stopPrank`。

### 観点 6: 入力バリデーション

```solidity
function testFuzz_GrantTimedAccess_RejectsZeroTtl(uint256 ttl) public {
    vm.assume(ttl == 0);
    vm.prank(holder);
    vm.expectRevert(GatedContent.InvalidTtl.selector);
    target.grantTimedAccess(grantee, ttl);
}
```

`vm.assume` で「無効入力」だけを fuzz 範囲に絞る。

### 観点 7: 冪等性

```solidity
function test_NonceReplayProtection() public {
    bytes memory sig = _signMessage(owner, nonce);
    vm.prank(relayer);
    target.relay(sig, nonce);  // 1 回目 success

    vm.prank(relayer);
    vm.expectRevert(NonceUsed.selector);
    target.relay(sig, nonce);  // 2 回目 revert
}
```

### 観点 8: 並行処理

Solidity は同期実行のため厳密な並行処理 test は不可、 代わりに block 境界を `vm.warp` で制御し ordering 影響を test:

```solidity
function test_GrantBeforeTransfer_AccessRevokedAfterTransfer() public {
    vm.prank(holder);
    target.grantTimedAccess(grantee, 1 hours);

    vm.prank(holder);
    gateNft.transferFrom(holder, otherUser, tokenId);

    // transfer 後の hasAccess は false (holder の balanceOf 0 で grant 連動失効)
    assertFalse(target.hasAccess(grantee));
}
```

### 観点 9: 性能

```solidity
function test_GetSecret_GasUnder50k() public {
    vm.prank(holder);
    uint256 gasBefore = gasleft();
    target.getSecret();
    uint256 gasUsed = gasBefore - gasleft();
    assertLt(gasUsed, 50_000);
}
```

または `forge test --gas-report` で全 function の gas を一括測定。

### 観点 10: セキュリティ

```solidity
function invariant_NoReentrancy() public {
    // attacker contract で再入を試みても state が不正にならない
    // (具体的には reentrancy guard / CEI pattern が壊れていない invariant)
    assertEq(target.accessCount(), accessCountSnapshot + grantedCount);
}

function test_PermitSignatureRecovery_RejectsForgedSig() public {
    // 別 privateKey で sign した signature が reject されることを確認
    bytes memory forgedSig = _signTypedData(attackerKey, ownerStruct);
    vm.expectRevert(GatedContent.InvalidSignature.selector);
    target.permitGrant(forgedSig);
}
```

## forge コマンド早見

| コマンド | 用途 |
|---|---|
| `forge build` | compile (deps fetch も含む) |
| `forge test` | 全 test 実行 |
| `forge test --match-contract {Name}` | 特定 contract の test だけ実行 |
| `forge test --match-test {pattern}` | test 名 pattern で実行 |
| `forge test --fuzz-runs 1000` | fuzz test の試行回数指定 (default 256) |
| `forge test --invariant-runs 256 --invariant-depth 32` | invariant test の試行 × 深さ |
| `forge test --gas-report` | gas 測定 report 出力 |
| `forge coverage --report summary` | line coverage 評価 |
| `forge coverage --report lcov` | LCOV 形式で出力 (Codecov 等と連携可) |

## 関連

- SSOT: `docs/SKILL-DESIGN.ja.md` § Step 3 (10 観点)
- Layer 1 spec: `.claude/skills/test-design/SKILL.md`
- fuzz / invariant 詳細: `references/fuzz-invariant-patterns.md`
- Hardhat 並立 skill: `.claude/skills/contract-test-hardhat/SKILL.md`
