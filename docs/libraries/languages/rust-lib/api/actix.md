---
title: "@kiwa-lab/rust-lib actix の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/rust-lib</code> <code v-pre>actix</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>invokeActixHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L25) <code v-pre>packages/rust-lib/src/actix.ts</code>

actix-web handler mock invoke。 real actix の `async fn handler(...) -&gt; impl Responder` を TypeScript 側で模倣、 extractor 群 (web::Path / web::Json / web::Data) を Record として保持。

```ts
export declare function invokeActixHandler<TReq = unknown>(options: InvokeActixOptions<TReq>): Promise<InvokeActixResult>;
```

### 型

#### <code v-pre>ActixHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L1) <code v-pre>packages/rust-lib/src/actix.ts</code>

```ts
export type ActixHandler<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;
```

#### <code v-pre>InvokeActixOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L3) <code v-pre>packages/rust-lib/src/actix.ts</code>

```ts
export interface InvokeActixOptions<TReq = unknown> {
    handler: ActixHandler<TReq, unknown>;
    method: string;
    path: string;
    body?: TReq;
    extractors?: Record<string, unknown>;
}
```

#### <code v-pre>InvokeActixResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/actix.ts#L11) <code v-pre>packages/rust-lib/src/actix.ts</code>

```ts
export interface InvokeActixResult {
    status: number;
    body: unknown;
    method: string;
    path: string;
    extractors: Record<string, unknown>;
    durationMs: number;
    reason?: string;
}
```
