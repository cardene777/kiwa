---
title: "@kiwa-lab/expo env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/expo</code> <code v-pre>env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createExpoTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/env.ts#L30) <code v-pre>packages/expo/src/env.ts</code>

Expo runtime mock env。 Router / SecureStore / Notifications / FileSystem / Camera の 5 SDK mock を集約、 単一 env object 経由で全 SDK を叩ける。

```ts
export declare function createExpoTestEnv(options?: CreateExpoTestEnvOptions): ExpoTestEnv;
```

### 型

#### <code v-pre>CreateExpoTestEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/env.ts#L7) <code v-pre>packages/expo/src/env.ts</code>

```ts
export interface CreateExpoTestEnvOptions {
    router?: ExpoRouterOptions;
    secureStore?: SecureStoreOptions;
    fileSystem?: FileSystemOptions;
    camera?: CameraOptions;
    nowFn?: () => number;
}
```

#### <code v-pre>ExpoTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/env.ts#L15) <code v-pre>packages/expo/src/env.ts</code>

```ts
export interface ExpoTestEnv {
    router: ExpoRouterMock;
    secureStore: SecureStoreMock;
    fileSystem: FileSystemMock;
    camera: CameraMock;
    scheduled: ScheduledNotification[];
    nowFn: () => number;
    nextId: () => string;
    reset: () => void;
}
```
