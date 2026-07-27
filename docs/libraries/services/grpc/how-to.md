# @kiwa-lab/grpc 使い方

この library は gRPC transport を起動せず、application が提供する RPC handler の契約を確認します。unary は一つの request と response、server stream は有限の response sequence、client stream は request sequence の集約、bidi は request と response の対応を扱います。HTTP2、TLS、protobuf serialization、socket の backpressure を確認するものではありません。

次の file を `tests/user-service.grpc.test.ts` として保存してください。一つの service definition に四つの method type を登録し、metadata、未登録 method、認証と deadline を含めて確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  STATUS_CODES,
  composeInterceptors,
  createDeadlineContext,
  createGrpcServer,
  createMetadata,
  defineService,
  invokeBidi,
  invokeClientStream,
  invokeServerStream,
  invokeUnary,
  isDeadlineExceeded,
  type GrpcMetadata,
  type Interceptor,
} from "@kiwa-lab/grpc";

const server = createGrpcServer({ provider: "grpc-js" });
server.addService(
  defineService("UserService", [
    {
      name: "GetUser",
      type: "unary",
      handler: async ({ id }: { id: string }, metadata: GrpcMetadata) => ({
        id,
        tenant: metadata?.find((entry) => entry.key === "x-tenant")?.value,
      }),
    },
    {
      name: "ListEvents",
      type: "server-stream",
      handler: async function* ({ accountId }: { accountId: string }) {
        yield { id: "event-1", accountId };
        yield { id: "event-2", accountId };
      },
    },
    {
      name: "Sum",
      type: "client-stream",
      handler: async (requests: AsyncIterable<{ value: number }>) => {
        let total = 0;
        for await (const request of requests) total += request.value;
        return { total };
      },
    },
    {
      name: "Echo",
      type: "bidi",
      handler: async function* (requests: AsyncIterable<{ message: string }>) {
        for await (const request of requests) yield { echo: request.message };
      },
    },
  ]),
);

describe("UserService", () => {
  it("returns unary data with normalized metadata", async () => {
    const result = await invokeUnary(
      server,
      "UserService",
      "GetUser",
      { id: "user-42" },
      createMetadata({ "X-Tenant": "acme" }),
    );

    expect(result).toMatchObject({
      ok: true,
      response: { id: "user-42", tenant: "acme" },
      status: { code: STATUS_CODES.OK },
    });
  });

  it("collects finite server and client streams in order", async () => {
    const events = await invokeServerStream(
      server,
      "UserService",
      "ListEvents",
      { accountId: "account-1" },
    );
    const total = await invokeClientStream(
      server,
      "UserService",
      "Sum",
      [{ value: 2 }, { value: 3 }],
    );

    expect(events.responses).toEqual([
      { id: "event-1", accountId: "account-1" },
      { id: "event-2", accountId: "account-1" },
    ]);
    expect(total).toMatchObject({ ok: true, response: { total: 5 } });
  });

  it("keeps bidi response order and exposes an unregistered method", async () => {
    const echo = await invokeBidi(
      server,
      "UserService",
      "Echo",
      [{ message: "first" }, { message: "second" }],
    );
    const missing = await invokeUnary(server, "UserService", "Missing", {});

    expect(echo.responses).toEqual([{ echo: "first" }, { echo: "second" }]);
    expect(missing).toMatchObject({ ok: false, status: { code: STATUS_CODES.UNIMPLEMENTED } });
    expect(missing.response).toBeUndefined();
  });

  it("stops an unauthenticated or expired request before its handler", async () => {
    let now = 0;
    const deadline = createDeadlineContext(50, () => now);
    const guard: Interceptor = async (context, next) => {
      if (!context.metadata.find((entry) => entry.key === "authorization")) {
        return { status: { code: STATUS_CODES.UNAUTHENTICATED, message: "missing authorization" } };
      }
      if (isDeadlineExceeded(deadline)) {
        return { status: { code: STATUS_CODES.DEADLINE_EXCEEDED, message: "deadline exceeded" } };
      }
      return next();
    };
    const invoke = composeInterceptors([guard]);

    const unauthenticated = await invoke(
      { service: "UserService", method: "GetUser", metadata: [], request: {} },
      async () => ({ response: { id: "user-42" }, status: { code: STATUS_CODES.OK, message: "" } }),
    );
    now = 100;
    const expired = await invoke(
      {
        service: "UserService",
        method: "GetUser",
        metadata: createMetadata({ authorization: "Bearer local-test" }),
        request: {},
      },
      async () => ({ response: { id: "user-42" }, status: { code: STATUS_CODES.OK, message: "" } }),
    );

    expect(unauthenticated.status.code).toBe(STATUS_CODES.UNAUTHENTICATED);
    expect(expired.status.code).toBe(STATUS_CODES.DEADLINE_EXCEEDED);
  });
});
```

```bash
pnpm exec vitest run tests/user-service.grpc.test.ts
```

metadata key は `createMetadata` に渡した時点で小文字になります。handler の第二引数は provider SDK の metadata object ではなく `{ key, value }` の配列です。未登録 method または method type の不一致は throw されず、`ok: false` と `UNIMPLEMENTED` を返します。handler 内の exception は status code 2 の result になるため、application の error policy を result の status で assertion してください。

deadline context は時刻を計算するだけで、実行中の handler と transport を停止しません。長時間処理を中止する場合は `createCancelToken()` を作り、job や database query に明示的に伝えます。server stream は helper が終了まで収集するので、この library では有限 sequence を扱ってください。

実 gRPC client、protobuf と version の互換性、HTTP2 listener、TLS、deadline propagation、network 中断は実 server を起動する integration test で確認します。ここでは application handler が何を受け取り、どの status と response を返すかを固定します。
