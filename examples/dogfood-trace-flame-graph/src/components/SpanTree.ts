import type { AdapterSpan } from '../adapters/interface.js';

/**
 * SpanTree — pure logic model of a React `<SpanTree />` component. The
 * component would render an indented tree of spans (name + duration
 * badge) that expand / collapse on click. Modelled in pure TS so tests
 * can assert row order + depth without a DOM.
 */

export interface SpanTreeRow {
  spanId: string;
  parentSpanId: string | null;
  name: string;
  depth: number;
  totalMs: number | null;
  hasChildren: boolean;
}

/**
 * Build an indented row list keyed by parent → child order. Root
 * spans emit first, followed by their children DFS. `hasChildren`
 * flags the disclosure caret UI.
 */
export function buildSpanTreeRows(spans: AdapterSpan[]): SpanTreeRow[] {
  const rows: SpanTreeRow[] = [];
  const childrenOf = new Map<string | null, AdapterSpan[]>();
  for (const s of spans) {
    const bucket = childrenOf.get(s.parentSpanId) ?? [];
    bucket.push(s);
    childrenOf.set(s.parentSpanId, bucket);
  }
  function walk(parentId: string | null, depth: number): void {
    const children = childrenOf.get(parentId) ?? [];
    for (const s of children) {
      const totalMs = s.endedAt === null ? null : s.endedAt - s.startedAt;
      const hasChildren = (childrenOf.get(s.spanId) ?? []).length > 0;
      rows.push({
        spanId: s.spanId,
        parentSpanId: s.parentSpanId,
        name: s.name,
        depth,
        totalMs,
        hasChildren,
      });
      walk(s.spanId, depth + 1);
    }
  }
  walk(null, 0);
  return rows;
}

/**
 * Compute the collapse mask a `<SpanTree />` would use when the user
 * collapses a specific span. Every descendant of the collapsed span is
 * hidden until the user expands it again.
 */
export function collapseSubtree(rows: SpanTreeRow[], collapsedSpanId: string): SpanTreeRow[] {
  const idx = rows.findIndex((r) => r.spanId === collapsedSpanId);
  if (idx === -1) return rows;
  const collapsedDepth = rows[idx]!.depth;
  const out: SpanTreeRow[] = rows.slice(0, idx + 1);
  let i = idx + 1;
  while (i < rows.length && rows[i]!.depth > collapsedDepth) i += 1;
  return out.concat(rows.slice(i));
}
