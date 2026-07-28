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
| <code v-pre>layout regression detected ($&#123;result.regressions.length&#125; issues):&#92;n$&#123;summary&#125;</code> | [packages/design-check/src/layout-regression.ts](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/layout-regression.ts#L130) |
| <code v-pre>design spec conformance failed ($&#123;result.divergences.length&#125; divergences):&#92;n$&#123;summary&#125;</code> | [packages/design-check/src/spec-conformance.ts](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/spec-conformance.ts#L106) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/design-check/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [layout-regression.ts](./api/layout-regression) | 2 | 0 |
| [spec-conformance.ts](./api/spec-conformance) | 2 | 0 |
| [types.ts](./api/types) | 0 | 7 |

<!-- kiwa-public-api:end -->
