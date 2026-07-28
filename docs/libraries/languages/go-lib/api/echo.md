---
title: "@kiwa-lab/go-lib echo の API 契約"
---

# <code v-pre>@kiwa-lab/go-lib</code> <code v-pre>echo</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeEchoHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L28) <code v-pre>packages/go-lib/src/echo.ts</code>

echo.Context 相当を simulate。 JSON/String/NoContent/Response/Param/QueryParam を capture、 echo 慣例通り Error return を尊重 (nil = 成功 / err = handler error) して結果に含める。

```ts
export declare function invokeEchoHandler(options: InvokeEchoHandlerOptions): Promise<InvokeEchoHandlerResult>;
```

### 型

#### <code v-pre>EchoContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L3) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export interface EchoContext {
    request: GoRequest;
    JSON: (code: number, body: unknown) => Error | null;
    String: (code: number, body: string) => Error | null;
    NoContent: (code: number) => Error | null;
    Response: () => {
        status: number;
        header: Record<string, string>;
    };
    Param: (key: string) => string;
    QueryParam: (key: string) => string;
}
```

#### <code v-pre>EchoHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L13) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export type EchoHandler = (c: EchoContext) => Error | null | Promise<Error | null>;
```

#### <code v-pre>InvokeEchoHandlerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L15) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export interface InvokeEchoHandlerOptions {
    handler: EchoHandler;
    req: GoRequest;
}
```

#### <code v-pre>InvokeEchoHandlerResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/go-lib/src/echo.ts#L20) <code v-pre>packages/go-lib/src/echo.ts</code>

```ts
export interface InvokeEchoHandlerResult extends GoResponse {
    handlerError?: string;
}
```
