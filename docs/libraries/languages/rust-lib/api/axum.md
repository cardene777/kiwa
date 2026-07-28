---
title: "@kiwa-lab/rust-lib axum の API 契約"
---

# <code v-pre>@kiwa-lab/rust-lib</code> <code v-pre>axum</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeAxumHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L25) <code v-pre>packages/rust-lib/src/axum.ts</code>

axum handler mock invoke。 real axum の `async fn handler(...) -&gt; impl IntoResponse` を TypeScript 側で模倣、 body / headers / method / path を snapshot して結果を wrap。

```ts
export declare function invokeAxumHandler<TReq = unknown>(options: InvokeAxumOptions<TReq>): Promise<InvokeAxumResult>;
```

### 型

#### <code v-pre>AxumHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L1) <code v-pre>packages/rust-lib/src/axum.ts</code>

```ts
export type AxumHandler<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;
```

#### <code v-pre>InvokeAxumOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L3) <code v-pre>packages/rust-lib/src/axum.ts</code>

```ts
export interface InvokeAxumOptions<TReq = unknown> {
    handler: AxumHandler<TReq, unknown>;
    method: string;
    path: string;
    body?: TReq;
    headers?: Record<string, string>;
}
```

#### <code v-pre>InvokeAxumResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/axum.ts#L11) <code v-pre>packages/rust-lib/src/axum.ts</code>

```ts
export interface InvokeAxumResult {
    status: number;
    body: unknown;
    method: string;
    path: string;
    headers: Record<string, string>;
    durationMs: number;
    reason?: string;
}
```
