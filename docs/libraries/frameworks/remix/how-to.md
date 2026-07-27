# Resource Route と nested loader を検証する

Remix では loader、action、Resource Route が異なる HTTP contract を持ちます。通常 data、`Response`、redirect、405 を一つの戻り値として扱わず、helper が返す専用 field を assertion します。

次の内容全体を `tests/remix-routes.test.ts` に保存します。POST form data、未対応 GET の 405、parent loader から child loader への data 継承を同じ file で扱います。

```ts
import { expect, test } from "vitest";
import {
  invokeResourceRoute,
  json,
  setupRemixNestedRouteEnv,
} from "@kiwa-lab/remix";

test("dispatches POST form data to a Resource Route action", async () => {
  const result = await invokeResourceRoute({
    route: {
      action: async ({ request }) => {
        const form = await request.formData();
        return json({ name: form.get("name") });
      },
    },
    url: "http://localhost/api/items",
    method: "POST",
    formData: { name: "kiwa" },
  });

  expect(result.dispatch).toBe("action");
  await expect(result.response?.json()).resolves.toEqual({ name: "kiwa" });
});

test("returns a framework 405 when GET has no loader", async () => {
  const result = await invokeResourceRoute({
    route: { action: () => new Response("post-only") },
    url: "http://localhost/api/items",
    method: "GET",
  });

  expect(result.dispatch).toBe("method-not-allowed");
  expect(result.response?.status).toBe(405);
  expect(result.methodNotAllowed?.allow).toEqual(["POST", "PUT", "PATCH", "DELETE"]);
});

test("passes parent loader data to a nested child loader", async () => {
  let parentData: unknown;
  const env = setupRemixNestedRouteEnv({
    parentRoute: {
      id: "routes/parent",
      loader: async () => ({ user: "alice", role: "admin" }),
    },
    childRoute: {
      id: "routes/parent.child",
      loader: async ({ context }) => {
        parentData = (context as { parentData?: unknown }).parentData;
        return { childOk: true };
      },
    },
    url: "http://localhost/parent/child",
  });

  const result = await env.runLoaderChain();
  expect(result.parent.result).toEqual({ user: "alice", role: "admin" });
  expect(result.child.result).toEqual({ childOk: true });
  expect(parentData).toEqual({ user: "alice", role: "admin" });
});
```

## HTTP contract の境界を理解する

`invokeResourceRoute` は GET と HEAD を loader へ、POST、PUT、PATCH、DELETE を action へ dispatch します。function がない method は route 自身の 4xx response ではなく framework-level 405 です。`dispatch` と `methodNotAllowed` を確認して、route が返した failure と混同しません。

parent loader の plain data または JSON response だけが child loader の `context.parentData` に渡ります。redirect、error、非 JSON response は data として渡しません。`defer` と `resolveDeferred` は promise の解決と rejection を追跡しますが、実 streaming response と React rendering を作るものではありません。

route manifest、browser transition、production server adapter、実 cookie session はこの adapter の範囲外です。route function の入力と response contract はここで検証し、画面遷移と deployment は Remix application を起動する integration test または E2E test で確認します。

## 実行する

```bash
pnpm exec vitest run tests/remix-routes.test.ts
```
