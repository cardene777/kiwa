/**
 * @kiwa-lab/design-check — Design conformance + layout regression check library.
 *
 * # Purpose
 *
 * kiwa の UI 実装が (1) デザイン仕様書 (spec) に沿って作れているか、 (2) レイアウトが
 * 崩れていないか、 の 2 軸で verify する library。 spec conformance と layout regression
 * を分離した 2 primitive で提供、 test 側で組合せて使う。
 *
 * # 主要 API
 *
 * - `checkSpecConformance` = design spec (色 / spacing / typography / component) と
 *   実 UI element の差分を verify する。 spec は object 形式 (Markdown parser は別 opt-in)。
 * - `checkLayoutRegression` = baseline layout snapshot と現在の layout の diff を検知、
 *   崩れ (overflow / overlap / missing element) を報告する。
 * - `assertDesignConformance` = spec conformance が pass しない場合 throw する assertion helper。
 * - `assertNoLayoutRegression` = layout regression 検知時に throw する assertion helper。
 *
 * # 使い方
 *
 * ```ts
 * import { checkSpecConformance, assertNoLayoutRegression } from '@kiwa-lab/design-check';
 *
 * const spec = {
 *   colors: { primary: '#3b82f6' },
 *   spacing: { md: 16 },
 *   components: { Button: { padding: 8 } },
 * };
 * const actual = { colors: { primary: '#3b82f6' }, spacing: { md: 16 }, components: { Button: { padding: 8 } } };
 * const result = checkSpecConformance(spec, actual);
 * console.log(result.pass, result.divergences);
 * ```
 */

export type {
  DesignSpec,
  DesignActual,
  SpecDivergence,
  SpecConformanceResult,
  LayoutSnapshot,
  LayoutRegression,
  LayoutRegressionResult,
} from './types.js';

export { checkSpecConformance, assertDesignConformance } from './spec-conformance.js';
export { checkLayoutRegression, assertNoLayoutRegression } from './layout-regression.js';
