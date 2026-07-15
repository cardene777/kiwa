import type { ChartNode } from './render.js';

export interface TooltipEvent {
  x: number;
  y: number;
}

export interface TooltipContent {
  visible: boolean;
  series?: string;
  value?: number;
  targetType?: string;
}

/**
 * event 座標に最も近い data node (rect / circle / path) を探して tooltip 内容を決定。
 * real chart library の hover handler + tooltip content builder 相当。
 */
export function dispatchTooltip(rendered: ChartNode, event: TooltipEvent): TooltipContent {
  let nearest: { node: ChartNode; distSq: number } | null = null;
  walk(rendered, (node) => {
    const cx = numAttr(node, 'cx') ?? numAttr(node, 'x');
    const cy = numAttr(node, 'cy') ?? numAttr(node, 'y');
    if (cx === undefined || cy === undefined) return;
    const distSq = (cx - event.x) ** 2 + (cy - event.y) ** 2;
    if (!nearest || distSq < nearest.distSq) {
      nearest = { node, distSq };
    }
  });
  if (!nearest) return { visible: false };
  const n: ChartNode = (nearest as { node: ChartNode }).node;
  const content: TooltipContent = { visible: true };
  if (typeof n.meta?.series === 'string') content.series = n.meta.series;
  if (typeof n.meta?.value === 'number') content.value = n.meta.value;
  content.targetType = n.type;
  return content;
}

function numAttr(node: ChartNode, key: string): number | undefined {
  const v = node.attrs[key];
  if (typeof v === 'number') return v;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function walk(node: ChartNode, cb: (n: ChartNode) => void): void {
  cb(node);
  for (const c of node.children) walk(c, cb);
}
