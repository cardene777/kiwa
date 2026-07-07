import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type FacetedState =
  | 'idle'
  | 'nested-computed'
  | 'hierarchy-traversed'
  | 'distinct-counted'
  | 'refined';

export interface FacetedDocument {
  id: string;
  facets: Record<string, string | string[]>;
}

export interface FacetedSession {
  target: SearchTarget;
  indexId: string;
  documents: FacetedDocument[];
  state: FacetedState;
  history: AxisStep<FacetedState>[];
}

export interface NestedFacetNode {
  value: string;
  count: number;
  children?: NestedFacetNode[];
}

export function startFacetedSession(input: {
  target: SearchTarget;
  indexId: string;
}): FacetedSession {
  if (input.indexId.length === 0) {
    throw new Error('startFacetedSession: indexId must not be empty');
  }
  return {
    target: input.target,
    indexId: input.indexId,
    documents: [],
    state: 'idle',
    history: [],
  };
}

export function seedFacetedDocuments(
  session: FacetedSession,
  docs: FacetedDocument[],
): void {
  for (const doc of docs) {
    session.documents.push({ id: doc.id, facets: { ...doc.facets } });
  }
}

export function computeNestedFacets(
  session: FacetedSession,
  input: { facetField: string; subFacetField: string },
): { step: AxisStep<FacetedState>; tree: NestedFacetNode[] } {
  if (session.documents.length === 0) {
    throw new Error('computeNestedFacets: no documents seeded');
  }
  const outer = new Map<string, Map<string, number>>();
  for (const doc of session.documents) {
    const outerVal = extractSingle(doc.facets[input.facetField]);
    const innerVal = extractSingle(doc.facets[input.subFacetField]);
    if (outerVal === null || innerVal === null) continue;
    if (!outer.has(outerVal)) outer.set(outerVal, new Map());
    const inner = outer.get(outerVal);
    if (inner) inner.set(innerVal, (inner.get(innerVal) ?? 0) + 1);
  }
  const tree: NestedFacetNode[] = [];
  for (const [outerVal, innerMap] of outer) {
    let outerCount = 0;
    const children: NestedFacetNode[] = [];
    for (const [innerVal, count] of innerMap) {
      children.push({ value: innerVal, count });
      outerCount += count;
    }
    children.sort((a, b) => a.value.localeCompare(b.value));
    tree.push({ value: outerVal, count: outerCount, children });
  }
  tree.sort((a, b) => a.value.localeCompare(b.value));
  session.state = 'nested-computed';
  const step = emit(session, 'facet.nested_computed', {
    outerField: input.facetField,
    innerField: input.subFacetField,
    outerCount: tree.length,
  });
  return { step, tree };
}

export function traverseHierarchy(
  session: FacetedSession,
  input: { field: string; separator?: string },
): { step: AxisStep<FacetedState>; levels: Record<string, number> } {
  const sep = input.separator ?? '>';
  const levels: Record<string, number> = {};
  for (const doc of session.documents) {
    const raw = extractSingle(doc.facets[input.field]);
    if (raw === null) continue;
    const parts = raw.split(sep).map((p) => p.trim()).filter((p) => p.length > 0);
    for (let i = 1; i <= parts.length; i += 1) {
      const path = parts.slice(0, i).join(sep);
      levels[path] = (levels[path] ?? 0) + 1;
    }
  }
  session.state = 'hierarchy-traversed';
  const step = emit(session, 'facet.hierarchy_traversed', {
    field: input.field,
    levelCount: Object.keys(levels).length,
    separator: sep,
  });
  return { step, levels };
}

export function countDistinct(
  session: FacetedSession,
  input: { field: string },
): { step: AxisStep<FacetedState>; distinct: number } {
  const seen = new Set<string>();
  for (const doc of session.documents) {
    const raw = doc.facets[input.field];
    if (Array.isArray(raw)) {
      for (const v of raw) seen.add(v);
    } else if (typeof raw === 'string') {
      seen.add(raw);
    }
  }
  session.state = 'distinct-counted';
  const step = emit(session, 'facet.distinct_counted', {
    field: input.field,
    distinct: seen.size,
    docCount: session.documents.length,
  });
  return { step, distinct: seen.size };
}

export function applyRefinedFilter(
  session: FacetedSession,
  input: { field: string; value: string },
): { step: AxisStep<FacetedState>; remaining: FacetedDocument[] } {
  const remaining = session.documents.filter((doc) => {
    const raw = doc.facets[input.field];
    if (Array.isArray(raw)) return raw.includes(input.value);
    return raw === input.value;
  });
  session.state = 'refined';
  const step = emit(session, 'facet.refined_filter_applied', {
    field: input.field,
    value: input.value,
    remainingCount: remaining.length,
    originalCount: session.documents.length,
  });
  return { step, remaining };
}

function extractSingle(raw: string | string[] | undefined): string | null {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0) return raw[0] ?? null;
  return null;
}

function emit(
  session: FacetedSession,
  neutralEvent: AxisStep<FacetedState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<FacetedState> {
  const step: AxisStep<FacetedState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, indexId: session.indexId, ...metadata },
  };
  session.history.push(step);
  return step;
}
