# Design Check リファレンス

## 仕様適合

`checkSpecConformance(spec, actual)` は `SpecConformanceResult` を返します。`spec` と `actual` は colors、spacing、typography、components を任意で持つ object です。

| field | 比較方法 |
| --- | --- |
| `colors` | key ごとに文字列を完全一致で比較する |
| `spacing` | key ごとに数値を完全一致で比較する |
| `typography` | entry と指定済み property を完全一致で比較する |
| `components` | entry と指定済み prop を完全一致で比較する |

戻り値の divergence は `path`、`expected`、`actual`、`category` を持ちます。category は spec に必要な値がない `missing`、値が異なる `mismatch`、型として定義される `unexpected` です。現行の比較器は `unexpected` を生成しません。

`assertDesignConformance` は divergence が1件でもあれば Error を投げます。

## layout regression

`checkLayoutRegression(baseline, actual, options)` は `LayoutRegressionResult` を返します。snapshot の要素は selector、x、y、width、height、visible を持ちます。

| option | 既定値 | 内容 |
| --- | --- | --- |
| `positionTolerance` | 2 | x または y の許容差を px で指定する |
| `sizeTolerance` | 2 | width または height の許容差を px で指定する |
| `viewportWidth` | 未指定 | 右方向の overflow を検出する |
| `viewportHeight` | 未指定 | 下方向の overflow を検出する |

regression の kind は `position-shift`、`size-change`、`visibility-change`、`missing`、`overflow`、`overlap` です。actual にだけ存在する selector は比較対象になりません。baseline の visible が false でも位置とサイズは比較対象になります。

`assertNoLayoutRegression` は regression が1件でもあれば Error を投げます。

## 実行環境との接続

このライブラリは `LayoutSnapshot` を生成しません。Playwright などで bounding box と visibility を採取し、次のような形へ変換して渡します。

```ts
const snapshot = {
  elements: [
    {
      selector: '[data-testid="save"]',
      x: 24,
      y: 320,
      width: 96,
      height: 40,
      visible: true,
    },
  ],
};
```

採取環境の揺れを tolerance の引き上げで隠さず、差分が生じる条件を固定してから基準値を見直してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `layout regression detected (${result.regressions.length} issues):\n${summary}` | [packages/design-check/src/layout-regression.ts](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/layout-regression.ts#L130) |
| `design spec conformance failed (${result.divergences.length} divergences):\n${summary}` | [packages/design-check/src/spec-conformance.ts](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/spec-conformance.ts#L106) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `assertDesignConformance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/spec-conformance.ts#L97) `packages/design-check/src/spec-conformance.ts`

assertion helper — spec conformance が pass しない場合 throw する。 vitest の expect と同じ contract (test body で自然に fail する)。

```ts
export declare function assertDesignConformance(spec: DesignSpec, actual: DesignActual): void;
```

#### `assertNoLayoutRegression`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/layout-regression.ts#L120) `packages/design-check/src/layout-regression.ts`

assertion helper — layout regression 検知時 throw。

```ts
export declare function assertNoLayoutRegression(baseline: LayoutSnapshot, actual: LayoutSnapshot, opts?: CheckLayoutRegressionOptions): void;
```

#### `checkLayoutRegression`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/layout-regression.ts#L21) `packages/design-check/src/layout-regression.ts`

layout regression check — baseline と actual の bounding box 差分を検知する。 pass = true when 全 element が tolerance 内 + missing なし、 false when 差分あり。

```ts
export declare function checkLayoutRegression(baseline: LayoutSnapshot, actual: LayoutSnapshot, opts?: CheckLayoutRegressionOptions): LayoutRegressionResult;
```

#### `checkSpecConformance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/spec-conformance.ts#L7) `packages/design-check/src/spec-conformance.ts`

spec conformance check — design spec と actual UI values の差分を検知する。 pass = true when 全 spec key が actual に存在 + 値一致、 false when 差分あり。

```ts
export declare function checkSpecConformance(spec: DesignSpec, actual: DesignActual): SpecConformanceResult;
```

### 型

#### `DesignActual`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L14) `packages/design-check/src/types.ts`

実 UI (実装済 component) から抽出した design values。 shape は DesignSpec と同じ。

```ts
export type DesignActual = DesignSpec;
```

#### `DesignSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L6) `packages/design-check/src/types.ts`

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

#### `LayoutRegression`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L44) `packages/design-check/src/types.ts`

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

#### `LayoutRegressionResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L52) `packages/design-check/src/types.ts`

```ts
export interface LayoutRegressionResult {
    pass: boolean;
    regressions: LayoutRegression[];
    checkedCount: number;
}
```

#### `LayoutSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L33) `packages/design-check/src/types.ts`

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

#### `SpecConformanceResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L23) `packages/design-check/src/types.ts`

```ts
export interface SpecConformanceResult {
    pass: boolean;
    divergences: SpecDivergence[];
    checkedCount: number;
}
```

#### `SpecDivergence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/types.ts#L16) `packages/design-check/src/types.ts`

```ts
export interface SpecDivergence {
    path: string;
    expected: unknown;
    actual: unknown;
    category: 'missing' | 'mismatch' | 'unexpected';
}
```
<!-- kiwa-public-api:end -->
