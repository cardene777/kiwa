import type { HonoAdapter, HonoMethod } from '../adapters/interface.js';

/**
 * User-facing Hono / Workers flow implementations — "what the dogfood app
 * actually does" that both mock and real adapters must satisfy. Each flow
 * drives 1 or more adapter ops end-to-end and returns a light summary so
 * tests + fidelity harness can assert on the outcome without re-implementing
 * the adapter contract in-line.
 *
 * The 4 flows selected are enough to exercise the full v1.19-4 AC set —
 * Hono app 5 route + 5 middleware chain / hc RPC type-safe request /
 * Workers env KV + D1 + R2 mock / ExecutionContext waitUntil scheduling.
 */

/**
 * Flow 1 — invoke the same path twice, once through the raw
 * `driveRoute` op (fetch-shaped `app.request`) and once through the
 * `driveRpc` op (hc-shaped `client.$get` / `.$post`). Both should
 * agree on status + JSON shape.
 */
export async function driveRouteVsRpcFlow(
  adapter: HonoAdapter,
  method: HonoMethod,
  path: string,
  opts?: {
    body?: unknown;
    headers?: Record<string, string>;
  },
): Promise<{
  routeStatus: number;
  routeBody: unknown;
  rpcStatus: number;
  rpcJson: unknown;
  agree: boolean;
}> {
  const routeSnapshot = await adapter.driveRoute(method, path, opts);
  const rpcSnapshot = await adapter.driveRpc(method, path, opts);
  return {
    routeStatus: routeSnapshot.status,
    routeBody: routeSnapshot.body,
    rpcStatus: rpcSnapshot.status,
    rpcJson: rpcSnapshot.json,
    // Both driveRoute and driveRpc dispatch through the same middleware
    // chain — agreement here proves the RPC transport wraps the same
    // response spec the raw route observed.
    agree:
      routeSnapshot.status === rpcSnapshot.status &&
      JSON.stringify(routeSnapshot.body) === JSON.stringify(rpcSnapshot.json),
  };
}

/**
 * Flow 2 — hit `/kv-counter` N times through the KV binding and confirm
 * the counter increments monotonically. Proves KV writes accumulate
 * across successive requests in a single adapter session.
 */
export async function driveKvCounterFlow(
  adapter: HonoAdapter,
  iterations: number,
): Promise<{
  finalValue: string | null;
  writeCount: number;
}> {
  const observation = await adapter.driveKv(iterations);
  return {
    // observation.reads is a Record<string, string | null>, so an unset
    // key returns undefined via index access. Normalise to `null` for the
    // consumer contract — `null` = "no value" and matches KV semantics.
    finalValue: observation.reads.dogfood ?? null,
    writeCount: Object.keys(observation.writes).length,
  };
}

/**
 * Flow 3 — seed D1 with rows, hit `/d1-list`, confirm the returned rows
 * match the seed. Proves the D1 binding round-trips prepared statements
 * + result rows through the handler.
 */
export async function driveD1NotesFlow(
  adapter: HonoAdapter,
  seed: readonly { id: number; title: string }[],
): Promise<{
  rowCount: number;
  rows: readonly Record<string, unknown>[];
}> {
  const observation = await adapter.driveD1(seed);
  return {
    rowCount: observation.rowCount,
    rows: observation.rows,
  };
}

/**
 * Flow 4 — upload N objects to R2 via `/r2-upload`, then list. Proves
 * the R2 binding writes + list surface the same keys back.
 */
export async function driveR2UploadFlow(
  adapter: HonoAdapter,
  uploads: readonly { key: string; contents: string }[],
): Promise<{
  written: readonly string[];
  listed: readonly string[];
}> {
  const observation = await adapter.driveR2(uploads);
  return {
    written: observation.keysWritten,
    listed: observation.keysListed,
  };
}

/**
 * Flow 5 — schedule N promises via ExecutionContext.waitUntil and confirm
 * `waitUntilAll()` drains them. Proves the exec ctx mock behaves like a
 * real CF ExecutionContext under `while (pending) await` semantics.
 */
export async function driveExecutionCtxFlow(
  adapter: HonoAdapter,
  scheduleCount: number,
): Promise<{
  pending: number;
  passedThrough: boolean;
}> {
  const observation = await adapter.driveExecutionCtx(scheduleCount);
  return {
    pending: observation.pending,
    passedThrough: observation.passedThrough,
  };
}
