---
title: "@kiwa-lab/rust-lib tower の API 契約"
---

# <code v-pre>@kiwa-lab/rust-lib</code> <code v-pre>tower</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureTowerMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L27) <code v-pre>packages/rust-lib/src/tower.ts</code>

tower-http middleware layer trace capture。 real tower の Service::call を chain させ、 entered / exited を record して middleware 実行順序を verify できる。

```ts
export declare function captureTowerMiddleware(options: CaptureTowerOptions): Promise<TowerTrace>;
```

### 型

#### <code v-pre>TowerMiddleware</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L15) <code v-pre>packages/rust-lib/src/tower.ts</code>

```ts
export type TowerMiddleware = (req: TowerRequest, next: (req: TowerRequest) => Promise<{
    status: number;
    body: unknown;
}>) => Promise<{
    status: number;
    body: unknown;
}>;
```

#### <code v-pre>TowerRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L1) <code v-pre>packages/rust-lib/src/tower.ts</code>

```ts
export interface TowerRequest {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: unknown;
}
```

#### <code v-pre>TowerTrace</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/rust-lib/src/tower.ts#L8) <code v-pre>packages/rust-lib/src/tower.ts</code>

```ts
export interface TowerTrace {
    entered: string[];
    exited: string[];
    request: TowerRequest;
    response?: {
        status: number;
        body: unknown;
    };
}
```
