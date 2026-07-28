---
title: "@kiwa-lab/go-lib gin の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/go-lib</code> <code v-pre>gin</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeGinHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L30) <code v-pre>packages/go-lib/src/gin.ts</code>

gin.Context 相当を simulate。 JSON/String/Header/Param/Query の 5 primitive を capture し、 c.AbortWithStatus 相当の abort も expose。 gin の実 handler がそのまま渡せる signature。

```ts
export declare function invokeGinHandler(options: InvokeGinHandlerOptions): Promise<InvokeGinHandlerResult>;
```

### 型

#### <code v-pre>GinContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L3) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export interface GinContext {
    request: GoRequest;
    status: (code: number) => GinContext;
    JSON: (code: number, body: unknown) => void;
    String: (code: number, body: string) => void;
    Header: (key: string, value: string) => void;
    Param: (key: string) => string | undefined;
    Query: (key: string) => string | undefined;
    aborted: boolean;
    abort: () => void;
}
```

#### <code v-pre>GinHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L15) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export type GinHandler = (c: GinContext) => void | Promise<void>;
```

#### <code v-pre>InvokeGinHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L17) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export interface InvokeGinHandlerOptions {
    handler: GinHandler;
    req: GoRequest;
}
```

#### <code v-pre>InvokeGinHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/gin.ts#L22) <code v-pre>packages/go-lib/src/gin.ts</code>

```ts
export interface InvokeGinHandlerResult extends GoResponse {
    aborted: boolean;
}
```
