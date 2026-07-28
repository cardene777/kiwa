---
title: "@kiwa-lab/dapp set-storage-slot の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>set-storage-slot</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setStorageSlot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L13) <code v-pre>packages/dapp/src/set-storage-slot.ts</code>

```ts
export declare function setStorageSlot(params: SetStorageSlotParams): Promise<void>;
```

### 型

#### <code v-pre>SetStorageSlotParams</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/set-storage-slot.ts#L3) <code v-pre>packages/dapp/src/set-storage-slot.ts</code>

```ts
export interface SetStorageSlotParams {
    rpcUrl: string;
    address: Address;
    slot: number | bigint | Hex;
    value: Hex;
}
```
