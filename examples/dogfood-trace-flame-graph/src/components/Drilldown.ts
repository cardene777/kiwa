import type { FlameGraphNode, FlameNameStats } from '../adapters/interface.js';
import { summariseFlameGraph, type FlameSummaryRow } from './FlameGraph.js';

/**
 * Drilldown — pure logic model of a React `<Drilldown />` component.
 * The component would render a header (breadcrumb + parent name), a
 * summary table (per-name stats inside the drilled subtree), and a
 * mini-flame of the subtree. Modelled in pure TS so tests can assert
 * the header + summary + mini-flame independently.
 */

export interface DrilldownView {
  /** Focused node in the flame tree (subtree root). */
  focused: FlameGraphNode;
  /** Ordered breadcrumb from the original root down to the focused node. */
  breadcrumb: string[];
  /** Per-name stats for every descendant + focused node (sorted by totalMs desc). */
  summary: FlameSummaryRow[];
  /** Aggregate stat block the header UI displays. */
  headerStats: FlameNameStats;
}

/**
 * Build a Drilldown view for `focused`. The breadcrumb is derived by
 * walking `roots` DFS until the focused node's name is reached — the
 * mock adapter guarantees only one occurrence of any name at a given
 * subtree root, so this is unambiguous inside the drilled subtree.
 */
export function buildDrilldownView(
  roots: FlameGraphNode[],
  focused: FlameGraphNode,
): DrilldownView {
  const breadcrumb = trace(roots, focused.name) ?? [focused.name];
  const summary = summariseFlameGraph([focused]);
  const headerStats: FlameNameStats = {
    name: focused.name,
    samples: focused.samples,
    totalMs: focused.totalMs,
    selfMs: focused.selfMs,
    averageMs: focused.samples === 0 ? 0 : focused.totalMs / focused.samples,
  };
  return { focused, breadcrumb, summary, headerStats };
}

function trace(nodes: FlameGraphNode[], name: string): string[] | null {
  for (const n of nodes) {
    if (n.name === name) return [n.name];
    const deep = trace(n.children, name);
    if (deep) return [n.name, ...deep];
  }
  return null;
}
