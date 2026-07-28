---
title: "@kiwa-lab/core types の API 契約"
---

# <code v-pre>@kiwa-lab/core</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>Lease</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts#L31) <code v-pre>packages/core/src/types.ts</code>

```ts
export interface Lease<T> {
    value: T;
    release: () => Promise<void>;
}
```

#### <code v-pre>Pool</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts#L36) <code v-pre>packages/core/src/types.ts</code>

```ts
export interface Pool<T> {
    size: number;
    borrow: () => Promise<Lease<T>>;
    stopAll: () => Promise<void>;
}
```

#### <code v-pre>SpecCase</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts#L10) <code v-pre>packages/core/src/types.ts</code>

```ts
export interface SpecCase {
    id: string;
    observation: string;
    given: string;
    when: string;
    then: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    automation: 'yes' | 'no' | 'manual';
    mode?: TestMode;
    route?: string;
    notes?: string;
}
```

#### <code v-pre>SpecDoc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts#L23) <code v-pre>packages/core/src/types.ts</code>

```ts
export interface SpecDoc {
    module: string;
    layer: TestLayer;
    cases: SpecCase[];
    raw: string;
    warnings: string[];
}
```

#### <code v-pre>TestEnvBase</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts#L5) <code v-pre>packages/core/src/types.ts</code>

```ts
export interface TestEnvBase<TMode extends TestMode = TestMode> {
    mode: TMode;
    stop: () => Promise<void>;
}
```

#### <code v-pre>TestLayer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts#L1) <code v-pre>packages/core/src/types.ts</code>

```ts
export type TestLayer = 'contract' | 'unit' | 'integration' | 'e2e' | 'api' | 'ui' | 'data' | 'cli';
```

#### <code v-pre>TestMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/core/src/types.ts#L3) <code v-pre>packages/core/src/types.ts</code>

```ts
export type TestMode = 'mock' | 'live' | 'hybrid';
```
