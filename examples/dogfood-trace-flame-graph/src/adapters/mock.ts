import {
  buildSpanTree,
  drillDown as flameDrillDown,
  flattenFlame,
  renderFlameGraph,
  type FlameNode,
  type SpanNode,
  type SpanRecord,
} from '@kiwa/observability';
import type {
  AdapterLog,
  AdapterSpan,
  FlameExplorerAdapter,
  FlameExplorerConfig,
  FlameExplorerMetrics,
  FlameGraphNode,
  FlameNameStats,
  LoadedTrace,
  LogJoinEntry,
  TraceEvent,
} from './interface.js';
import { TraceLogIndex } from '../correlation/index.js';

/**
 * Mock adapter — drives the `@kiwa/observability` span tree +
 * flame graph + log correlation helpers so the same app code exercises
 * the Jaeger surface without needing a live Jaeger process. Every
 * trace served here is one of the 10 seeded fixtures from
 * `../traces/index.ts` (or a caller-supplied override).
 *
 * The mock stores traces + built indices in memory. The 5 lifecycle
 * ops (`loadTrace` / `renderFlame` / `drillDown` / `joinLogs` /
 * `filterByName`) are deterministic pure functions of the fixture, so
 * fidelity tests can assert receiver identity + drill-down subtree
 * shape + log join counts without wall-clock coupling.
 *
 * The tree + flame + index are memoised per traceId — repeated calls
 * against the same trace reuse the cached structures so perf tests
 * measure lookup latency rather than tree rebuild cost.
 */
export function makeMockAdapter(config: FlameExplorerConfig): FlameExplorerAdapter {
  let virtualNow = 0;
  const clock = config.now ?? ((): number => (virtualNow += 1));
  const trace: TraceEvent[] = [];
  const loadLatencyMs: number[] = [];
  const renderLatencyMs: number[] = [];
  let loadCount = 0;
  let renderCount = 0;
  let drillDownCount = 0;
  let requestCount = 0;

  const tracesById = new Map<string, LoadedTrace>();
  for (const t of config.traces) tracesById.set(t.traceId, t);

  const spanTreeCache = new Map<string, SpanNode[]>();
  const flameCache = new Map<string, FlameNode[]>();
  const indexCache = new Map<string, TraceLogIndex>();

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function getOrBuildFlame(traceId: string): FlameNode[] | null {
    const cached = flameCache.get(traceId);
    if (cached) return cached;
    const raw = tracesById.get(traceId);
    if (!raw) return null;
    const spanRecords = toSpanRecords(raw.spans);
    const tree = buildSpanTree(spanRecords);
    const flame = renderFlameGraph(tree);
    spanTreeCache.set(traceId, tree);
    flameCache.set(traceId, flame);
    return flame;
  }

  function getOrBuildIndex(traceId: string): TraceLogIndex | null {
    const cached = indexCache.get(traceId);
    if (cached) return cached;
    const raw = tracesById.get(traceId);
    if (!raw) return null;
    const index = new TraceLogIndex(
      { spans: raw.spans, logs: raw.logs },
      config.correlationKeys ?? { traceIdKey: 'trace_id', spanIdKey: 'span_id' },
    );
    indexCache.set(traceId, index);
    return index;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    loadTrace: async (traceId: string): Promise<LoadedTrace> => {
      const started = clock();
      loadCount += 1;
      requestCount += 1;
      const raw = tracesById.get(traceId);
      if (!raw) {
        record('loadTrace', false, { errorKind: 'JAEGER_TRACE_NOT_FOUND', detail: traceId });
        throw new Error(`trace not found: ${traceId}`);
      }
      loadLatencyMs.push(Math.max(0, clock() - started));
      record('loadTrace', true, { detail: traceId });
      return raw;
    },

    renderFlame: async (traceId: string): Promise<FlameGraphNode[]> => {
      const started = clock();
      renderCount += 1;
      const flame = getOrBuildFlame(traceId);
      if (!flame) {
        record('renderFlame', false, { errorKind: 'JAEGER_TRACE_NOT_FOUND', detail: traceId });
        throw new Error(`trace not found: ${traceId}`);
      }
      renderLatencyMs.push(Math.max(0, clock() - started));
      record('renderFlame', true, { detail: traceId });
      return flame.map(toFlameGraphNode);
    },

    drillDown: async (traceId: string, name: string): Promise<FlameGraphNode | null> => {
      drillDownCount += 1;
      const flame = getOrBuildFlame(traceId);
      if (!flame) {
        record('drillDown', false, { errorKind: 'JAEGER_TRACE_NOT_FOUND', detail: traceId });
        throw new Error(`trace not found: ${traceId}`);
      }
      const target = flameDrillDown(flame, name);
      record('drillDown', target !== null, { detail: `${traceId}#${name}` });
      return target === null ? null : toFlameGraphNode(target);
    },

    joinLogs: async (traceId: string): Promise<LogJoinEntry[]> => {
      const index = getOrBuildIndex(traceId);
      if (!index) {
        record('joinLogs', false, { errorKind: 'JAEGER_TRACE_NOT_FOUND', detail: traceId });
        throw new Error(`trace not found: ${traceId}`);
      }
      const links = index.linkAll();
      record('joinLogs', true, { detail: traceId });
      return links;
    },

    filterByName: async (traceId: string, name: string): Promise<FlameNameStats | null> => {
      const flame = getOrBuildFlame(traceId);
      if (!flame) {
        record('filterByName', false, { errorKind: 'JAEGER_TRACE_NOT_FOUND', detail: traceId });
        throw new Error(`trace not found: ${traceId}`);
      }
      const flat = flattenFlame(flame).filter((n) => n.name === name);
      if (flat.length === 0) {
        record('filterByName', false, { detail: `${traceId}#${name}` });
        return null;
      }
      const samples = flat.reduce((sum, n) => sum + n.samples, 0);
      const totalMs = flat.reduce((sum, n) => sum + n.totalMs, 0);
      const selfMs = flat.reduce((sum, n) => sum + n.selfMs, 0);
      const averageMs = samples === 0 ? 0 : totalMs / samples;
      record('filterByName', true, { detail: `${traceId}#${name}` });
      return { name, samples, totalMs, selfMs, averageMs };
    },

    metrics: (): FlameExplorerMetrics => ({
      loadCount,
      renderCount,
      drillDownCount,
      loadLatencySamplesMs: [...loadLatencyMs],
      renderLatencySamplesMs: [...renderLatencyMs],
      requests: requestCount,
    }),

    reset: async (): Promise<void> => {
      trace.length = 0;
      loadLatencyMs.length = 0;
      renderLatencyMs.length = 0;
      loadCount = 0;
      renderCount = 0;
      drillDownCount = 0;
      requestCount = 0;
      spanTreeCache.clear();
      flameCache.clear();
      indexCache.clear();
    },
  };
}

/**
 * Convert the dogfood {@link AdapterSpan} shape into the observability
 * {@link SpanRecord} shape. `parentSpanName` is derived by looking up
 * the parent span's name — the observability `buildSpanTree` treats
 * spans as parented by name, not by id.
 */
function toSpanRecords(spans: AdapterSpan[]): SpanRecord[] {
  const nameById = new Map<string, string>();
  for (const s of spans) nameById.set(s.spanId, s.name);
  return spans.map((s) => ({
    name: s.name,
    attributes: s.attributes,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    parentSpanName: s.parentSpanId === null ? null : (nameById.get(s.parentSpanId) ?? null),
    events: [],
  }));
}

function toFlameGraphNode(node: FlameNode): FlameGraphNode {
  return {
    name: node.name,
    depth: node.depth,
    totalMs: node.totalMs,
    selfMs: node.selfMs,
    samples: node.samples,
    children: node.children.map(toFlameGraphNode),
  };
}
