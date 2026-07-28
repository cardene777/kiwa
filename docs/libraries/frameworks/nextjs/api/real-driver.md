---
title: "@kiwa-lab/nextjs real-driver の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/nextjs</code> <code v-pre>real-driver</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>assertMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L42) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export declare function assertMode(provider: NextTarget, expected: KiwaTestMode, env?: Record<string, string | undefined>): void;
```

#### <code v-pre>resolveAllModes</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L35) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export declare function resolveAllModes(env?: Record<string, string | undefined>): ResolvedMode[];
```

#### <code v-pre>resolveMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L17) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export declare function resolveMode(provider: NextTarget, env?: Record<string, string | undefined>): ResolvedMode;
```

### 型

#### <code v-pre>KiwaTestMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L3) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export type KiwaTestMode = 'mock' | 'real';
```

#### <code v-pre>ResolvedMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/src/real-driver.ts#L5) <code v-pre>packages/nextjs/src/real-driver.ts</code>

```ts
export interface ResolvedMode {
    mode: KiwaTestMode;
    provider: NextTarget;
    reason: 'default-mock' | 'kiwa-mode-real' | 'missing-key' | 'invalid-mode';
}
```
