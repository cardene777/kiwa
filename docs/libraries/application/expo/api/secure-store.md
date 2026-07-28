---
title: "@kiwa-lab/expo secure-store の API 契約"
---

# <code v-pre>@kiwa-lab/expo</code> <code v-pre>secure-store</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>mockSecureStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L18) <code v-pre>packages/expo/src/secure-store.ts</code>

expo-secure-store (Keychain / Keystore backed) mock。 in-memory Map で key-value 保管、 async signature を維持して production code と同 API で叩ける。

```ts
export declare function mockSecureStore(options?: SecureStoreOptions): SecureStoreMock;
```

### 型

#### <code v-pre>SecureStoreMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L6) <code v-pre>packages/expo/src/secure-store.ts</code>

```ts
export interface SecureStoreMock {
    setItemAsync: (key: string, value: string) => Promise<void>;
    getItemAsync: (key: string) => Promise<string | null>;
    deleteItemAsync: (key: string) => Promise<void>;
    listKeys: () => string[];
    clear: () => void;
}
```

#### <code v-pre>SecureStoreOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/secure-store.ts#L1) <code v-pre>packages/expo/src/secure-store.ts</code>

```ts
export interface SecureStoreOptions {
    initial?: Record<string, string>;
    failOn?: (key: string) => boolean;
}
```
