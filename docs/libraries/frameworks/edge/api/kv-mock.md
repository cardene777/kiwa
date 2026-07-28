---
title: "@kiwa-lab/edge kv-mock の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>kv-mock</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createKvNamespace</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L42) <code v-pre>packages/edge/src/kv-mock.ts</code>

```ts
export declare function createKvNamespace(initial?: Record<string, string>): KVNamespace;
```

### 型

#### <code v-pre>KVMockEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L37) <code v-pre>packages/edge/src/kv-mock.ts</code>

```ts
export interface KVMockEntry {
    readonly value: string;
    readonly metadata?: Record<string, unknown>;
}
```

#### <code v-pre>KVNamespace</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L27) <code v-pre>packages/edge/src/kv-mock.ts</code>

```ts
export interface KVNamespace {
    get(key: string): Promise<string | null>;
    get(key: string, type: 'text'): Promise<string | null>;
    get<T>(key: string, type: 'json'): Promise<T | null>;
    get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
    put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;
}
```

#### <code v-pre>KVNamespaceListOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L17) <code v-pre>packages/edge/src/kv-mock.ts</code>

```ts
export interface KVNamespaceListOptions {
    readonly prefix?: string;
    readonly limit?: number;
}
```

#### <code v-pre>KVNamespaceListResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L22) <code v-pre>packages/edge/src/kv-mock.ts</code>

```ts
export interface KVNamespaceListResult {
    readonly keys: ReadonlyArray<{
        readonly name: string;
        readonly metadata?: Record<string, unknown>;
    }>;
    readonly list_complete: true;
}
```

#### <code v-pre>KVNamespacePutOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L12) <code v-pre>packages/edge/src/kv-mock.ts</code>

```ts
export interface KVNamespacePutOptions {
    readonly expirationTtl?: number;
    readonly metadata?: Record<string, unknown>;
}
```
