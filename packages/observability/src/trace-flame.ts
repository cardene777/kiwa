/**
 * Trace flame graph mock — v2.0 addition (v1.17-1).
 *
 * Builds a span tree from the flat TelemetryCollector.spans array
 * populated by v1.1 telemetry provider mocks, then renders a
 * flame-graph style structure keyed by depth + parent path. Supports
 * drill-down (subtree extraction by span name) and aggregate stats
 * (total ns per node, self ns, span count per name).
 *
 * The mock stays SUT-agnostic — kiwa tests can assert "span X has 3
 * children", "flame node Y self time is 20ms", "drill-down on Z
 * excludes sibling Q".
 */
import type { SpanRecord } from './telemetry.js';

export interface SpanNode {
  name: string;
  attributes: Record<string, unknown>;
  startedAt: number;
  endedAt: number | null;
  /** Total time (endedAt - startedAt); null when span is still open. */
  totalMs: number | null;
  /** Time spent in this node minus time spent in its children. */
  selfMs: number | null;
  children: SpanNode[];
  depth: number;
}

export interface FlameNode {
  name: string;
  depth: number;
  totalMs: number;
  selfMs: number;
  /**
   * Sample count — how many spans with this name aggregated into
   * this flame node. When multiple root/parent chains share a name
   * they collapse into a single flame node.
   */
  samples: number;
  children: FlameNode[];
}

/**
 * Build a tree of SpanNodes from a flat span array. Spans reference
 * their parent by `parentSpanName`; when the parent is null the span
 * becomes a root. Children order preserves the collector insertion
 * order (matches call order in the SUT).
 */
export function buildSpanTree(spans: SpanRecord[]): SpanNode[] {
  const byName = new Map<string, SpanNode>();
  const roots: SpanNode[] = [];
  for (const s of spans) {
    const node: SpanNode = {
      name: s.name,
      attributes: { ...s.attributes },
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      totalMs: s.endedAt === null ? null : s.endedAt - s.startedAt,
      selfMs: null,
      children: [],
      depth: 0,
    };
    byName.set(s.name, node);
    if (s.parentSpanName === null) {
      roots.push(node);
    } else {
      const parent = byName.get(s.parentSpanName);
      if (parent) {
        parent.children.push(node);
        node.depth = parent.depth + 1;
      } else {
        // Parent not yet seen; treat as root and fix up if the parent
        // is inserted later in the same pass. Callers who need strict
        // ordering should pre-sort spans by startedAt.
        roots.push(node);
      }
    }
  }
  for (const root of roots) computeSelf(root);
  return roots;
}

function computeSelf(node: SpanNode): void {
  if (node.totalMs === null) {
    node.selfMs = null;
  } else {
    let childTotal = 0;
    for (const c of node.children) {
      if (c.totalMs !== null) childTotal += c.totalMs;
    }
    node.selfMs = node.totalMs - childTotal;
  }
  for (const c of node.children) computeSelf(c);
}

/**
 * Render a flame graph structure. Nodes with the same name at the
 * same depth in the same parent chain collapse into one flame node
 * whose `samples` counts how many spans contributed. Only closed
 * spans (endedAt != null) contribute to the numeric aggregate; open
 * spans are counted but contribute 0 ms.
 */
export function renderFlameGraph(roots: SpanNode[]): FlameNode[] {
  return collapseSiblings(roots);
}

function collapseSiblings(nodes: SpanNode[]): FlameNode[] {
  const groups = new Map<string, SpanNode[]>();
  const order: string[] = [];
  for (const n of nodes) {
    const bucket = groups.get(n.name);
    if (bucket) {
      bucket.push(n);
    } else {
      groups.set(n.name, [n]);
      order.push(n.name);
    }
  }
  const out: FlameNode[] = [];
  for (const name of order) {
    const bucket = groups.get(name)!;
    const totalMs = bucket.reduce((sum, n) => sum + (n.totalMs ?? 0), 0);
    const selfMs = bucket.reduce((sum, n) => sum + (n.selfMs ?? 0), 0);
    const children = collapseSiblings(bucket.flatMap((n) => n.children));
    out.push({
      name,
      depth: bucket[0]!.depth,
      totalMs,
      selfMs,
      samples: bucket.length,
      children,
    });
  }
  return out;
}

/**
 * Drill-down — return the subtree rooted at the first node whose
 * name matches. Depth is normalized so the drilled-in root sits at
 * depth 0. Returns null when no matching node exists.
 */
export function drillDown(roots: FlameNode[], name: string): FlameNode | null {
  const target = findFirst(roots, name);
  if (!target) return null;
  return rebase(target, target.depth);
}

function findFirst(nodes: FlameNode[], name: string): FlameNode | null {
  for (const n of nodes) {
    if (n.name === name) return n;
    const deep = findFirst(n.children, name);
    if (deep) return deep;
  }
  return null;
}

function rebase(node: FlameNode, offset: number): FlameNode {
  return {
    name: node.name,
    depth: node.depth - offset,
    totalMs: node.totalMs,
    selfMs: node.selfMs,
    samples: node.samples,
    children: node.children.map((c) => rebase(c, offset)),
  };
}

/**
 * Flatten a flame tree into a depth-first list. Handy for kiwa
 * assertions that need to iterate every node without recursing.
 */
export function flattenFlame(roots: FlameNode[]): FlameNode[] {
  const out: FlameNode[] = [];
  const walk = (nodes: FlameNode[]): void => {
    for (const n of nodes) {
      out.push(n);
      walk(n.children);
    }
  };
  walk(roots);
  return out;
}
