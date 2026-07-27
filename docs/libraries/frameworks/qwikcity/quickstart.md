# @kiwa-lab/qwikcity を始める

`@kiwa-lab/qwikcity` は route action の validation failure と cookie 更新を分けて検証する test adapter です。helper は action を直接呼ぶため、route manifest や Qwik optimizer は必要ありません。実 browser の form submit や Qwik resume を確認するものではありません。

## 追加する

```bash
pnpm add -D @kiwa-lab/qwikcity vitest
```

## route action を検証する

次の内容全体を `tests/signup.qwikcity.test.ts` に保存します。空の form が validation failure を返すことと、正しい email が memory cookie を更新することを別 test で確認します。

```ts
import { expect, test } from "vitest";
import { invokeRouteAction } from "@kiwa-lab/qwikcity";

test("returns a validation failure for an empty email", async () => {
  const result = await invokeRouteAction<{ email?: string }, { ok: boolean }>({
    action: ({ email }, event) => {
      if (typeof email !== "string" || email === "") {
        return event.fail(400, { field: "email", message: "required" });
      }
      event.cookie.set("last-email", email);
      return { ok: true };
    },
    formValues: {},
  });

  expect(result.result).toBeUndefined();
  expect(result.fail).toMatchObject({ status: 400, data: { field: "email" } });
  expect(result.redirect).toBeNull();
  expect(result.error).toBeUndefined();
});

test("returns success data and updates the invocation cookie", async () => {
  const result = await invokeRouteAction<{ email?: string }, { ok: boolean }>({
    action: ({ email }, event) => {
      event.cookie.set("last-email", String(email));
      return { ok: true };
    },
    formValues: { email: "sora@example.com" },
  });

  expect(result.result).toEqual({ ok: true });
  expect(result.fail).toBeNull();
  expect(result.env.cookies.get("last-email")).toBe("sora@example.com");
});
```

`event.fail` は action の戻り値として返します。`throw event.fail(...)` は validation result ではなく通常の例外として `result.error` に入ります。cookie は browser cookie jar ではなく、その呼び出しだけで使う Map です。初期値が必要な場合は `cookies` を options に渡します。

## 実行する

```bash
pnpm exec vitest run tests/signup.qwikcity.test.ts
```

redirect は `event.redirect` が signal を throw し、helper は `result.redirect` に捕捉します。成功 data と混同せず、status と location を redirect field から assertion してください。

<!-- skill-guide -->
## skill で仕様から test を作る

初回だけ plugin を導入してから skill を実行します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-design --layer qwikcity-action --module signup
/kiwa:kiwa-qwikcity --module signup
```

生成された file path を確認し、その file だけを実行します。たとえば skill が `tests/signup.qwikcity.test.ts` を出力した場合は次の command です。

```bash
pnpm exec vitest run tests/signup.qwikcity.test.ts
```
