# @kiwa-lab/rust-lib の使い方

この package の adapter は Rust framework の実装を置き換えるものではありません。route の成功と例外、middleware が handler まで進んだか、アプリ側で一時失敗だけを retry するかを分けて test します。次の file は Rocket の失敗、Tower の短絡、retry を一緒に確認するため、コピーしてそのまま実行できます。

## middleware と失敗を確認する

`tests/rust-lib-flows.test.ts` に保存してください。

```ts
import { expect, it } from "vitest";
import {
  captureTowerMiddleware,
  invokeRocketRoute,
  withRetry,
} from "@kiwa-lab/rust-lib";

it("route の例外を response にして guard 名を記録する", async () => {
  const result = await invokeRocketRoute({
    route: async () => {
      throw new Error("validation failed");
    },
    method: "POST",
    path: "/create",
    guards: ["ApiKey", "RateLimit"],
  });

  expect(result).toMatchObject({
    status: 500,
    body: null,
    reason: "validation failed",
    guardsPassed: ["ApiKey", "RateLimit"],
  });
});

it("middleware が短絡したとき handler を実行しない", async () => {
  const trace = await captureTowerMiddleware({
    middleware: async () => ({ status: 401, body: "unauthorized" }),
    request: { method: "GET", path: "/private", headers: {} },
    handler: async () => ({ status: 200, body: "should not run" }),
  });

  expect(trace.entered).toEqual(["middleware-1"]);
  expect(trace.exited).toEqual(["middleware-1"]);
  expect(trace.response).toEqual({ status: 401, body: "unauthorized" });
});

it("一時失敗だけを retry して成功する", async () => {
  let calls = 0;
  const request = withRetry(async () => {
    calls += 1;
    if (calls < 3) {
      throw new Error("temporary failure");
    }
    return "ok";
  }, { maxAttempts: 5 });

  await expect(request()).resolves.toBe("ok");
  expect(calls).toBe(3);
});
```

実行します。

```bash
pnpm exec vitest run tests/rust-lib-flows.test.ts
```

Rocket の `guardsPassed` は guard を実行または認可した証拠ではなく、入力として渡した guard 名の記録です。同様に Tower の trace は harness の呼び出し順を示します。実 tower layer の type system、polling、backpressure は検証しません。実 request guard や middleware を確認するケースは、対象 crate の integration test を追加してください。

`withRetry` は `maxAttempts` まで wrapper を呼びます。最後の error と `retryOn` が拒否した error はそのまま throw されます。`withTimeout` を組み合わせる場合、timeout は待機側を reject しますが、元の非同期処理を cancel しません。副作用を持つ operation は idempotency を確認してから retry の対象にしてください。

## 実 runtime と分ける理由

この library は compiler を起動しないため、速い TypeScript test でアプリの契約を固定できます。その代わり、Rust の型、extractor、route parameter、body parse、HTTP serialization、実 network は分かりません。通常はここで input と期待する domain output を確認し、少数の Rust integration test で framework binding を確認する二段構えにします。どちらか一方をもう一方の代替と見なさないでください。
