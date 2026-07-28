---
title: "@kiwa-lab/design-check types の API 契約"
---

# <code v-pre>@kiwa-lab/design-check</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>DesignActual</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L14) <code v-pre>packages/design-check/src/types.ts</code>

実 UI (実装済 component) から抽出した design values。 shape は DesignSpec と同じ。

```ts
export type DesignActual = DesignSpec;
```

#### <code v-pre>DesignSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L6) <code v-pre>packages/design-check/src/types.ts</code>

design spec object shape。 デザイン仕様書 (colors / spacing / typography / components) を型付きで表現する。 Markdown / JSON / YAML の parser は別 module で この shape に変換する経路。

```ts
export interface DesignSpec {
    colors?: Record<string, string>;
    spacing?: Record<string, number>;
    typography?: Record<string, {
        fontSize?: number;
        fontWeight?: number;
        lineHeight?: number;
    }>;
    components?: Record<string, Record<string, unknown>>;
}
```

#### <code v-pre>LayoutRegression</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L44) <code v-pre>packages/design-check/src/types.ts</code>

```ts
export interface LayoutRegression {
    selector: string;
    kind: 'position-shift' | 'size-change' | 'visibility-change' | 'missing' | 'overflow' | 'overlap';
    detail: string;
    baseline?: {
        x: number;
        y: number;
        width: number;
        height: number;
        visible: boolean;
    };
    actual?: {
        x: number;
        y: number;
        width: number;
        height: number;
        visible: boolean;
    };
}
```

#### <code v-pre>LayoutRegressionResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L52) <code v-pre>packages/design-check/src/types.ts</code>

```ts
export interface LayoutRegressionResult {
    pass: boolean;
    regressions: LayoutRegression[];
    checkedCount: number;
}
```

#### <code v-pre>LayoutSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L33) <code v-pre>packages/design-check/src/types.ts</code>

layout snapshot = element ごとの bounding box + visibility。 Playwright / jsdom / browser DOM から生成する形式で保持する。

```ts
export interface LayoutSnapshot {
    elements: Array<{
        selector: string;
        x: number;
        y: number;
        width: number;
        height: number;
        visible: boolean;
    }>;
}
```

#### <code v-pre>SpecConformanceResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L23) <code v-pre>packages/design-check/src/types.ts</code>

```ts
export interface SpecConformanceResult {
    pass: boolean;
    divergences: SpecDivergence[];
    checkedCount: number;
}
```

#### <code v-pre>SpecDivergence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L16) <code v-pre>packages/design-check/src/types.ts</code>

```ts
export interface SpecDivergence {
    path: string;
    expected: unknown;
    actual: unknown;
    category: 'missing' | 'mismatch' | 'unexpected';
}
```
