# handler error と retry を検証する

framework adapter は response の形を確認するためのものです。application が `Error` を返す場合、それを adapter がどう見せるかを先に固定すると、実 Go service の error middleware と network retry を別の責務として検証できます。

次の内容全体を `tests/go-lib-flows.test.ts` に保存します。Echo と Fiber の戻り値の扱い、retry が成功するまでの試行回数、失敗時の結果を同じ file で確認します。

```ts
import { expect, it } from "vitest";
import {
  invokeEchoHandler,
  invokeFiberHandler,
  retryWithBackoff,
} from "@kiwa-lab/go-lib";

it("captures an Echo returned error without rewriting its status", async () => {
  const result = await invokeEchoHandler({
    handler: () => new Error("validation failed"),
    req: { method: "POST", path: "/items" },
  });

  expect(result).toMatchObject({ status: 200, handlerError: "validation failed" });
});

it("keeps the Fiber response contract when the handler succeeds", async () => {
  const result = await invokeFiberHandler({
    handler: (context) => context.Status(202).SendStatus(202),
    req: { method: "POST", path: "/items" },
  });

  expect(result.status).toBe(202);
  expect(result).not.toHaveProperty("body");
});

it("reports the attempt that eventually succeeds", async () => {
  let attempts = 0;
  const result = await retryWithBackoff(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("temporary failure");
    return "ok";
  }, { maxAttempts: 5, initialDelayMs: 1 });

  expect(result).toMatchObject({ ok: true, attempts: 3, value: "ok" });
});

it("returns a failed retry result instead of throwing the last error", async () => {
  const result = await retryWithBackoff(
    async () => { throw new Error("still unavailable"); },
    { maxAttempts: 2, initialDelayMs: 1 },
  );

  expect(result).toMatchObject({ ok: false, attempts: 2 });
  expect(result.error).toBeInstanceOf(Error);
});
```

## adapter と実 runtime の境界を理解する

Echo と Fiber が返した `Error` は `handlerError` に記録されます。adapter が HTTP status を `500` に書き換えることはありません。status を error response に変える責務があるなら、アプリの handler または実 framework の error middleware で明示します。handler が throw した場合は adapter の promise が reject するため、戻り値の `handlerError` とは別に扱います。

`retryWithBackoff` は最後の失敗を throw せず、`ok`、`attempts`、`value`、`error` を返します。network request の cancel や Go context の propagation は行いません。request cancellation を検証する場合は `createCancelToken` の状態と、実 Go context の cancellation を別々に test してください。

`captureChiRoute` は既に `ChiApp` fixture を持つ code から呼べますが、その factory は公開 root export に含まれません。公開 package だけを使う新規 test では内部 module を import せず、route match、URL decode、middleware の短絡が必要なら実 chi application を Go test で起動します。

## 実行する

```bash
pnpm exec vitest run tests/go-lib-flows.test.ts
```
