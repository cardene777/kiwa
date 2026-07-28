---
title: "@kiwa-lab/rust-lib rocket の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/rust-lib</code> <code v-pre>rocket</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>invokeRocketRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L25) <code v-pre>packages/rust-lib/src/rocket.ts</code>

rocket route mock invoke。 real rocket の `#[get("/x")] fn route(...) -&gt; impl Responder` を TypeScript 側で模倣、 request guard 群を name 配列で保持して guard 通過を record。

```ts
export declare function invokeRocketRoute<TReq = unknown>(options: InvokeRocketOptions<TReq>): Promise<InvokeRocketResult>;
```

### 型

#### <code v-pre>InvokeRocketOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L3) <code v-pre>packages/rust-lib/src/rocket.ts</code>

```ts
export interface InvokeRocketOptions<TReq = unknown> {
    route: RocketRoute<TReq, unknown>;
    method: string;
    path: string;
    body?: TReq;
    guards?: string[];
}
```

#### <code v-pre>InvokeRocketResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L11) <code v-pre>packages/rust-lib/src/rocket.ts</code>

```ts
export interface InvokeRocketResult {
    status: number;
    body: unknown;
    method: string;
    path: string;
    guardsPassed: string[];
    durationMs: number;
    reason?: string;
}
```

#### <code v-pre>RocketRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/rocket.ts#L1) <code v-pre>packages/rust-lib/src/rocket.ts</code>

```ts
export type RocketRoute<TReq = unknown, TRes = unknown> = (req: TReq) => Promise<TRes> | TRes;
```
