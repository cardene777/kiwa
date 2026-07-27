# astro を始める

このガイドでは endpoint と page function を server なしで検証します。どちらも Request と context を synthetic に作るため、アプリの route 設定、middleware、`.astro` compiler は別の integration test で確認します。

## 準備

```bash
pnpm add -D @kiwa-lab/astro vitest
```

## endpoint と page を test にする

次の内容を `tests/profile.astro.test.ts` にそのまま保存してください。`invokeEndpoint` は endpoint へ JSON body、route parameter、cookie context を渡します。`renderAstroPage` は page function が返す HTML を response と `html` に変換します。

```ts
import { expect, test } from "vitest";
import { invokeEndpoint, renderAstroPage } from "@kiwa-lab/astro";

test("profile endpoint と post page を server なしで確認する", async () => {
  const endpoint = await invokeEndpoint({
    endpoint: async ({ request, params, cookies }) => {
      const body = await request.json() as { name: string };
      cookies.set("seen", "true");
      return Response.json({ id: params.id, name: body.name }, { status: 201 });
    },
    url: "http://localhost/api/profile/42",
    params: { id: "42" },
    jsonBody: { name: "Ada" },
  });
  const page = await renderAstroPage({
    page: ({ params }) => `<h1>Post ${params.slug}</h1>`,
    url: "http://localhost/blog/first",
    params: { slug: "first" },
  });

  expect(endpoint.response.status).toBe(201);
  await expect(endpoint.response.json()).resolves.toEqual({ id: "42", name: "Ada" });
  expect(endpoint.redirect).toBeNull();
  expect(page.response.status).toBe(200);
  expect(page.html).toBe("<h1>Post first</h1>");
  expect(page.error).toBeUndefined();
});
```

保存後は、この file だけを実行します。

```bash
pnpm exec vitest run tests/profile.astro.test.ts
```

成功時には、JSON body を渡した endpoint は既定で POST になり、page が返した string は `text/html` の 200 response になります。cookie 操作は同じ context の中だけで見え、response の `Set-Cookie` を次の request へ自動では渡しません。

## 次に行うこと

redirect、not found、View Transition lifecycle は [使い方](./how-to) を参照してください。実 route 解決、middleware 接続、Islands hydration、browser transition は Astro build と E2E の対象です。

<!-- skill-guide -->
## skill で test を作る

companion skill は Astro の endpoint、page、View Transition の test 下書きを作ります。初回だけ plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-design --layer astro-endpoint --module health
/kiwa:kiwa-astro --module health --mode endpoint --output tests/health.astro.test.ts
```

生成後は endpoint の入力、route parameter、response、対象外の runtime 境界を実装と照合し、生成した file だけを実行します。

```bash
pnpm exec vitest run tests/health.astro.test.ts
```

mode と出力先は [kiwa-astro](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-astro/SKILL.md) を参照してください。
