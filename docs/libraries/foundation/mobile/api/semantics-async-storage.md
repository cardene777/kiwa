---
title: "@kiwa-lab/mobile semantics-async-storage の API 契約"
---

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>semantics-async-storage</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>flushAsyncStorageBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L79) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function flushAsyncStorageBatch(session: AsyncStorageSession): AxisStep<AsyncStorageState>;
```

#### <code v-pre>initAsyncStorage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L36) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function initAsyncStorage(input: {
    target: MobileTarget;
    storeId: string;
}): AsyncStorageSession;
```

#### <code v-pre>readAsyncStorageItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L59) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function readAsyncStorageItem(session: AsyncStorageSession, key: string): AxisStep<AsyncStorageState>;
```

#### <code v-pre>removeAsyncStorageItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L69) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function removeAsyncStorageItem(session: AsyncStorageSession, key: string): AxisStep<AsyncStorageState>;
```

#### <code v-pre>setAsyncStorageItem</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L48) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export declare function setAsyncStorageItem(session: AsyncStorageSession, input: {
    key: string;
    value: string;
}): AxisStep<AsyncStorageState>;
```

### 型

#### <code v-pre>AsyncStorageSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L8) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

```ts
export interface AsyncStorageSession {
    target: MobileTarget;
    storeId: string;
    state: AsyncStorageState;
    items: Map<string, string>;
    operations: number;
    history: AxisStep<AsyncStorageState>[];
}
```

#### <code v-pre>AsyncStorageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/semantics/async-storage.ts#L6) <code v-pre>packages/mobile/src/semantics/async-storage.ts</code>

v1.51 async-storage axis — AsyncStorage / MMKV / web localStorage。

```ts
export type AsyncStorageState = 'idle' | 'set' | 'read' | 'removed' | 'batch-flushed';
```
