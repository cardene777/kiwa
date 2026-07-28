---
title: "@kiwa-lab/react-native async-storage の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/react-native</code> <code v-pre>async-storage</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>mockAsyncStorage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L17) <code v-pre>packages/react-native/src/async-storage.ts</code>

```ts
export declare function mockAsyncStorage(initial?: AsyncStorageInitial): AsyncStorageMock;
```

### 型

#### <code v-pre>AsyncStorageInitial</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L1) <code v-pre>packages/react-native/src/async-storage.ts</code>

```ts
export type AsyncStorageInitial = Record<string, string>;
```

#### <code v-pre>AsyncStorageMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/async-storage.ts#L3) <code v-pre>packages/react-native/src/async-storage.ts</code>

```ts
export interface AsyncStorageMock {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
    clear: () => Promise<void>;
    getAllKeys: () => Promise<string[]>;
    multiGet: (keys: string[]) => Promise<Array<[string, string | null]>>;
    multiSet: (pairs: Array<[string, string]>) => Promise<void>;
}
```
