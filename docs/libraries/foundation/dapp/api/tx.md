---
title: "@kiwa-lab/dapp tx の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>tx</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/tx.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>sendTransaction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/tx.ts#L79) <code v-pre>packages/dapp/src/tx.ts</code>

```ts
export declare function sendTransaction(ctx: TxBroadcastCtx, params: SendTxParams): Promise<Hex>;
```


