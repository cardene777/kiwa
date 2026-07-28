---
title: "@kiwa-lab/dapp wait-for-wallet-connected の API 契約"
---

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>wait-for-wallet-connected</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-wallet-connected.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>waitForWalletConnected</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-wallet-connected.ts#L15) <code v-pre>packages/dapp/src/wait-for-wallet-connected.ts</code>

```ts
export declare function waitForWalletConnected(page: Page, options?: WaitForWalletConnectedOptions): Promise<void>;
```

### 型

#### <code v-pre>WaitForWalletConnectedOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/wait-for-wallet-connected.ts#L3) <code v-pre>packages/dapp/src/wait-for-wallet-connected.ts</code>

```ts
export interface WaitForWalletConnectedOptions {
    testId?: string;
    expectedText?: string;
    timeout?: number;
    pollInterval?: number;
}
```
