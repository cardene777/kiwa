---
title: "@kiwa-lab/mobile adapters__real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>adapters&#95;&#95;real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>assertMobileRealDriverAvailable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L51) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

```ts
export declare function assertMobileRealDriverAvailable(axis: MobileRealDriverAxis, env: MobileRealDriverEnv | null): void;
```

#### <code v-pre>readMobileRealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L39) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

```ts
export declare function readMobileRealDriverEnv(env?: NodeJS.ProcessEnv): MobileRealDriverEnv | null;
```

### 型

#### <code v-pre>MobileRealDriverAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L12) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

Mobile real driver env-gate (v0.2)。 v1.51 で real CLI (Expo EAS + Metro real bundle + React Navigation deep link verify + Reanimated JSI worklet + AsyncStorage / MMKV native + Keychain / Keystore native) 呼出を stub 経由で隠蔽する契約。 env `KIWA_MOBILE_MODE=real` + 対応 URL env が全揃った時のみ real 呼出。 それ以外は explicit throw で fail-closed。

```ts
export type MobileRealDriverAxis = 'expo-eas' | 'metro' | 'navigation' | 'reanimated' | 'async-storage' | 'secure-storage';
```

#### <code v-pre>MobileRealDriverEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/real-driver.ts#L20) <code v-pre>packages/mobile/src/adapters/real-driver.ts</code>

```ts
export interface MobileRealDriverEnv {
    mode: 'real';
    expoEasUrl?: string;
    metroUrl?: string;
    navigationUrl?: string;
    reanimatedUrl?: string;
    asyncStorageUrl?: string;
    secureStorageUrl?: string;
}
```
