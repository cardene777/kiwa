export interface AxisOptions {
  tickCount?: number;
  nice?: boolean;
  scale?: 'linear' | 'log';
}

export interface AxisResult {
  domain: [number, number];
  ticks: number[];
  scale: 'linear' | 'log';
  tickFormat: (value: number) => string;
}

/**
 * numeric data から axis の domain + tick + scale を計算。 real chart library の
 * d3-scale 相当を mock、 nice=true で見栄えの良い round 値に丸める。
 */
export function computeAxis(values: number[], options: AxisOptions = {}): AxisResult {
  const scale = options.scale ?? 'linear';
  const tickCount = options.tickCount ?? 5;
  const nice = options.nice ?? true;
  if (values.length === 0) {
    return { domain: [0, 1], ticks: [0, 1], scale, tickFormat: (v) => String(v) };
  }
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const [min, max] = nice ? niceDomain(rawMin, rawMax, tickCount) : [rawMin, rawMax];
  const step = (max - min) / Math.max(1, tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) => min + step * i);
  const tickFormat = (v: number) => {
    if (Number.isInteger(step) && Number.isInteger(v)) return String(v);
    return v.toFixed(2);
  };
  return { domain: [min, max], ticks, scale, tickFormat };
}

function niceDomain(min: number, max: number, tickCount: number): [number, number] {
  const range = max - min || 1;
  const step = Math.pow(10, Math.floor(Math.log10(range / tickCount)));
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  return [niceMin, niceMax];
}
