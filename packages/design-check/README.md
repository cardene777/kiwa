# @kiwa-lab/design-check

Design conformance + layout regression check library for kiwa。

## 目的

UI 実装が (1) デザイン仕様書 (spec) に沿って作られているか、 (2) レイアウトが崩れていないか、 の 2 軸で verify する library。

## 主要 API

- `checkSpecConformance(spec, actual)` — design spec (色 / spacing / typography / component) と実 UI values の差分を検知
- `checkLayoutRegression(baseline, actual, opts)` — baseline layout snapshot と現在 layout の diff を検知 (position shift / size change / visibility change / missing / overflow / overlap)
- `assertDesignConformance(spec, actual)` — spec conformance fail で throw する assertion helper
- `assertNoLayoutRegression(baseline, actual, opts)` — layout regression 検知時 throw

## 使い方

```ts
import { checkSpecConformance, assertNoLayoutRegression } from '@kiwa-lab/design-check';

// 1. spec conformance
const spec = {
  colors: { primary: '#3b82f6' },
  spacing: { md: 16 },
  components: { Button: { padding: 8 } },
};
const actual = { colors: { primary: '#3b82f6' }, spacing: { md: 16 }, components: { Button: { padding: 8 } } };
const result = checkSpecConformance(spec, actual);
console.log(result.pass, result.divergences);

// 2. layout regression
const baseline = {
  elements: [{ selector: '#btn', x: 10, y: 20, width: 100, height: 40, visible: true }],
};
const currentSnapshot = /* Playwright / DOM から抽出 */;
assertNoLayoutRegression(baseline, currentSnapshot, {
  positionTolerance: 2,
  sizeTolerance: 2,
  viewportWidth: 1280,
});
```

## 検知対象

| kind | 説明 |
|---|---|
| `mismatch` | spec と actual の値不一致 |
| `missing` | spec に存在するが actual にない |
| `position-shift` | element 位置が tolerance 超過で移動 |
| `size-change` | element サイズが tolerance 超過で変化 |
| `visibility-change` | element 可視性の変化 |
| `overflow` | viewport 外に element が出た |
| `overlap` | element 同士の重なり |

## test taxonomy 対応

perf / fidelity / skill / integration の 4 category test に対応、 kiwa taxonomy CLI 全 pass。

## license

UNLICENSED (private)

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/foundation/design-check/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/foundation/design-check/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/foundation/design-check/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/foundation/design-check/reference)

編集元は [docs/libraries/foundation/design-check](../../docs/libraries/foundation/design-check/) です。
<!-- kiwa-docs:end -->
