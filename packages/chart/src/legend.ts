import type { ChartNode } from './render.js';

export interface LegendEntry {
  name: string;
  color: string;
  dataKey?: string;
  hidden: boolean;
}

/**
 * rendered chart tree を走査して series 名 + 色 + 表示状態を legend entry 化。
 * real chart library の Legend component が render する data table 相当。
 */
export function captureLegend(rendered: ChartNode): LegendEntry[] {
  const bySeriesName = new Map<string, LegendEntry>();
  walk(rendered, (node) => {
    const seriesName = typeof node.meta?.series === 'string' ? node.meta.series : undefined;
    if (!seriesName) return;
    if (bySeriesName.has(seriesName)) return;
    const color = String(node.attrs.fill ?? node.attrs.stroke ?? '#000');
    const entry: LegendEntry = { name: seriesName, color, hidden: false };
    if (typeof node.meta?.dataKey === 'string') entry.dataKey = node.meta.dataKey;
    bySeriesName.set(seriesName, entry);
  });
  return Array.from(bySeriesName.values());
}

function walk(node: ChartNode, cb: (n: ChartNode) => void): void {
  cb(node);
  for (const c of node.children) walk(c, cb);
}
