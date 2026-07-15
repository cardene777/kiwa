import type { ChartNode } from './render.js';

export interface DrillDownRequest {
  seriesName: string;
  dataIndex: number;
}

export interface DrillDownResult {
  seriesName: string;
  dataIndex: number;
  value: number | null;
  detailNodes: ChartNode[];
  found: boolean;
}

/**
 * chart tree を掘り下げて特定 series + data index の detail node を取得。
 * real chart lib の onClick → drill-down navigation を mock。
 */
export function drillDown(tree: ChartNode, request: DrillDownRequest): DrillDownResult {
  const matches: ChartNode[] = [];
  function walk(node: ChartNode): void {
    if (node.meta?.series === request.seriesName) matches.push(node);
    for (const child of node.children) walk(child);
  }
  walk(tree);
  if (matches.length === 0 || request.dataIndex >= matches.length || request.dataIndex < 0) {
    return { seriesName: request.seriesName, dataIndex: request.dataIndex, value: null, detailNodes: [], found: false };
  }
  const target = matches[request.dataIndex]!;
  const value = typeof target.meta?.value === 'number' ? (target.meta.value as number) : null;
  return { seriesName: request.seriesName, dataIndex: request.dataIndex, value, detailNodes: [target], found: true };
}

export interface ExportOptions {
  format?: 'svg' | 'png';
  scale?: number;
}

/**
 * chart tree を SVG string or PNG mock bytes に変換。 real Chart.js の
 * canvas.toDataURL / Recharts の SVG export を mock。
 */
export function exportChart(tree: ChartNode, options: ExportOptions = {}): { format: 'svg' | 'png'; content: string; bytes: number } {
  const format = options.format ?? 'svg';
  const scale = options.scale ?? 1;
  const svg = treeToSvg(tree, scale);
  if (format === 'svg') return { format: 'svg', content: svg, bytes: svg.length };
  const pngMock = Buffer.from(svg, 'utf-8').toString('base64');
  return { format: 'png', content: `data:image/png;base64,${pngMock}`, bytes: pngMock.length };
}

function treeToSvg(node: ChartNode, scale: number): string {
  const attrs = Object.entries(node.attrs)
    .map(([k, v]) => {
      const value = typeof v === 'number' && (k === 'width' || k === 'height') ? v * scale : v;
      return `${k}="${value}"`;
    })
    .join(' ');
  if (node.children.length === 0) return `<${node.type} ${attrs} />`;
  const inner = node.children.map((c) => treeToSvg(c, scale)).join('');
  return `<${node.type} ${attrs}>${inner}</${node.type}>`;
}
