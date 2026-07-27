# @kiwa-lab/query をはじめる

この Quickstart では、profile を一度取得し、同じ key の二回目の取得が cache を使うこと、時間の経過または明示的な再取得でだけ fetcher が呼ばれることを検証します。`@kiwa-lab/query` は React の hook や network を起動しません。画面や API client が採用する query key、stale 時間、再取得の判断を高速な test として固定する harness です。

## インストール

```bash
pnpm add -D @kiwa-lab/query vitest
```

## cache の判断を test にする

次の内容を `tests/profile.query.test.ts` にそのまま保存してください。可変の `now` を渡すため、実時間を待たず stale 境界を検証できます。`queryFn` は network client を呼ぶ関数に置き換える想定です。この例では呼び出し回数で、cache が利用されたかを明確にします。

```ts
import { expect, it } from "vitest";
import { createQueryClient, fetchQuery } from "@kiwa-lab/query";

it("profile は stale になるまで cache を使い、その後だけ再取得する", async () => {
  let now = 1_000;
  const client = createQueryClient({
    provider: "tanstack",
    defaultStaleMs: 60_000,
    now: () => now,
  });
  let calls = 0;
  const loadProfile = async () => ({
    id: "u-1",
    name: `Ada revision ${++calls}`,
  });

  const first = await fetchQuery(client, ["profile", "u-1"], loadProfile);
  const cached = await fetchQuery(client, ["profile", "u-1"], loadProfile);

  now += 60_000;
  const stale = await fetchQuery(client, ["profile", "u-1"], loadProfile);
  const refreshed = await fetchQuery(
    client,
    ["profile", "u-1"],
    loadProfile,
    { force: true },
  );

  expect(first).toMatchObject({
    data: { id: "u-1", name: "Ada revision 1" },
    fromCache: false,
    fetchCount: 1,
  });
  expect(cached).toMatchObject({
    data: { id: "u-1", name: "Ada revision 1" },
    fromCache: true,
    fetchCount: 1,
    staleAgeMs: 0,
  });
  expect(stale).toMatchObject({
    data: { id: "u-1", name: "Ada revision 2" },
    fromCache: false,
    fetchCount: 2,
  });
  expect(refreshed).toMatchObject({
    data: { id: "u-1", name: "Ada revision 3" },
    fromCache: false,
    fetchCount: 3,
  });
  expect(calls).toBe(3);
});
```

保存後に、この file だけを実行します。

```bash
pnpm exec vitest run tests/profile.query.test.ts
```

成功時には二回目だけが `fromCache: true` になります。ちょうど stale 時間に達した entry は stale として再取得されます。`force: true` は stale 判定を待たずに fetcher を呼びますが、古い entry を先に削除する操作ではありません。

二回目にも `calls` が増えるときは、読み込み側と更新側で key の配列が同じかを確認してください。`["profile", "u-1"]`、`["profile", 1]`、`"profile"` はそれぞれ別の entry です。アプリケーションの key 形式を定め、読む箇所、書き換える箇所、無効化する箇所で共有することが重要です。

## 次に行うこと

更新後の invalidation、listener の解除、optimistic update は [使い方](./how-to) で扱います。provider は `tanstack`、`swr`、`urql`、`apollo` から選べますが、この harness が比較するのは共通の cache 契約です。実際の hook、normalized cache、exchange chain の統合は各 provider の component または統合 test で確認してください。

<!-- skill-guide -->
## skill で test を作る

この library には `/kiwa:kiwa-query` という companion skill があります。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次に、この Quickstart の package 導入を済ませます。skill は実行時の cache を置き換えるものではなく、対象 module の cache hit、stale、invalidation を test の出発点として生成します。plugin の導入方法と更新方法は [kiwa の skill を使う](../../../guides/skills) にもまとめています。

```text
/kiwa:kiwa-query --module users --provider tanstack --output tests/integration/users.query.test.ts
```

生成後は `tests/integration/users.query.test.ts` を読み、key、stale 時間、成功時と失敗時の期待値が対象の仕様に合うように直してから、生成した file だけを実行します。

```bash
pnpm exec vitest run tests/integration/users.query.test.ts
```

provider や対象の種類を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-query/SKILL.md) を参照してください。
