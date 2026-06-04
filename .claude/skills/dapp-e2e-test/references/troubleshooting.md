# troubleshooting.md

dapp-e2e test 実行時の典型エラーと対処。

## A. webServer 起動失敗 — `Cannot find module .../packages/core/dist/tx.js`

原因 — `@dapp-e2e/core` の build が race condition で壊れた。 複数 example の `pnpm test` を並列実行すると、 各 example が `pnpm -F @dapp-e2e/core build` で `dist/` を rmSync するため race する。

対処 — 並列実行を諦めて sequential で 1 example ずつ走らせる:

```bash
for ex in <list>; do
  cd examples/$ex
  pnpm test
done
```

## B. anvil port 衝突 — `EADDRINUSE :8551`

原因 — 前回 test の anvil process が残ったまま。

対処 — `prepare-env.ts` が起動時に既存 anvil を kill する設計だが、 異常終了時は残ることがある。 cleanup:

```bash
lsof -ti :8551 | xargs kill -9
```

multi-round runner (`.context/scratch/multi-round-all-examples.sh`) は cleanup ロジックを内包しているのでそれを使うのが安全。

## C. webServer の `pnpm dev` vs `pnpm build && pnpm start` 選択

| mode | 起動時間 | 用途 |
|---|---|---|
| `pnpm dev` | 5-10s | 開発中、 fast iteration |
| `pnpm build && pnpm start` | 30-60s | production build path の動作確認 |

playwright `webServer.command` の選択。 開発中の test fix は dev、 CI 最終確認は build & start。

token-gating example では `pnpm dev` + `reuseExistingServer: true` で test 時間を短縮している。

## D. Next.js client bundle の `config.externals` parse error

原因 — `next.config.mjs` で `config.externals.push(...)` を unconditional に書くと client bundle で `pino-pretty` / `lokijs` 等が parse される。

対処 — `isServer` ガード内に移動:

```js
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
  }
  return config;
},
```

## E. time-warp 副作用で次 test が flaky

原因 — `evm_increaseTime` で進めた時間が anvil process 内に残り、 次 test が想定外の時間状態で始まる。

対処 (3 択):

1. test ごとに anvil を再起動 (`prepare-env.ts` を全 test で beforeAll で呼ぶ → 重い)
2. `evm_snapshot` / `evm_revert` で test 単位で snapshot
3. 全 test を「時間進行を前提に書く」 (時刻 X を基準にせず、 相対時間で書く)

dapp-e2e example では 3. を採用しているケースが多い (各 test の冒頭で `evm_increaseTime` で必要なだけ進めて assertion)。

## F. forge build の screaming-snake-case warning

警告 (error ではない) — immutable は `SCREAMING_SNAKE_CASE` で命名すべき:

```text
note[screaming-snake-case-immutable]: immutables should use SCREAMING_SNAKE_CASE
  --> contracts/SimpleDao.sol:46:30
46 |     uint256 public immutable timelockDelay;
```

dapp-e2e example では既存 contract が camelCase を多用しているため、 warning は無視 (forge build 自体は exit 0)。 新規 contract では `TIMELOCK_DELAY` のように SCREAMING_SNAKE_CASE 推奨。

## G. simulateContract で custom error が `BaseError` 経由で来る

viem の `simulateContract` は revert 時に `BaseError` を投げ、 中の `ContractFunctionRevertedError` に custom error 情報が入る。 直接 `error.message` を見ると internal 文字列が出るため、 `error.walk()` で chain を辿る:

```ts
function expectCustomError(error: unknown, errorName: string): void {
  if (!(error instanceof BaseError)) throw error;
  const reverted = error.walk((c) => c instanceof ContractFunctionRevertedError);
  if (!(reverted instanceof ContractFunctionRevertedError)) throw error;
  expect(reverted.data?.errorName).toBe(errorName);
}
```

## H. multi-chain test で chain id 不一致

原因 — `startAnvilCluster` で起動した 2 anvil のうち、 wallet client が片方の chain id しか知らない。

対処 — `resolveAnvilPort(ctx)` で chain id から port を引く構造で wallet mock を組む (PR #146 で `packages/core/src/rpc-handlers.ts` に導入済)。

## I. wallet inject script のタイミング

原因 — `page.addInitScript()` を `page.goto()` の前に呼ばないと inject されない。

対処 — fixture 内で必ず goto 前に inject:

```ts
test.beforeEach(async ({ page }) => {
  await page.addInitScript(createInjectorScript({ chainId: 31337 }));
});

test('...', async ({ page }) => {
  await page.goto('/'); // ← inject 済の状態で起動
});
```

dapp-e2e の標準 fixture (`dappE2eTest`) は自動で beforeEach 経路を持つため、 通常はユーザー側で意識不要。 カスタム fixture を書く場合は順序に注意。
