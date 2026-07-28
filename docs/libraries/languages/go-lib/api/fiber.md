---
title: "@kiwa-lab/go-lib fiber の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/go-lib</code> <code v-pre>fiber</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeFiberHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L30) <code v-pre>packages/go-lib/src/fiber.ts</code>

fiber.Ctx 相当を simulate。 Status chain + JSON/SendString/SendStatus + Set/Params/Query/Body を fiber 慣例通り expose、 handler の Error return を結果に反映する。

```ts
export declare function invokeFiberHandler(options: InvokeFiberHandlerOptions): Promise<InvokeFiberHandlerResult>;
```

### 型

#### <code v-pre>FiberContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L3) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export interface FiberContext {
    request: GoRequest;
    Status: (code: number) => FiberContext;
    JSON: (body: unknown) => Error | null;
    SendString: (body: string) => Error | null;
    SendStatus: (code: number) => Error | null;
    Set: (key: string, value: string) => void;
    Params: (key: string) => string;
    Query: (key: string) => string;
    Body: () => unknown;
}
```

#### <code v-pre>FiberHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L15) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export type FiberHandler = (c: FiberContext) => Error | null | Promise<Error | null>;
```

#### <code v-pre>InvokeFiberHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L17) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export interface InvokeFiberHandlerOptions {
    handler: FiberHandler;
    req: GoRequest;
}
```

#### <code v-pre>InvokeFiberHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/fiber.ts#L22) <code v-pre>packages/go-lib/src/fiber.ts</code>

```ts
export interface InvokeFiberHandlerResult extends GoResponse {
    handlerError?: string;
}
```
