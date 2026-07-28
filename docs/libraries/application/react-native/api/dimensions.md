---
title: "@kiwa-lab/react-native dimensions の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/react-native</code> <code v-pre>dimensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/dimensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setDimensions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/dimensions.ts#L10) <code v-pre>packages/react-native/src/dimensions.ts</code>

Dimensions.get('window') / .get('screen') 値差替。 iPhone / iPad / Android 各 form factor を切替、 responsive layout の test を書く経路。

```ts
export declare function setDimensions(state: DimensionsState, next: {
    window?: Partial<DimensionsState['window']>;
    screen?: Partial<DimensionsState['screen']>;
}): DimensionsState;
```

### 型

#### <code v-pre>DimensionsState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/dimensions.ts#L1) <code v-pre>packages/react-native/src/dimensions.ts</code>

```ts
export interface DimensionsState {
    window: {
        width: number;
        height: number;
        scale: number;
    };
    screen: {
        width: number;
        height: number;
        scale: number;
    };
}
```
