---
title: "@kiwa-lab/react-native linking の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/react-native</code> <code v-pre>linking</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>dispatchLinkingUrl</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L22) <code v-pre>packages/react-native/src/linking.ts</code>

Linking.addEventListener 相当 event 発火 mock。 deep link / universal link の simulation を in-process で行う。

```ts
export declare function dispatchLinkingUrl(state: LinkingState, url: string, timestamp?: number): LinkingEvent;
```

### 型

#### <code v-pre>LinkingEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L1) <code v-pre>packages/react-native/src/linking.ts</code>

```ts
export interface LinkingEvent {
    url: string;
    timestamp: number;
}
```

#### <code v-pre>LinkingListener</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/linking.ts#L6) <code v-pre>packages/react-native/src/linking.ts</code>

```ts
export type LinkingListener = (event: LinkingEvent) => void;
```
