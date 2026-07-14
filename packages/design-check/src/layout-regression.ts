import type { LayoutSnapshot, LayoutRegression, LayoutRegressionResult } from './types.js';

const DEFAULT_POSITION_TOLERANCE = 2;
const DEFAULT_SIZE_TOLERANCE = 2;

export interface CheckLayoutRegressionOptions {
  /** 許容位置ずれ (px、 default 2) */
  positionTolerance?: number;
  /** 許容サイズ差 (px、 default 2) */
  sizeTolerance?: number;
  /** overflow 検知の viewport width (default disabled) */
  viewportWidth?: number;
  /** overflow 検知の viewport height (default disabled) */
  viewportHeight?: number;
}

/**
 * layout regression check — baseline と actual の bounding box 差分を検知する。
 * pass = true when 全 element が tolerance 内 + missing なし、 false when 差分あり。
 */
export function checkLayoutRegression(
  baseline: LayoutSnapshot,
  actual: LayoutSnapshot,
  opts: CheckLayoutRegressionOptions = {},
): LayoutRegressionResult {
  const posTol = opts.positionTolerance ?? DEFAULT_POSITION_TOLERANCE;
  const sizeTol = opts.sizeTolerance ?? DEFAULT_SIZE_TOLERANCE;
  const regressions: LayoutRegression[] = [];
  let checkedCount = 0;

  const actualBySelector = new Map(actual.elements.map((e) => [e.selector, e]));

  for (const base of baseline.elements) {
    checkedCount += 1;
    const act = actualBySelector.get(base.selector);
    if (!act) {
      regressions.push({
        selector: base.selector,
        kind: 'missing',
        detail: `element not found in actual snapshot`,
        baseline: base,
      });
      continue;
    }
    if (base.visible !== act.visible) {
      regressions.push({
        selector: base.selector,
        kind: 'visibility-change',
        detail: `visibility ${base.visible} → ${act.visible}`,
        baseline: base,
        actual: act,
      });
    }
    if (Math.abs(base.x - act.x) > posTol || Math.abs(base.y - act.y) > posTol) {
      regressions.push({
        selector: base.selector,
        kind: 'position-shift',
        detail: `position (${base.x},${base.y}) → (${act.x},${act.y})`,
        baseline: base,
        actual: act,
      });
    }
    if (Math.abs(base.width - act.width) > sizeTol || Math.abs(base.height - act.height) > sizeTol) {
      regressions.push({
        selector: base.selector,
        kind: 'size-change',
        detail: `size ${base.width}x${base.height} → ${act.width}x${act.height}`,
        baseline: base,
        actual: act,
      });
    }
    // overflow 検知 = viewport 指定時のみ
    if (opts.viewportWidth !== undefined && act.x + act.width > opts.viewportWidth) {
      regressions.push({
        selector: base.selector,
        kind: 'overflow',
        detail: `element x+width ${act.x + act.width} exceeds viewport width ${opts.viewportWidth}`,
        actual: act,
      });
    }
    if (opts.viewportHeight !== undefined && act.y + act.height > opts.viewportHeight) {
      regressions.push({
        selector: base.selector,
        kind: 'overflow',
        detail: `element y+height ${act.y + act.height} exceeds viewport height ${opts.viewportHeight}`,
        actual: act,
      });
    }
  }

  // overlap 検知 = actual 内 element 同士の overlap
  for (let i = 0; i < actual.elements.length; i++) {
    for (let j = i + 1; j < actual.elements.length; j++) {
      const a = actual.elements[i]!;
      const b = actual.elements[j]!;
      if (!a.visible || !b.visible) continue;
      const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
      const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
      if (overlapX > 0 && overlapY > 0) {
        regressions.push({
          selector: `${a.selector} ⇔ ${b.selector}`,
          kind: 'overlap',
          detail: `elements overlap by ${overlapX}x${overlapY}`,
          actual: b,
        });
      }
    }
  }

  return {
    pass: regressions.length === 0,
    regressions,
    checkedCount,
  };
}

/**
 * assertion helper — layout regression 検知時 throw。
 */
export function assertNoLayoutRegression(
  baseline: LayoutSnapshot,
  actual: LayoutSnapshot,
  opts: CheckLayoutRegressionOptions = {},
): void {
  const result = checkLayoutRegression(baseline, actual, opts);
  if (!result.pass) {
    const summary = result.regressions
      .map((r) => `  - ${r.selector} [${r.kind}]: ${r.detail}`)
      .join('\n');
    throw new Error(
      `layout regression detected (${result.regressions.length} issues):\n${summary}`,
    );
  }
}
