---
title: "@kiwa-lab/dapp impersonate の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>impersonate</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/impersonate.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>impersonateAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/impersonate.ts#L12) <code v-pre>packages/dapp/src/impersonate.ts</code>

```ts
export declare function impersonateAccount(client: PublicClient, address: Address): Promise<void>;
```

#### <code v-pre>setBalance</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/impersonate.ts#L23) <code v-pre>packages/dapp/src/impersonate.ts</code>

```ts
export declare function setBalance(client: PublicClient, address: Address, wei: bigint): Promise<void>;
```

#### <code v-pre>stopImpersonateAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/impersonate.ts#L16) <code v-pre>packages/dapp/src/impersonate.ts</code>

```ts
export declare function stopImpersonateAccount(client: PublicClient, address: Address): Promise<void>;
```


