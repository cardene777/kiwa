# router の認可と mutation を検証する

この page では、`@kiwa-lab/trpc` で router を組み、認可 middleware を通した query、重複を防ぐ mutation、独立した batch、再試行を一つの test file で確認します。この library は HTTP transport や tRPC の type inference を置き換えるものではありません。procedure、context、middleware の境界を in-process で実行し、アプリケーションが守るべき結果を固定するための library です。

## 一つの router contract を実行する

まだ導入していない場合は [はじめる](./quickstart) を完了してください。`tests/account-router.trpc.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  TRPCError,
  batchInvoke,
  createRouter,
  defineProcedure,
  invokeProcedure,
  middleware,
  withIdempotencyKey,
  withRetry,
} from "@kiwa-lab/trpc";

describe("account router", () => {
  it("lets an authorized user pass middleware and rejects an anonymous user", async () => {
    const requireUser = middleware(async ({ ctx, next }) => {
      if (!ctx.userId) {
        return { ok: false, error: new TRPCError({ code: "UNAUTHORIZED" }) };
      }
      return next({ ctx: { ...ctx, role: "member" } });
    });
    const router = createRouter({
      procedures: {
        "account.me": defineProcedure(
          "query",
          async ({ ctx }) => ({ id: ctx.userId, role: ctx.role }),
          [requireUser],
        ),
      },
    });

    await expect(invokeProcedure(router, "account.me", undefined, {})).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      invokeProcedure(router, "account.me", undefined, { userId: "user-42" }),
    ).resolves.toEqual({ id: "user-42", role: "member" });
  });

  it("applies a mutation once for one idempotency key", async () => {
    let createdBookings = 0;
    const createBooking = withIdempotencyKey(async ({ input }) => {
      createdBookings += 1;
      const request = input as { idempotencyKey: string; roomId: string };
      return { bookingId: `booking-${createdBookings}`, roomId: request.roomId };
    });
    const router = createRouter({
      procedures: {
        "booking.create": defineProcedure("mutation", createBooking),
      },
    });
    const request = { idempotencyKey: "checkout-evt-100", roomId: "room-3" };

    const first = await invokeProcedure(router, "booking.create", request);
    const duplicate = await invokeProcedure(router, "booking.create", request);

    expect(first).toEqual({ bookingId: "booking-1", roomId: "room-3" });
    expect(duplicate).toEqual(first);
    expect(createdBookings).toBe(1);
  });

  it("keeps one batch failure separate from independent procedures", async () => {
    const router = createRouter({
      procedures: {
        "dashboard.profile": defineProcedure("query", async () => ({ name: "Kiwa" })),
        "dashboard.billing": defineProcedure("query", async () => {
          throw new TRPCError({ code: "FORBIDDEN", message: "billing role is required" });
        }),
        "dashboard.activity": defineProcedure("query", async () => ["signed in"]),
      },
    });

    const results = await batchInvoke(router, [
      { procedureName: "dashboard.profile", input: undefined },
      { procedureName: "dashboard.billing", input: undefined },
      { procedureName: "dashboard.activity", input: undefined },
    ]);

    expect(results).toEqual([
      { ok: true, output: { name: "Kiwa" } },
      { ok: false, error: { code: "FORBIDDEN", message: "billing role is required" } },
      { ok: true, output: ["signed in"] },
    ]);
  });

  it("retries a temporary inventory failure", async () => {
    let attempts = 0;
    const getInventory = withRetry(
      async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("inventory service unavailable");
        return { sku: "sku-1", available: true };
      },
      { maxAttempts: 3, backoffMs: 1 },
    );
    const router = createRouter({
      procedures: { "inventory.get": defineProcedure("query", getInventory) },
    });

    await expect(invokeProcedure(router, "inventory.get", undefined)).resolves.toEqual({
      sku: "sku-1",
      available: true,
    });
    expect(attempts).toBe(2);
  });
});
```

次の command は、作成した file だけを実行します。

```bash
pnpm exec vitest run tests/account-router.trpc.test.ts
```

middleware は `next({ ctx })` を通して後続 handler に context を渡します。認可失敗時に `next()` を呼ばなければ handler は実行されません。実際の session、JWT、cookie を `ProcedureContext` に変換する処理は transport adapter 側に置き、この middleware ではすでに検証済みの identity を扱ってください。

`withIdempotencyKey()` の cache は process 内だけです。複数 server instance、job queue、再起動をまたぐ mutation では、同じ key を database の unique constraint や共有 cache でも守ります。`batchInvoke()` は transaction ではないため、すべて成功する必要がある mutation を batch に含めず、domain service で transaction と compensating action を扱ってください。

`withRetry()` は default で全ての例外を再試行します。validation、認可、重複作成のような恒久エラーには `retryOn` を指定し、再試行対象から除外してください。`withTimeout()` は timeout 後に元の handler を abort しないため、外部 I/O の取消も必要なら AbortSignal を handler 自身へ渡します。実 client の request shape と subscription lifecycle は、使用する tRPC adapter の integration test で確認してください。
