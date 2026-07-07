import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type QueryDslState =
  | 'idle'
  | 'boolean-tree-evaluated'
  | 'nested-resolved'
  | 'histogram-bucketed'
  | 'percentile-computed';

export type LeafOp = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains';

export interface LeafClause {
  kind: 'leaf';
  field: string;
  op: LeafOp;
  value: string | number;
}

export type BooleanKind = 'and' | 'or' | 'not';

export interface BooleanClause {
  kind: 'bool';
  op: BooleanKind;
  clauses: QueryClause[];
}

export type QueryClause = LeafClause | BooleanClause;

export interface QueryDslDocument {
  id: string;
  fields: Record<string, string | number>;
  nested?: Record<string, Array<Record<string, string | number>>>;
}

export interface QueryDslSession {
  target: SearchTarget;
  indexId: string;
  documents: QueryDslDocument[];
  state: QueryDslState;
  history: AxisStep<QueryDslState>[];
}

export function startQueryDslSession(input: {
  target: SearchTarget;
  indexId: string;
}): QueryDslSession {
  if (input.indexId.length === 0) {
    throw new Error('startQueryDslSession: indexId must not be empty');
  }
  return {
    target: input.target,
    indexId: input.indexId,
    documents: [],
    state: 'idle',
    history: [],
  };
}

export function seedQueryDslDocuments(session: QueryDslSession, docs: QueryDslDocument[]): void {
  for (const d of docs) {
    const cloned: QueryDslDocument = { id: d.id, fields: { ...d.fields } };
    if (d.nested) cloned.nested = deepCloneNested(d.nested);
    session.documents.push(cloned);
  }
}

export function evaluateBooleanTree(
  session: QueryDslSession,
  root: QueryClause,
): { step: AxisStep<QueryDslState>; matched: QueryDslDocument[] } {
  const matched = session.documents.filter((d) => evalClause(d, root));
  session.state = 'boolean-tree-evaluated';
  const step = emit(session, 'query.boolean_tree_evaluated', {
    matchedCount: matched.length,
    depth: clauseDepth(root),
  });
  return { step, matched };
}

export function resolveNestedQuery(
  session: QueryDslSession,
  input: { path: string; clause: LeafClause },
): { step: AxisStep<QueryDslState>; matched: QueryDslDocument[] } {
  const matched: QueryDslDocument[] = [];
  for (const doc of session.documents) {
    const items = doc.nested?.[input.path];
    if (!items) continue;
    for (const item of items) {
      if (evalLeafOnFields(item, input.clause)) {
        matched.push(doc);
        break;
      }
    }
  }
  session.state = 'nested-resolved';
  const step = emit(session, 'query.nested_resolved', {
    path: input.path,
    matchedCount: matched.length,
  });
  return { step, matched };
}

export function bucketHistogram(
  session: QueryDslSession,
  input: { field: string; interval: number },
): { step: AxisStep<QueryDslState>; buckets: Array<{ key: number; count: number }> } {
  if (input.interval <= 0) {
    throw new Error('bucketHistogram: interval must be positive');
  }
  const counts = new Map<number, number>();
  for (const doc of session.documents) {
    const raw = doc.fields[input.field];
    if (typeof raw !== 'number') continue;
    const bucket = Math.floor(raw / input.interval) * input.interval;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  const buckets = [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => a.key - b.key);
  session.state = 'histogram-bucketed';
  const step = emit(session, 'query.histogram_bucketed', {
    field: input.field,
    interval: input.interval,
    bucketCount: buckets.length,
  });
  return { step, buckets };
}

export function computePercentile(
  session: QueryDslSession,
  input: { field: string; percentile: number },
): { step: AxisStep<QueryDslState>; value: number } {
  if (input.percentile < 0 || input.percentile > 100) {
    throw new Error('computePercentile: percentile must be within [0, 100]');
  }
  const values: number[] = [];
  for (const doc of session.documents) {
    const raw = doc.fields[input.field];
    if (typeof raw === 'number') values.push(raw);
  }
  if (values.length === 0) {
    throw new Error(`computePercentile: no numeric values found for field ${input.field}`);
  }
  values.sort((a, b) => a - b);
  const rank = (input.percentile / 100) * (values.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const value =
    lower === upper
      ? (values[lower] ?? 0)
      : (values[lower] ?? 0) + (rank - lower) * ((values[upper] ?? 0) - (values[lower] ?? 0));
  session.state = 'percentile-computed';
  const step = emit(session, 'query.percentile_computed', {
    field: input.field,
    percentile: input.percentile,
    value,
    sampleSize: values.length,
  });
  return { step, value };
}

function evalClause(doc: QueryDslDocument, clause: QueryClause): boolean {
  if (clause.kind === 'leaf') return evalLeafOnFields(doc.fields, clause);
  switch (clause.op) {
    case 'and':
      return clause.clauses.every((c) => evalClause(doc, c));
    case 'or':
      return clause.clauses.some((c) => evalClause(doc, c));
    case 'not':
      return !clause.clauses.every((c) => evalClause(doc, c));
  }
}

function evalLeafOnFields(fields: Record<string, string | number>, leaf: LeafClause): boolean {
  const raw = fields[leaf.field];
  if (raw === undefined || raw === null) return false;
  switch (leaf.op) {
    case 'eq':
      return raw === leaf.value;
    case 'ne':
      return raw !== leaf.value;
    case 'lt':
      return typeof raw === 'number' && typeof leaf.value === 'number' && raw < leaf.value;
    case 'lte':
      return typeof raw === 'number' && typeof leaf.value === 'number' && raw <= leaf.value;
    case 'gt':
      return typeof raw === 'number' && typeof leaf.value === 'number' && raw > leaf.value;
    case 'gte':
      return typeof raw === 'number' && typeof leaf.value === 'number' && raw >= leaf.value;
    case 'contains':
      return typeof raw === 'string' && typeof leaf.value === 'string' && raw.includes(leaf.value);
  }
}

function clauseDepth(clause: QueryClause): number {
  if (clause.kind === 'leaf') return 1;
  let max = 0;
  for (const c of clause.clauses) {
    const d = clauseDepth(c);
    if (d > max) max = d;
  }
  return 1 + max;
}

function deepCloneNested(
  nested: Record<string, Array<Record<string, string | number>>>,
): Record<string, Array<Record<string, string | number>>> {
  const out: Record<string, Array<Record<string, string | number>>> = {};
  for (const [k, v] of Object.entries(nested)) {
    out[k] = v.map((item) => ({ ...item }));
  }
  return out;
}

function emit(
  session: QueryDslSession,
  neutralEvent: AxisStep<QueryDslState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<QueryDslState> {
  const step: AxisStep<QueryDslState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, indexId: session.indexId, ...metadata },
  };
  session.history.push(step);
  return step;
}
