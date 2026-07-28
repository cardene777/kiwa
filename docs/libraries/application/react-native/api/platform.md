---
title: "@kiwa-lab/react-native platform の API 契約"
---

# <code v-pre>@kiwa-lab/react-native</code> <code v-pre>platform</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/platform.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>setPlatform</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/platform.ts#L14) <code v-pre>packages/react-native/src/platform.ts</code>

Platform.OS / Platform.Version 値差替。 iOS / Android / web / windows / macos の 5 OS を 切替可能、 test 内で platform-dependent path の分岐を verify する経路。

```ts
export declare function setPlatform(state: PlatformState, next: {
    os?: RNPlatformOS;
    version?: number | string;
    isPad?: boolean;
    isTV?: boolean;
}): PlatformState;
```

### 型

#### <code v-pre>PlatformState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/platform.ts#L3) <code v-pre>packages/react-native/src/platform.ts</code>

```ts
export interface PlatformState {
    os: RNPlatformOS;
    version: number | string;
    isPad?: boolean;
    isTV?: boolean;
}
```
