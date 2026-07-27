# Pool を再利用する

pool は Anvil instance、test server、browser のように起動コストが高い resource を、test ごとに作り直さず安全に使うためのものです。借りる側は `Lease` を受け取り、利用後に必ず release します。release のたびに reset が走り、suite の最後に `stopAll()` が resource を閉じます。

次の file を `tests/worker-pool.test.ts` として保存してください。外部 process を起動せず、状態を持つ worker を使って reset、release、stopAll の責任を確認します。

```ts
import { afterAll, describe, expect, it } from "vitest";
import { createPool } from "@kiwa-lab/core";

type Worker = {
  id: number;
  state: string;
};

let nextId = 0;
const resetIds: number[] = [];
const closedIds: number[] = [];
const pool = await createPool<Worker>({
  size: 1,
  acquire: async () => ({ id: ++nextId, state: "clean" }),
  reset: async (worker) => {
    worker.state = "clean";
    resetIds.push(worker.id);
  },
  release: async (worker) => {
    closedIds.push(worker.id);
  },
});

describe("worker pool", () => {
  it("resets a released worker before the next borrower uses it", async () => {
    const first = await pool.borrow();

    try {
      first.value.state = "has-session";
    } finally {
      await first.release();
    }

    const second = await pool.borrow();
    try {
      expect(second.value.id).toBe(1);
      expect(second.value.state).toBe("clean");
      expect(resetIds).toEqual([1]);
    } finally {
      await second.release();
    }
  });
});

afterAll(async () => {
  await pool.stopAll();
  expect(closedIds).toEqual([1]);
});
```

```bash
pnpm exec vitest run tests/worker-pool.test.ts
```

`finally` に `lease.release()` を置かないと、空き slot を待つ次の borrower は進みません。resource の状態が次の test に残るなら `reset` が内部状態を初期値へ戻しているかを確認してください。`acquire` が失敗した場合は pool の作成自体が失敗します。部分的に作られる external resource を使うときは、その失敗経路でも cleanup できる設計にしてください。

`stopAll()` は pool 内のすべての resource に `release` を実行します。pool は test file または一つの `describe` に閉じ、別 suite と共有しないでください。
