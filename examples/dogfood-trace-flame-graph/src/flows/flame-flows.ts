import type {
  FlameExplorerAdapter,
  LoadedTrace,
} from '../adapters/interface.js';

/**
 * End-to-end flows the trace flame graph explorer walks through when a
 * user clicks into a trace. The 5 flows compose into the `full` matrix
 * the fidelity harness uses to diff mock vs real.
 *
 * - `runLoadFlow` — pull each seeded trace once so the mock cache is
 *   warm and the real path recorded a network hit.
 * - `runRenderFlow` — build the flame graph for every trace so the
 *   render latency samples reflect every fixture shape.
 * - `runDrillDownFlow` — drill into 2 named nodes per trace so the
 *   subtree extraction path executes across depths.
 * - `runLogJoinFlow` — join logs to spans for every trace so the log
 *   correlation index is exercised.
 * - `runFilterFlow` — request per-name aggregate stats for a set of
 *   canonical names.
 */

const DEFAULT_TRACE_IDS: readonly string[] = [
  'trace-http-handler',
  'trace-fanout-parallel',
  'trace-nested-retry',
  'trace-ssr-tree',
  'trace-batch-write',
  'trace-chunked-upload',
  'trace-api-gateway',
  'trace-event-bus',
  'trace-cache-cycle',
  'trace-bg-job',
];

const DRILLDOWN_NAMES: Record<string, string[]> = {
  'trace-http-handler': ['db.query', 'auth.verify'],
  'trace-fanout-parallel': ['worker.process', 'worker.publish'],
  'trace-nested-retry': ['http.retry', 'backoff.wait'],
  'trace-ssr-tree': ['component.chart', 'boundary.data'],
  'trace-batch-write': ['db.batch', 'db.commit'],
  'trace-chunked-upload': ['chunk.upload', 'chunk.write'],
  'trace-api-gateway': ['downstream.billing', 'gateway.aggregate'],
  'trace-event-bus': ['bus.subscribe', 'notification.send'],
  'trace-cache-cycle': ['db.query', 'cache.write'],
  'trace-bg-job': ['heartbeat', 'job.finalize'],
};

const FILTER_NAMES: Record<string, string> = {
  'trace-http-handler': 'db.query',
  'trace-fanout-parallel': 'worker.process',
  'trace-nested-retry': 'http.retry',
  'trace-ssr-tree': 'component.axis',
  'trace-batch-write': 'db.batch',
  'trace-chunked-upload': 'chunk.checksum',
  'trace-api-gateway': 'downstream.users',
  'trace-event-bus': 'bus.subscribe',
  'trace-cache-cycle': 'cache.write',
  'trace-bg-job': 'heartbeat',
};

export async function runLoadFlow(adapter: FlameExplorerAdapter): Promise<LoadedTrace[]> {
  const out: LoadedTrace[] = [];
  for (const id of DEFAULT_TRACE_IDS) {
    const trace = await adapter.loadTrace(id);
    out.push(trace);
  }
  return out;
}

export async function runRenderFlow(adapter: FlameExplorerAdapter): Promise<void> {
  for (const id of DEFAULT_TRACE_IDS) {
    await adapter.renderFlame(id);
  }
}

export async function runDrillDownFlow(adapter: FlameExplorerAdapter): Promise<void> {
  for (const id of DEFAULT_TRACE_IDS) {
    const names = DRILLDOWN_NAMES[id] ?? [];
    for (const name of names) {
      await adapter.drillDown(id, name);
    }
  }
}

export async function runLogJoinFlow(adapter: FlameExplorerAdapter): Promise<void> {
  for (const id of DEFAULT_TRACE_IDS) {
    await adapter.joinLogs(id);
  }
}

export async function runFilterFlow(adapter: FlameExplorerAdapter): Promise<void> {
  for (const [id, name] of Object.entries(FILTER_NAMES)) {
    await adapter.filterByName(id, name);
  }
}

/** Run all 5 flows in order — the harness matrix. */
export async function runFullMatrix(adapter: FlameExplorerAdapter): Promise<void> {
  await runLoadFlow(adapter);
  await runRenderFlow(adapter);
  await runDrillDownFlow(adapter);
  await runLogJoinFlow(adapter);
  await runFilterFlow(adapter);
}

/**
 * Ops the full matrix exercises end-to-end on both mock + real paths.
 * All 5 ops fire on both paths so every op is a fidelity signal.
 */
export const OPS_UNDER_TEST: readonly string[] = [
  'loadTrace',
  'renderFlame',
  'drillDown',
  'joinLogs',
  'filterByName',
];

/** Public re-exports so callers can drive individual flows without pulling the constants array. */
export const DEFAULT_TRACES = DEFAULT_TRACE_IDS;
export const DEFAULT_DRILLDOWN_NAMES = DRILLDOWN_NAMES;
export const DEFAULT_FILTER_NAMES = FILTER_NAMES;
