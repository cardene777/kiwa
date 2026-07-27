# @kiwa-lab/nextjs はじめる

Server Action を直接呼び出し、redirect を通常の error と混同せずに確認します。実装では `next/navigation` の `redirect()` を使い、テストでは同じ分岐を redirect signal として渡します。

## インストール

```bash
pnpm add -D @kiwa-lab/nextjs vitest
```

## Server Action を呼ぶ

```ts
import { expect, it } from "vitest";
import { invokeServerAction, REDIRECT_SYMBOL } from "@kiwa-lab/nextjs";

type LoginDependencies = {
  redirect: (url: string) => never;
};

async function login(formData: FormData, dependencies: LoginDependencies) {
  const email = formData.get("email");
  if (!email) throw new Error("email required");
  return dependencies.redirect("/dashboard");
}

it("ログイン後に dashboard へ redirect する", async () => {
  const formData = new FormData();
  formData.set("email", "user@example.test");

  const { env, error } = await invokeServerAction({
    action: login,
    formData,
    args: [{
      redirect: (url: string): never => {
        throw { [REDIRECT_SYMBOL]: true, url, type: "replace" };
      },
    }],
  });

  expect(error).toBeUndefined();
  expect(env.redirect?.url).toBe("/dashboard");
});

it("空の email は validation error として返す", async () => {
  const { env, error } = await invokeServerAction({
    action: login,
    formData: new FormData(),
    args: [{
      redirect: (url: string): never => {
        throw { [REDIRECT_SYMBOL]: true, url, type: "replace" };
      },
    }],
  });

  expect(env.redirect).toBeNull();
  expect(error).toMatchObject({ message: "email required" });
});
```

`invokeServerAction` は action が返した値を `result`、redirect 以外の throw を `error`、kiwa の redirect signal を `env.redirect` に分けます。redirect を成功扱いにするため、`env.redirect` を必ず assertion します。helper は `next/navigation`、`next/headers`、`next/cache` を置き換えません。production action がそれらへ依存する場合は、上の `dependencies` のように注入可能な dependency として切り出し、`args` でこの test に渡します。

redirect と validation error は同じ action の別 test にします。一つの test で両方を確認すると、どの分岐が失敗したか分かりにくくなります。次は [使い方](./how-to) で middleware と RSC の signal を確認します。

## 実行する

```bash
pnpm exec vitest run tests/kiwa/nextjs.test.ts
```

<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。Quickstart の最小 test で API と期待結果を理解してから、初回だけ Claude Code で plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer nextjs-server-action --module update-profile
/kiwa:kiwa-nextjs --module update-profile
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合し、プロジェクトの runner で実行してください。

```bash
pnpm exec vitest run tests/integration/update-profile.nextjs.test.ts
```

この runner は生成先を変えた場合はその path に読み替えます。失敗した場合は、redirect を通常の Error として assertion していないか、実 runtime にしかない dependency を seam に分けられているかを先に確認してください。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-nextjs/SKILL.md) を参照してください。
