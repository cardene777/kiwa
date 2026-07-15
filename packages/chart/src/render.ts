export type ChartKind = 'bar' | 'line' | 'pie' | 'scatter';

export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  hidden?: boolean;
}

export interface ChartSpec {
  kind: ChartKind;
  series: ChartSeries[];
  width?: number;
  height?: number;
  title?: string;
}

/**
 * svg-like tree node — real chart library の rendered element を mock 表現。
 * type = svg element 名 / attrs = attribute map / children = ネスト tree。
 */
export interface ChartNode {
  type: string;
  attrs: Record<string, string | number>;
  children: ChartNode[];
  meta?: Record<string, unknown>;
}

/**
 * spec を svg-like tree に変換。 real chart library (Recharts / Chart.js / D3 / Visx) の
 * rendered DOM 相当を mock 生成、 kind 別に shape / rect / path / circle を配置。
 */
export function renderChart(spec: ChartSpec): ChartNode {
  const width = spec.width ?? 400;
  const height = spec.height ?? 300;
  const visibleSeries = spec.series.filter((s) => !s.hidden);
  const kindRenderers: Record<ChartKind, () => ChartNode[]> = {
    bar: () => renderBars(visibleSeries, width, height),
    line: () => renderLines(visibleSeries, width, height),
    pie: () => renderPie(visibleSeries, width, height),
    scatter: () => renderScatter(visibleSeries, width, height),
  };
  const children = kindRenderers[spec.kind]();
  const root: ChartNode = {
    type: 'svg',
    attrs: { width, height, viewBox: `0 0 ${width} ${height}` },
    children,
    meta: { kind: spec.kind, seriesCount: visibleSeries.length },
  };
  if (spec.title !== undefined) root.attrs['data-title'] = spec.title;
  return root;
}

function renderBars(series: ChartSeries[], width: number, height: number): ChartNode[] {
  const bars: ChartNode[] = [];
  const barWidth = Math.max(1, Math.floor(width / (series.reduce((n, s) => n + s.data.length, 0) || 1)));
  let x = 0;
  for (const s of series) {
    for (const pt of s.data) {
      const h = Math.max(1, Math.floor((pt.y / 100) * height));
      const node: ChartNode = {
        type: 'rect',
        attrs: { x, y: height - h, width: barWidth, height: h, fill: s.color ?? '#4c8bf5' },
        children: [],
        meta: { series: s.name, value: pt.y },
      };
      bars.push(node);
      x += barWidth;
    }
  }
  return bars;
}

function renderLines(series: ChartSeries[], width: number, height: number): ChartNode[] {
  const nodes: ChartNode[] = [];
  for (const s of series) {
    const dx = s.data.length > 1 ? width / (s.data.length - 1) : 0;
    const points = s.data.map((pt, i) => `${i * dx},${height - (pt.y / 100) * height}`).join(' ');
    nodes.push({
      type: 'polyline',
      attrs: { points, fill: 'none', stroke: s.color ?? '#4c8bf5', 'stroke-width': 2 },
      children: [],
      meta: { series: s.name },
    });
  }
  return nodes;
}

function renderPie(series: ChartSeries[], width: number, height: number): ChartNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) / 2 - 4;
  const nodes: ChartNode[] = [];
  const flat = series.flatMap((s) => s.data.map((pt) => ({ ...pt, seriesName: s.name, color: s.color })));
  const total = flat.reduce((n, pt) => n + pt.y, 0) || 1;
  let start = 0;
  for (const pt of flat) {
    const angle = (pt.y / total) * Math.PI * 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(start + angle);
    const y2 = cy + r * Math.sin(start + angle);
    const largeArc = angle > Math.PI ? 1 : 0;
    nodes.push({
      type: 'path',
      attrs: { d: `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`, fill: pt.color ?? '#4c8bf5' },
      children: [],
      meta: { series: pt.seriesName, value: pt.y, ratio: pt.y / total },
    });
    start += angle;
  }
  return nodes;
}

function renderScatter(series: ChartSeries[], width: number, height: number): ChartNode[] {
  const nodes: ChartNode[] = [];
  for (const s of series) {
    for (let i = 0; i < s.data.length; i += 1) {
      const pt = s.data[i]!;
      const xNum = typeof pt.x === 'number' ? pt.x : i;
      const cx = (xNum / 100) * width;
      const cy = height - (pt.y / 100) * height;
      nodes.push({
        type: 'circle',
        attrs: { cx, cy, r: 3, fill: s.color ?? '#4c8bf5' },
        children: [],
        meta: { series: s.name, value: pt.y },
      });
    }
  }
  return nodes;
}
