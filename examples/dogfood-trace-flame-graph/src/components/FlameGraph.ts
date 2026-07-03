import type { FlameGraphNode } from '../adapters/interface.js';

/**
 * FlameGraph — pure logic model of a React `<FlameGraph />` component.
 * The component would render a horizontal stack of rectangles keyed by
 * (depth, name) with widths proportional to totalMs. Modelled in pure
 * TS so the same code runs headless under vitest without pulling in a
 * DOM.
 *
 * Two exported helpers.
 *
 * - {@link layoutFlameGraph} — compute row + width % for every node so
 *   a downstream renderer (React / SVG / Canvas) can draw without
 *   walking the tree again.
 * - {@link summariseFlameGraph} — condense the flame into a per-name
 *   list of (name, samples, totalMs, selfMs, share%) for a tabular UI.
 */

export interface FlameLayoutNode {
  name: string;
  depth: number;
  /** Horizontal offset (percent of chart width) at which this node starts. */
  startPct: number;
  /** Width (percent of chart width). */
  widthPct: number;
  totalMs: number;
  selfMs: number;
  samples: number;
}

export interface FlameLayout {
  totalMs: number;
  rows: FlameLayoutNode[];
}

/**
 * Compute a horizontal-stack layout for the flame graph. Each root
 * span occupies a slice of the chart proportional to its totalMs,
 * children start at their parent's `startPct` and stack side-by-side
 * inside it. The layout is stable — sibling order follows the source
 * FlameGraphNode order.
 */
export function layoutFlameGraph(roots: FlameGraphNode[]): FlameLayout {
  const totalMs = roots.reduce((sum, n) => sum + n.totalMs, 0);
  const rows: FlameLayoutNode[] = [];
  if (totalMs <= 0) return { totalMs, rows };

  function walk(nodes: FlameGraphNode[], parentStart: number, parentTotal: number): void {
    if (parentTotal <= 0) return;
    let cursor = parentStart;
    for (const n of nodes) {
      const widthPct = (n.totalMs / totalMs) * 100;
      rows.push({
        name: n.name,
        depth: n.depth,
        startPct: cursor,
        widthPct,
        totalMs: n.totalMs,
        selfMs: n.selfMs,
        samples: n.samples,
      });
      walk(n.children, cursor, n.totalMs);
      cursor += widthPct;
    }
  }

  walk(roots, 0, totalMs);
  return { totalMs, rows };
}

/**
 * Aggregate every occurrence of a name across the flame tree.
 * Returned rows are sorted by totalMs descending so the LogPanel /
 * summary tab shows the hottest spans first.
 */
export interface FlameSummaryRow {
  name: string;
  samples: number;
  totalMs: number;
  selfMs: number;
  sharePct: number;
}

export function summariseFlameGraph(roots: FlameGraphNode[]): FlameSummaryRow[] {
  const total = roots.reduce((sum, n) => sum + n.totalMs, 0);
  const byName = new Map<string, { samples: number; totalMs: number; selfMs: number }>();
  const walk = (nodes: FlameGraphNode[]): void => {
    for (const n of nodes) {
      const bucket = byName.get(n.name) ?? { samples: 0, totalMs: 0, selfMs: 0 };
      bucket.samples += n.samples;
      bucket.totalMs += n.totalMs;
      bucket.selfMs += n.selfMs;
      byName.set(n.name, bucket);
      walk(n.children);
    }
  };
  walk(roots);
  const rows: FlameSummaryRow[] = [];
  for (const [name, bucket] of byName) {
    rows.push({
      name,
      samples: bucket.samples,
      totalMs: bucket.totalMs,
      selfMs: bucket.selfMs,
      sharePct: total === 0 ? 0 : (bucket.totalMs / total) * 100,
    });
  }
  rows.sort((a, b) => b.totalMs - a.totalMs);
  return rows;
}
