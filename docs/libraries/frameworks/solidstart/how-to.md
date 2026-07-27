# API route と server function を検証する

このページでは SolidStart の API route と server function を HTTP server なしで直接呼び、response、redirect、error を確認します。`@kiwa-lab/solidstart` は Vinxi の route matching や server function の serialization を起動しません。handler に渡す request と、handler が返す結果を unit test で固定するための helper です。

`@kiwa-lab/solidstart` と Vitest を導入していない場合は、先に [solidstart を始める](./quickstart) を完了してください。次の例は `tests/profile.solidstart.test.ts` に保存します。

## form を受け取って redirect する

form action は `request.formData()` を一度だけ読み、成功時は `redirectResponse()` を返します。次の test は POST body、locals、redirect を同時に確認します。

```ts
import { expect, it } from "vitest";
import {
  invokeApiRoute,
  invokeServerFunction,
  json,
  redirect,
  redirectResponse,
} from "@kiwa-lab/solidstart";

it("profile form を保存して設定画面へ redirect する", async () => {
  const result = await invokeApiRoute({
    handler: async ({ request, locals }) => {
      const form = await request.formData();
      if (!locals.userId) return redirectResponse("/login", 303);
      expect(form.get("displayName")).toBe("Kiwa user");
      return redirectResponse("/settings/profile", 303);
    },
    url: "http://localhost/settings/profile",
    formData: { displayName: "Kiwa user" },
    locals: { userId: "user-42" },
  });

  expect(result.response.status).toBe(303);
  expect(result.redirect).toEqual({ url: "/settings/profile", status: 303 });
});
```

`formData` または `jsonBody` を渡すと、method を指定しない限り helper は POST request を作ります。両方を渡した場合は form data が優先されます。3xx response に location header がない場合は `redirect.url` が空文字になるため、redirect を返す handler では常に location を設定してください。

## JSON API の入力エラーを response にする

API route の通常例外は `invokeApiRoute()` 自体を reject します。利用者が修正できる入力エラーは throw ではなく、JSON response と適切な status で返します。

```ts
it("JSON API が不足した email を 400 として返す", async () => {
  const result = await invokeApiRoute({
    handler: async ({ request }) => {
      const body = await request.json() as { email?: string };
      if (!body.email) return json({ error: "email is required" }, { status: 400 });
      return json({ email: body.email }, { status: 201 });
    },
    url: "http://localhost/api/invitations",
    jsonBody: {},
  });

  expect(result.response.status).toBe(400);
  await expect(result.response.json()).resolves.toEqual({ error: "email is required" });
});
```

`json()` は content type を未指定の場合に `application/json` にします。独自 media type を指定したときはその値を維持します。database error のような想定外の例外は、この helper の result に格納されないため、route の error boundary または test の `rejects` で別に確認してください。

## server function の redirect と例外を分ける

server function は redirect signal を throw して遷移を表します。`invokeServerFunction()` は redirect を `result.redirect` に、その他の例外を `result.error` に分けます。

```ts
it("session がない server function を login へ redirect する", async () => {
  const result = await invokeServerFunction({
    fn: (sessionId: string | null) => {
      if (!sessionId) throw redirect("/login", 307);
      return { saved: true };
    },
    args: [null],
    cookies: { session: "expired-session" },
  });

  expect(result.result).toBeUndefined();
  expect(result.error).toBeUndefined();
  expect(result.redirect).toMatchObject({ url: "/login", status: 307 });
  expect(result.env.requestCookies.get("session")).toBe("expired-session");
});
```

headers と cookies は inspection 用の `env` へ保存されるだけで、function の引数へ自動注入されません。必要な session や request context は明示的に `args` で渡してください。実 runtime の serialization、request context、route middleware との統合は SolidStart application の integration test で確認します。

## 実行して確認する

```bash
pnpm exec vitest run tests/profile.solidstart.test.ts
```

3 つの test が成功すると、form redirect、JSON error、server function redirect を確認できます。仕様から test を作る場合は、Quickstart の [companion skill](./quickstart#skill-で仕様から-test-を作る) で spec と test を生成し、このページの input と結果を期待値として追加してください。
