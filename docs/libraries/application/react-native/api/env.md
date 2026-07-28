---
title: "@kiwa-lab/react-native env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/react-native</code> <code v-pre>env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRNTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L31) <code v-pre>packages/react-native/src/env.ts</code>

RN test env bundle。 5 primitive (platform / dimensions / asyncStorage / navigation / linking) を 1 env に集約、 test setup で 1 呼出しすれば全 API mock が使える。

```ts
export declare function createRNTestEnv(options?: CreateRNTestEnvOptions): RNTestEnv;
```

### 型

#### <code v-pre>CreateRNTestEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L9) <code v-pre>packages/react-native/src/env.ts</code>

```ts
export interface CreateRNTestEnvOptions {
    platform?: RNPlatformOS;
    version?: number | string;
    initialRoute?: NavigationRoute;
    asyncStorageInitial?: AsyncStorageInitial;
    initialUrl?: string;
    window?: {
        width: number;
        height: number;
        scale?: number;
    };
    screen?: {
        width: number;
        height: number;
        scale?: number;
    };
}
```

#### <code v-pre>RNPlatformOS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L7) <code v-pre>packages/react-native/src/env.ts</code>

```ts
export type RNPlatformOS = 'ios' | 'android' | 'web' | 'windows' | 'macos';
```

#### <code v-pre>RNTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/react-native/src/env.ts#L19) <code v-pre>packages/react-native/src/env.ts</code>

```ts
export interface RNTestEnv {
    platform: PlatformState;
    dimensions: DimensionsState;
    asyncStorage: AsyncStorageMock;
    navigation: NavigationMock;
    linking: LinkingState;
}
```
