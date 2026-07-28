---
title: "@kiwa-lab/dapp inject-multiple-wallets の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>inject-multiple-wallets</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>injectMultipleWallets</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L24) <code v-pre>packages/dapp/src/inject-multiple-wallets.ts</code>

```ts
export declare function injectMultipleWallets<TName extends string>(browser: Browser, entries: Record<TName, InjectMultipleWalletsEntry>, options?: InjectMultipleWalletsOptions): Promise<Record<TName, InjectMultipleWalletsResult>>;
```

### 型

#### <code v-pre>InjectMultipleWalletsEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L5) <code v-pre>packages/dapp/src/inject-multiple-wallets.ts</code>

```ts
export interface InjectMultipleWalletsEntry {
    privateKey: Hex;
    chainId?: number;
    wallets?: WalletConfig[];
}
```

#### <code v-pre>InjectMultipleWalletsOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L17) <code v-pre>packages/dapp/src/inject-multiple-wallets.ts</code>

```ts
export interface InjectMultipleWalletsOptions {
    defaultChainId?: number;
    baseUrl?: string;
}
```

#### <code v-pre>InjectMultipleWalletsResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/inject-multiple-wallets.ts#L11) <code v-pre>packages/dapp/src/inject-multiple-wallets.ts</code>

```ts
export interface InjectMultipleWalletsResult {
    context: BrowserContext;
    page: Page;
    close: () => Promise<void>;
}
```
