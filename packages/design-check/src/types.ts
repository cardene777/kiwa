/**
 * design spec object shape。 デザイン仕様書 (colors / spacing / typography /
 * components) を型付きで表現する。 Markdown / JSON / YAML の parser は別 module で
 * この shape に変換する経路。
 */
export interface DesignSpec {
  colors?: Record<string, string>;
  spacing?: Record<string, number>;
  typography?: Record<string, { fontSize?: number; fontWeight?: number; lineHeight?: number }>;
  components?: Record<string, Record<string, unknown>>;
}

/** 実 UI (実装済 component) から抽出した design values。 shape は DesignSpec と同じ。 */
export type DesignActual = DesignSpec;

export interface SpecDivergence {
  path: string;
  expected: unknown;
  actual: unknown;
  category: 'missing' | 'mismatch' | 'unexpected';
}

export interface SpecConformanceResult {
  pass: boolean;
  divergences: SpecDivergence[];
  checkedCount: number;
}

/**
 * layout snapshot = element ごとの bounding box + visibility。 Playwright /
 * jsdom / browser DOM から生成する形式で保持する。
 */
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

export interface LayoutRegression {
  selector: string;
  kind: 'position-shift' | 'size-change' | 'visibility-change' | 'missing' | 'overflow' | 'overlap';
  detail: string;
  baseline?: { x: number; y: number; width: number; height: number; visible: boolean };
  actual?: { x: number; y: number; width: number; height: number; visible: boolean };
}

export interface LayoutRegressionResult {
  pass: boolean;
  regressions: LayoutRegression[];
  checkedCount: number;
}
