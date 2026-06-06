# Hardhat mapping (10 観点 → Hardhat helper)

SSOT (`docs/SKILL-DESIGN.ja.md` § Step 3) の 10 観点を Hardhat の helper / chai matchers / 規約に変換する完全マッピング。 `/kiwa-hardhat` Step 3 で本 file を Read する。

## 10 観点 × Hardhat helper 一覧

| # | Layer 1 観点 | Hardhat helper | 関数命名規約 | 主要 import |
|---|---|---|---|---|
| 1 | 正常系 | `it('...')` + chai `expect` | `it('TC-NNN {summary}')` | `chai` / `hardhat` |
| 2 | 異常系 | `revertedWithCustomError` / `revertedWith` | `it('TC-NNN reverts when ...')` | `@nomicfoundation/hardhat-chai-matchers` |
| 3 | 境界値 | `fast-check` property test | `it('TC-NNN fuzz boundary')` | `fast-check` |
| 4 | 状態遷移 | `loadFixture` + `describe.each(states)` | `describe('state transition')` | `network-helpers` |
| 5 | 権限 | `c.connect(signer)` で msg.sender 切替 | `it('TC-NNN only authorized')` | `ethers` |
| 6 | 入力バリデーション | `fast-check` + revert assertion | `it('TC-NNN rejects invalid')` | `fast-check` |
| 7 | 冪等性 | 2 回 call → 2 回目 expect revert | `it('TC-NNN rejects replay')` | `chai` |
| 8 | 並行処理 | `Promise.all([tx1, tx2])` race | `it('TC-NNN race condition')` | `ethers` |
| 9 | 性能 | `hardhat-gas-reporter` 設定 | `it('TC-NNN gas under {Budget}')` | `hardhat-gas-reporter` |
| 10 | セキュリティ | signature recovery / role assertion / reentrancy | `it('TC-NNN {security check}')` | `ethers` / `@nomicfoundation/hardhat-chai-matchers` |

## 観点別 Hardhat helper 詳細

### 観点 1: 正常系

```typescript
it('TC-001 mints NFT and increments balance', async () => {
  const { target, owner } = await loadFixture(deployFixture);
  const tx = await target.connect(owner).mint();
  await expect(tx).to.emit(target, 'Transfer').withArgs(ethers.ZeroAddress, owner.address, 1);
  expect(await target.balanceOf(owner.address)).to.equal(1n);
});
```

`loadFixture` で setup を cache (snapshot)、 各 it ごとに前提を復元。

### 観点 2: 異常系

```typescript
it('TC-NNN reverts with NotGated when non-NFT holder grants', async () => {
  const { target, nonHolder, grantee } = await loadFixture(deployFixture);
  await expect(target.connect(nonHolder).grantTimedAccess(grantee.address, 3600))
    .to.be.revertedWithCustomError(target, 'NotGated');
});
```

`revertedWithCustomError(contract, 'ErrorName')` は custom error 名で検証。 `revertedWith('reason')` は require/revert string 用。

### 観点 3: 境界値

```typescript
it('TC-NNN grantTimedAccess accepts ttl in valid range', async () => {
  const { target, holder, grantee } = await loadFixture(deployFixture);
  await target.connect(holder).mint();

  await fc.assert(
    fc.asyncProperty(
      fc.bigUintN(64).filter((ttl) => ttl > 0n && ttl < 365n * 24n * 60n * 60n),
      async (ttl) => {
        const { timestamp } = await ethers.provider.getBlock('latest');
        const expiresAt = await target.connect(holder).grantTimedAccess.staticCall(grantee.address, ttl);
        expect(expiresAt).to.equal(BigInt(timestamp) + ttl + 1n);
      }
    ),
    { numRuns: 50 }
  );
});
```

`fc.asyncProperty` で async test、 `staticCall` で revert なしの dry-run 値を取得。

### 観点 4: 状態遷移

```typescript
describe('観点 4: 状態遷移', () => {
  it('TC-NNN transfer revokes grantee access', async () => {
    const { target, gateNft, holder, grantee, otherUser } = await loadFixture(deployFixture);
    await gateNft.connect(holder).mint();
    await target.connect(holder).grantTimedAccess(grantee.address, 3600);
    expect(await target.hasAccess(grantee.address)).to.be.true;

    await gateNft.connect(holder).transferFrom(holder.address, otherUser.address, 1);
    expect(await target.hasAccess(grantee.address)).to.be.false;
  });
});
```

state 遷移は時系列で seed → action → assertion を順番に。

### 観点 5: 権限

```typescript
it('TC-NNN only NFT holder can grant', async () => {
  const { target, gateNft, holder, nonHolder, grantee } = await loadFixture(deployFixture);
  await gateNft.connect(holder).mint();

  // holder OK
  await expect(target.connect(holder).grantTimedAccess(grantee.address, 3600)).to.not.be.reverted;

  // nonHolder revert
  await expect(target.connect(nonHolder).grantTimedAccess(grantee.address, 3600))
    .to.be.revertedWithCustomError(target, 'NotGated');
});
```

`connect(signer)` で msg.sender 切替。 signer は `ethers.getSigners()` で取得。

### 観点 6: 入力バリデーション

```typescript
it('TC-NNN rejects zero ttl', async () => {
  const { target, holder } = await loadFixture(deployFixture);
  await target.connect(holder).mint();

  await fc.assert(
    fc.asyncProperty(fc.bigUintN(8).filter((x) => x === 0n), async () => {
      await expect(target.connect(holder).grantTimedAccess(holder.address, 0))
        .to.be.revertedWithCustomError(target, 'InvalidTtl');
    }),
    { numRuns: 5 }
  );
});
```

property test で「無効入力範囲」を 5-10 回試行 (zero / negative / overflow 等)。

### 観点 7: 冪等性

```typescript
it('TC-NNN nonce replay protection', async () => {
  const { target, owner, relayer } = await loadFixture(deployFixture);
  const sig = await signPermit(owner, /* nonce */ 0);

  await target.connect(relayer).relay(sig, 0);  // 1 回目 OK
  await expect(target.connect(relayer).relay(sig, 0))  // 2 回目 revert
    .to.be.revertedWithCustomError(target, 'NonceUsed');
});
```

### 観点 8: 並行処理

```typescript
it('TC-NNN concurrent mint race - only one succeeds', async () => {
  const { target, user1, user2 } = await loadFixture(deployFixture);

  const results = await Promise.allSettled([
    target.connect(user1).mintExclusive(1),  // tokenId 1
    target.connect(user2).mintExclusive(1),  // 同 tokenId 1 を競合
  ]);

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  expect(succeeded).to.equal(1);
});
```

`Promise.allSettled` で race condition の結果を観測。 `Promise.all` だと 1 件 reject で全体 reject になる。

### 観点 9: 性能

```typescript
it('TC-NNN getSecret gas under 50k', async () => {
  const { target, holder } = await loadFixture(deployFixture);
  await target.connect(holder).mint();
  const tx = await target.connect(holder).getSecret();
  const receipt = await tx.wait();
  expect(receipt!.gasUsed).to.be.lessThan(50_000n);
});
```

または `hardhat.config.ts` で `gasReporter: { enabled: true }` を設定し全 fn の gas を一括測定。

### 観点 10: セキュリティ

```typescript
it('TC-NNN permit accepts valid signature', async () => {
  const { target, owner, spender } = await loadFixture(deployFixture);
  const deadline = (await time.latest()) + 3600;
  const nonce = await target.nonces(owner.address);
  const sig = await signPermitTypedData(owner, target, spender.address, ethers.parseEther('100'), nonce, deadline);

  await target.permit(owner.address, spender.address, ethers.parseEther('100'), deadline, sig.v, sig.r, sig.s);
  expect(await target.allowance(owner.address, spender.address)).to.equal(ethers.parseEther('100'));
});

it('TC-NNN permit rejects forged signature', async () => {
  const { target, owner, spender, attacker } = await loadFixture(deployFixture);
  const deadline = (await time.latest()) + 3600;
  const sig = await signPermitTypedData(attacker, target, spender.address, ethers.parseEther('100'), 0n, deadline);

  await expect(
    target.permit(owner.address, spender.address, ethers.parseEther('100'), deadline, sig.v, sig.r, sig.s)
  ).to.be.revertedWith('ERC20Permit: invalid signature');
});
```

`signTypedData` (`ethers.Signer.signTypedData`) で EIP-712 signature 生成、 別 signer で sign した sig が reject されることを確認。

## hardhat-toolbox helper 早見

| helper | 用途 | import |
|---|---|---|
| `loadFixture(fn)` | snapshot ベースの fixture (各 it で fast revert) | `network-helpers` |
| `time.latest()` | block.timestamp 取得 | `network-helpers` |
| `time.increase(seconds)` | block.timestamp を進める | `network-helpers` |
| `time.increaseTo(timestamp)` | 特定 timestamp まで進める | `network-helpers` |
| `mine(blocks)` | block 数を進める | `network-helpers` |
| `setBalance(addr, wei)` | account balance を強制設定 | `network-helpers` |
| `impersonateAccount(addr)` | 任意 address を msg.sender に偽装 | `network-helpers` |
| `setStorageAt(addr, slot, value)` | storage slot 直接書き換え | `network-helpers` |
| `loadFixture` snapshot は `await network.provider.send('evm_snapshot')` の wrapper | snapshot ID 管理を skill 側で隠蔽 | (内部) |

## hardhat コマンド早見

| コマンド | 用途 |
|---|---|
| `npx hardhat compile` | contract 再コンパイル |
| `npx hardhat test` | 全 test 実行 |
| `npx hardhat test --grep "{TC-NNN}"` | test 名 pattern で実行 |
| `npx hardhat coverage` | solidity-coverage で line coverage 測定 |
| `npx hardhat node` | local Hardhat Network 起動 (forked mode 可) |
| `REPORT_GAS=true npx hardhat test` | hardhat-gas-reporter で gas 測定 |

## 関連

- SSOT: `docs/SKILL-DESIGN.ja.md` § Step 3 (10 観点)
- Layer 1 spec: `.claude/skills/kiwa-design/SKILL.md`
- fast-check 詳細: `references/fast-check-patterns.md`
- Foundry 並立 skill: `.claude/skills/kiwa-forge/SKILL.md`
