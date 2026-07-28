---
title: "@kiwa-lab/dapp snapshot の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>snapshot</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/snapshot.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>revertChain</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/snapshot.ts#L16) <code v-pre>packages/dapp/src/snapshot.ts</code>

```ts
export declare function revertChain(client: PublicClient, snapshotId: Hex): Promise<boolean>;
```

#### <code v-pre>snapshotChain</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/snapshot.ts#L12) <code v-pre>packages/dapp/src/snapshot.ts</code>

```ts
export declare function snapshotChain(client: PublicClient): Promise<Hex>;
```


