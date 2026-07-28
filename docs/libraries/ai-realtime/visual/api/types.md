---
title: "@kiwa-lab/visual types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/visual</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>CompareOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/types.ts#L14) <code v-pre>packages/visual/src/types.ts</code>

```ts
export interface CompareOptions {
    /** Maximum mismatched pixel ratio allowed (0-1, default 0.005 = 0.5%) */
    maxDiffRatio?: number;
    /** Pixelmatch threshold (default 0.1) */
    threshold?: number;
    /** Whether to populate the diff PNG buffer (default true) */
    emitDiff?: boolean;
    /** Antialiasing tolerance (default false) */
    includeAA?: boolean;
}
```

#### <code v-pre>CompareResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/types.ts#L6) <code v-pre>packages/visual/src/types.ts</code>

```ts
export interface CompareResult {
    size: PixelSize;
    diffPixels: number;
    diffRatio: number;
    ok: boolean;
    diffBuffer: Buffer | null;
}
```

#### <code v-pre>PixelSize</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/visual/src/types.ts#L1) <code v-pre>packages/visual/src/types.ts</code>

```ts
export interface PixelSize {
    width: number;
    height: number;
}
```
