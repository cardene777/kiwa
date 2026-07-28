---
title: "@kiwa-lab/macos-app env の API 契約"
---

# <code v-pre>@kiwa-lab/macos-app</code> <code v-pre>env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createMacAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L55) <code v-pre>packages/macos-app/src/env.ts</code>

mock native app env を生成。 mode = 'swiftui' は declarative View tree の初期状態、 'appkit' は imperative responder chain の初期 window を返す。 real XCTest 起動なしで bundle info / window / view tree / accessibility descriptor を保持する。

```ts
export declare function createMacAppEnv(options?: CreateMacAppEnvOptions): MacAppEnv;
```

### 型

#### <code v-pre>BundleInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L3) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export interface BundleInfo {
    bundleId: string;
    version: string;
    build: string;
    executable: string;
}
```

#### <code v-pre>CreateMacAppEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L30) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export interface CreateMacAppEnvOptions {
    mode?: MacAppMode;
    bundleId?: string;
    windowTitle?: string;
    initialView?: ViewNode;
    now?: () => number;
}
```

#### <code v-pre>MacAppEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L38) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export interface MacAppEnv {
    mode: MacAppMode;
    bundle: BundleInfo;
    window: WindowInfo;
    rootView: ViewNode;
    eventLog: Array<{
        at: number;
        kind: string;
        detail: unknown;
    }>;
    now: () => number;
    createdAt: number;
}
```

#### <code v-pre>MacAppMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L1) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export type MacAppMode = 'swiftui' | 'appkit';
```

#### <code v-pre>ViewNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L20) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export interface ViewNode {
    id: string;
    type: string;
    label?: string;
    value?: string;
    enabled: boolean;
    children: ViewNode[];
    attributes: Record<string, string | number | boolean>;
}
```

#### <code v-pre>WindowInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/env.ts#L10) <code v-pre>packages/macos-app/src/env.ts</code>

```ts
export interface WindowInfo {
    id: string;
    title: string;
    width: number;
    height: number;
    x: number;
    y: number;
    visible: boolean;
}
```
