---
title: "@kiwa-lab/dapp expect-event の API 契約"
---

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>expect-event</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/expect-event.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>expectEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/expect-event.ts#L4) <code v-pre>packages/dapp/src/expect-event.ts</code>

```ts
export declare function expectEvent<TAbi extends Abi>(receipt: TransactionReceipt, abi: TAbi, eventName: string, expectedArgs?: Record<string, unknown>): void;
```


