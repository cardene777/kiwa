# fast-check 実装パターン (Hardhat property test)

`fast-check` を Hardhat 環境で使う property test の実装パターン。 `/contract-test-hardhat` Step 4 で本 file を Read する。

## 基本パターン

### asyncProperty

```typescript
import fc from 'fast-check';

it('mint accepts any positive amount', async () => {
  const { target, owner } = await loadFixture(deployFixture);

  await fc.assert(
    fc.asyncProperty(
      fc.bigUintN(64).filter((x) => x > 0n && x <= MAX_MINT),
      async (amount) => {
        const tokenId = await target.connect(owner).mint.staticCall();
        expect(tokenId).to.be.greaterThan(0n);
      }
    ),
    { numRuns: 100 }
  );
});
```

`asyncProperty` で async test、 `numRuns: 100` で 100 回試行 (default 100)。

### arbitrary 早見

| arbitrary | 生成範囲 | 用途 |
|---|---|---|
| `fc.bigUintN(N)` | 0 〜 2^N - 1 (uint64 / uint128 等) | Solidity uint 入力 |
| `fc.bigInt({ min, max })` | min 〜 max | 範囲指定 BigInt |
| `fc.boolean()` | true / false | bool 入力 |
| `fc.string()` | 任意 string | string 入力 |
| `fc.constantFrom('a', 'b', 'c')` | 指定値のいずれか | enum 入力 |
| `fc.tuple(arb1, arb2)` | tuple `[v1, v2]` | 複数引数 |
| `fc.record({ key1: arb1, key2: arb2 })` | object | struct 入力 |
| `fc.array(arb, { minLength, maxLength })` | 配列 | dynamic array 入力 |
| `fc.hexaString({ minLength: 40, maxLength: 40 })` | hex string 20 byte | address 入力 |

### address 生成

```typescript
const addressArbitrary = fc.hexaString({ minLength: 40, maxLength: 40 })
  .map((hex) => ethers.getAddress(`0x${hex}`));

it('access control rejects all non-admin addresses', async () => {
  const { target, admin } = await loadFixture(deployFixture);

  await fc.assert(
    fc.asyncProperty(addressArbitrary, async (randomAddr) => {
      if (randomAddr === admin.address) return;  // admin は skip
      const signer = await ethers.getImpersonatedSigner(randomAddr);
      await expect(target.connect(signer).adminOnlyFn())
        .to.be.revertedWithCustomError(target, 'OnlyAdmin');
    }),
    { numRuns: 20 }
  );
});
```

## boundary value pattern

### bigInt boundary

```typescript
it('grantTimedAccess boundary check (1 〜 365 days)', async () => {
  const { target, holder, grantee } = await loadFixture(deployFixture);

  await fc.assert(
    fc.asyncProperty(
      fc.oneof(
        fc.constant(1n),                          // min
        fc.constant(365n * 24n * 60n * 60n),      // max
        fc.bigUintN(32).filter((x) => x >= 1n && x <= 365n * 24n * 60n * 60n)  // middle
      ),
      async (ttl) => {
        await gateNft.connect(holder).mint();
        const expiresAt = await target.connect(holder).grantTimedAccess.staticCall(grantee.address, ttl);
        const block = await ethers.provider.getBlock('latest');
        expect(expiresAt).to.equal(BigInt(block!.timestamp) + ttl + 1n);
      }
    ),
    { numRuns: 50 }
  );
});
```

`fc.oneof` で「min / max / middle range」を均等に生成、 boundary を確実にカバー。

### off-by-one boundary

```typescript
const offByOneArbitrary = fc.constantFrom(0n, 1n, MAX - 1n, MAX, MAX + 1n);

it('mint at maxSupply boundary', async () => {
  const { target, owner } = await loadFixture(deployFixture);
  // pre-fill to maxSupply - 1
  for (let i = 0; i < MAX_SUPPLY - 1; i++) await target.connect(owner).mint();

  // MAX_SUPPLY 番目は OK
  await expect(target.connect(owner).mint()).to.not.be.reverted;
  // MAX_SUPPLY + 1 番目は revert
  await expect(target.connect(owner).mint()).to.be.revertedWithCustomError(target, 'MaxSupplyExceeded');
});
```

## stateful property test

state が累積する operation sequence の property test:

```typescript
import { ModelRunSetup, asyncModelRun } from 'fast-check';

class TokenModel {
  totalSupply = 0n;
  balances = new Map<string, bigint>();
}

class MintCommand {
  constructor(readonly addr: string, readonly amount: bigint) {}
  check(m: TokenModel): boolean { return this.amount > 0n; }
  async run(m: TokenModel, real: TokenContract): Promise<void> {
    await real.mint(this.addr, this.amount);
    m.totalSupply += this.amount;
    m.balances.set(this.addr, (m.balances.get(this.addr) || 0n) + this.amount);
    expect(await real.balanceOf(this.addr)).to.equal(m.balances.get(this.addr));
  }
  toString(): string { return `mint(${this.addr}, ${this.amount})`; }
}

it('stateful invariant: totalSupply == sum(balances)', async () => {
  const { target } = await loadFixture(deployFixture);
  const accounts = await ethers.getSigners();

  const commands = [
    fc.tuple(fc.constantFrom(...accounts.map(a => a.address)), fc.bigUintN(32))
      .map(([addr, amt]) => new MintCommand(addr, amt))
    // burn, transfer command も同様に
  ];

  await fc.assert(
    fc.asyncProperty(fc.commands(commands, { maxCommands: 20 }), async (cmds) => {
      const setup: ModelRunSetup<TokenModel, TokenContract> = () => ({
        model: new TokenModel(),
        real: target,
      });
      await asyncModelRun(setup, cmds);
    }),
    { numRuns: 30 }
  );
});
```

`fc.commands` で operation sequence を生成、 `asyncModelRun` で model (期待 state) と real (contract state) を 1 step ずつ照合。 Foundry の invariant test 相当。

## shrinking 戦略

failure 発生時、 `fast-check` は「最小の failing input」に shrink (例: 10000 で fail → 1 で fail まで縮める)。 shrink 制御は以下:

```typescript
await fc.assert(prop, {
  numRuns: 100,
  seed: 42,         // 再現用 (failure 発生時に seed を report、 再現に使う)
  endOnFailure: false,  // failure 後も continue (デバッグ用)
  verbose: true,    // 詳細出力 (shrink 中の input を表示)
});
```

failure 報告例:

```text
Property failed after 23 tests
{ counterexample: [10n], shrunkPath: [10n→5n→2n→1n] }
Got: AssertionError: expected 1n to equal 2n
```

`shrunkPath` で「どこから縮めて 1n にたどり着いたか」を確認可能、 root cause 特定が容易。

## hardhat 環境固有の注意点

### `loadFixture` との組み合わせ

`fc.asyncProperty` の各試行で `loadFixture` を呼ぶと snapshot 復元が走り遅い。 1 試行 = 1 snapshot を許容するか、 fixture 外で test を組む:

```typescript
// 各 numRuns ごとに fixture revert (遅いが安全)
await fc.assert(
  fc.asyncProperty(arb, async (input) => {
    const { target } = await loadFixture(deployFixture);
    // ... test
  }),
  { numRuns: 50 }
);

// または 1 fixture を共有 (高速だが state 累積に注意)
const { target } = await loadFixture(deployFixture);
await fc.assert(
  fc.asyncProperty(arb, async (input) => {
    // ... test (state 累積を許容する property のみ)
  }),
  { numRuns: 100 }
);
```

### bigint overflow

Solidity の `uint256` 範囲 `0 〜 2^256 - 1` に対し、 fast-check の `fc.bigUintN(256)` は無制限 BigInt を生成。 overflow check が必要な test では `fc.bigUintN(255)` (上限を 1 bit 下げる) で安全範囲に制限。

```typescript
// safe: 2^255 - 1 が最大
fc.bigUintN(255)

// risky: 2^256 まで生成、 contract 側で overflow 起きる
fc.bigUintN(256)
```

## numRuns の指針

| 観点 | 推奨 numRuns | 理由 |
|---|---|---|
| 境界値 | 50-100 | min/max + middle range を均等 sample |
| 入力バリデーション | 50-100 | 無効範囲を確実にカバー |
| stateful invariant | 20-50 | 1 試行で multi step commands 実行、 時間がかかる |
| boundary off-by-one | 5-10 | 固定 5 点 (0 / 1 / max-1 / max / max+1) のみ |

総 test 時間 = numRuns × 1 試行時間。 contract test は 1 試行 100ms-500ms なので numRuns 100 で 10-50s。

## 関連

- SSOT: `docs/SKILL-DESIGN.ja.md` § Step 3 / Step 4
- 観点 → helper マッピング: `references/hardhat-mapping.md`
- example: `examples/example-token-gating.test.ts`
- Foundry 並立 (fuzz pattern): `.claude/skills/contract-test-foundry/references/fuzz-invariant-patterns.md`
