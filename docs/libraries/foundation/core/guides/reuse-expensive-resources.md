# 高コストなテスト資源を再利用する

このガイドでは `createPool()` を使い、同時に二つまで利用できる資源をテスト間で再利用します。資源は何でも構いません。以下では `reset()` と `stop()` を持つ独自のワーカーを例にします。

## プールを作る

`size` は正の整数でなければなりません。`acquire()` はプールの作成時に `size` 回呼ばれます。

```ts
import { createPool } from "@kiwa-lab/core";

type Worker = {
  run: (job: string) => Promise<void>;
  reset: () => Promise<void>;
  stop: () => Promise<void>;
};

declare function startWorker(): Promise<Worker>;

const pool = await createPool<Worker>({
  size: 2,
  acquire: () => startWorker(),
  reset: (worker) => worker.reset(),
  release: (worker) => worker.stop(),
});
```

## リースを必ず返す

`borrow()` は `value` と `release()` を返します。空きがなければ、いずれかのリースが返却されるまで待ちます。`release()` は `reset()` を呼んでからスロットを次の待機者へ渡すため、`finally` で必ず実行してください。

```ts
const lease = await pool.borrow();

try {
  await lease.value.run("rebuild-search-index");
} finally {
  await lease.release();
}
```

## テストスイートの終了時に停止する

`stopAll()` は各スロットに対して、指定されていれば `release()` を呼びます。テストランナーの suite 終了フックで一度だけ実行します。

```ts
afterAll(async () => {
  await pool.stopAll();
});
```

## 設計上の注意

- `reset` が不要な資源では省略できます。その場合、返却時は空きスロットに戻るだけです。
- `release` が不要な資源では省略できます。その場合でも `stopAll()` はプールのスロットを消去しますが、資源に停止処理は実行しません。
- `stopAll()` の後に再利用することは想定しないでください。以後の `borrow()` を呼ばず、スイートの終了処理として使います。

Anvil のプールが必要なら、汎用 `createPool()` ではなく `@kiwa-lab/dapp` の `createAnvilPool()` を使えます。返却時に `anvil_reset` を実行します。

根拠となる実装: [`packages/core/src/pool.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/src/pool.ts)。
