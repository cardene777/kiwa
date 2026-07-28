---
title: "@kiwa-lab/dapp time の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/dapp</code> <code v-pre>time</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/time.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>increaseTime</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/time.ts#L12) <code v-pre>packages/dapp/src/time.ts</code>

```ts
export declare function increaseTime(client: PublicClient, seconds: number | bigint): Promise<void>;
```

#### <code v-pre>mineBlock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/time.ts#L20) <code v-pre>packages/dapp/src/time.ts</code>

```ts
export declare function mineBlock(client: PublicClient, count?: number): Promise<void>;
```

#### <code v-pre>setNextBlockTimestamp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/dapp/src/time.ts#L26) <code v-pre>packages/dapp/src/time.ts</code>

```ts
export declare function setNextBlockTimestamp(client: PublicClient, ts: number | bigint): Promise<void>;
```


