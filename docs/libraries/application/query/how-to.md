# @kiwa-lab/query の使い方

ここでは profile を読み込み、更新が成功した場合だけ cache を無効化し、次の読み込みを新しい値へ進めます。さらに、購読解除後に state が届かないことと、失敗した optimistic update を元に戻すことも同じ file で確認します。これは画面の見た目を検証する test ではありません。画面へ値を渡す前の cache 契約を検証する test です。

## 更新の境界を固定する

次の内容を `tests/profile-update.query.test.ts` にそのまま保存してください。`mutate` は mutation が成功してから `invalidateKeys` を削除します。失敗時は例外を再送出し、読み込み済み entry は残します。購読は `loading`、`success`、`idle` を受け取りますが、`unsubscribe` の後には次の fetch の状態を受け取りません。

```ts
import { expect, it } from "vitest";
import {
  createOptimisticUpdate,
  createQueryClient,
  fetchQuery,
  mutate,
  subscribeToQuery,
} from "@kiwa-lab/query";

it("成功した更新だけを無効化し、購読を後始末する", async () => {
  const client = createQueryClient({ provider: "swr" });
  const states: string[] = [];
  const subscription = subscribeToQuery(client, ["profile", "u-1"], state => {
    states.push(state.status);
  });

  await fetchQuery(client, ["profile", "u-1"], async () => ({ name: "before" }));
  const updated = await mutate(
    client,
    async (name: string) => ({ name }),
    "after",
    { invalidateKeys: [["profile", "u-1"]] },
  );

  expect(updated).toEqual({
    result: { name: "after" },
    invalidated: ['["profile","u-1"]'],
  });
  expect(client.snapshot()).toEqual([]);
  expect(states).toEqual(["loading", "success", "idle"]);

  subscription.unsubscribe();
  await fetchQuery(client, ["profile", "u-1"], async () => ({ name: "after" }));
  expect(states).toEqual(["loading", "success", "idle"]);
});

it("失敗した更新は cache を残し optimistic な表示を戻す", async () => {
  const client = createQueryClient({ provider: "apollo" });
  await fetchQuery(client, ["profile", "u-1"], async () => ({ name: "before" }));

  await expect(
    mutate(
      client,
      async () => {
        throw new Error("profile update failed");
      },
      undefined,
      { invalidateKeys: [["profile", "u-1"]] },
    ),
  ).rejects.toThrow("profile update failed");

  expect(client.snapshot()).toMatchObject([
    {
      key: '["profile","u-1"]',
      status: "success",
      data: { name: "before" },
    },
  ]);

  const update = createOptimisticUpdate({ completed: false });
  update.applyOptimistic({ completed: true });
  expect(update.current()).toEqual({ completed: true });
  expect(update.isPending()).toBe(true);

  update.rollback();
  expect(update.current()).toEqual({ completed: false });
  expect(update.isPending()).toBe(false);
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/profile-update.query.test.ts
```

成功すると、一つ目の test は読み込み後の `loading` と `success`、更新後の `idle` を記録します。更新後の fetch は購読解除の後なので state 配列を変えません。二つ目の test は mutation の失敗を呼び出し元へ残したまま、既存の profile entry と表示前の optimistic state を保持します。

## 運用で判断すること

更新 API が server 側では成功したが response だけ失われた場合、harness は成功か失敗かを判定できません。再試行と idempotency は実際の API client と server の統合 test で設計してください。画面の loading 表示、unmount、provider 固有の retry は component test の対象です。ここでは、アプリケーションが選んだ key が成功時だけ無効化されることを固定します。

ページ送りを扱う場合は `createInfiniteQuery` で cursor の順序と `maxPages` を test できます。先に通常 query の key と invalidation を定め、その後で pagination の page 追加を別 test として扱うと、失敗したときの原因を切り分けやすくなります。公開 API と既定値は [リファレンス](./reference) を参照してください。
