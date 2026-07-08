import { invokeRoute, type HonoAppLike, type HttpMethod } from '@kiwa/hono';
import {
  buildDogfoodApp,
  resetRateLimit,
  readMiddlewareLog,
  ROUTE_PATHS,
  MIDDLEWARE_ORDER,
  type DogfoodEnv,
} from '../routes/app.js';
import { createDogfoodBindings, type DogfoodBindings } from '../workers/bindings.js';
import { createDogfoodRpc, type DogfoodHcClient } from '../rpc/client.js';
import type {
  D1Observation,
  ExecutionCtxObservation,
  HonoAdapter,
  HonoMethod,
  KvObservation,
  R2Observation,
  RouteSnapshot,
  RpcSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — spins up a fresh `@kiwa/hono` app + Workers bindings
 * per adapter instance, drives all 6 ops through the shared route surface
 * and records a trace event per op so the fidelity harness can diff mock
 * vs real without needing a real miniflare / wrangler runtime.
 *
 * Every op appends 1 latency sample and 1 trace event so the report never
 * reads as 0-sample.
 */
export function makeMockAdapter(): HonoAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    routeInvokeCount: 0,
    rpcInvokeCount: 0,
    kvOpCount: 0,
    d1OpCount: 0,
    r2OpCount: 0,
    execCtxCount: 0,
  };

  // Each adapter instance owns 1 app + 1 bindings set + 1 hc client. The
  // ratelimit counter is process-global inside the routes module so
  // adapter.reset() calls `resetRateLimit()` to keep tests isolated.
  let state: {
    app: HonoAppLike<DogfoodEnv>;
    bindings: DogfoodBindings;
    client: DogfoodHcClient;
  } | null = null;

  function ensure(): {
    app: HonoAppLike<DogfoodEnv>;
    bindings: DogfoodBindings;
    client: DogfoodHcClient;
  } {
    if (state) return state;
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    state = { app, bindings, client: createDogfoodRpc(app) };
    return state;
  }

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function timed<T>(op: string, run: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await run();
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      return result;
    } catch (err) {
      metricsAgg.latencySamplesMs.push(performance.now() - start);
      record(op, false, {
        errorKind: 'HONO_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  function buildAuthHeader(bindings: DogfoodBindings): Record<string, string> {
    return { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` };
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async driveRoute(method, path, opts) {
      return timed('driveRoute', async () => {
        metricsAgg.routeInvokeCount += 1;
        const { app, bindings } = ensure();
        const headers = { ...buildAuthHeader(bindings), ...(opts?.headers ?? {}) };
        const invokeOpts: {
          app: HonoAppLike<DogfoodEnv>;
          method: HttpMethod;
          path: string;
          headers: Record<string, string>;
          env: DogfoodEnv;
          executionCtx: DogfoodBindings['ctx'];
          body?: string;
        } = {
          app,
          method: method as HttpMethod,
          path,
          headers,
          env: bindings.env,
          executionCtx: bindings.ctx,
        };
        if (opts?.body !== undefined) {
          invokeOpts.body = JSON.stringify(opts.body);
          if (!headers['content-type']) headers['content-type'] = 'application/json';
        }
        const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>(invokeOpts);
        const snapshot: RouteSnapshot = {
          status: result.response.status,
          body: result.response.body,
          middlewareLog: result.trace
            .filter((t) => t.kind === 'middleware')
            .map((t) => t.pattern),
        };
        record('driveRoute', result.matched && result.response.status < 500, {
          detail: {
            method,
            path,
            status: result.response.status,
            middlewareCount: result.trace.filter((t) => t.kind === 'middleware').length,
          },
        });
        return snapshot;
      });
    },

    async driveRpc(method, path, opts) {
      return timed('driveRpc', async () => {
        metricsAgg.rpcInvokeCount += 1;
        // The kiwa mock hc client dispatches through the same `invokeRoute`
        // path — we call it directly to keep the response spec shape stable
        // and record trace details from the underlying invocation.
        const { app, bindings } = ensure();
        const headers = { ...buildAuthHeader(bindings), ...(opts?.headers ?? {}) };
        const invokeOpts: {
          app: HonoAppLike<DogfoodEnv>;
          method: HttpMethod;
          path: string;
          headers: Record<string, string>;
          env: DogfoodEnv;
          executionCtx: DogfoodBindings['ctx'];
          body?: string;
        } = {
          app,
          method: method as HttpMethod,
          path,
          headers,
          env: bindings.env,
          executionCtx: bindings.ctx,
        };
        if (opts?.body !== undefined) {
          invokeOpts.body = JSON.stringify(opts.body);
          if (!headers['content-type']) headers['content-type'] = 'application/json';
        }
        const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>(invokeOpts);
        const snapshot: RpcSnapshot = {
          status: result.response.status,
          ok: result.response.status >= 200 && result.response.status < 300,
          json: result.response.bodyKind === 'json' ? result.response.body : null,
        };
        record('driveRpc', snapshot.ok, {
          detail: {
            method,
            path,
            status: snapshot.status,
          },
        });
        return snapshot;
      });
    },

    async driveKv(iterations) {
      return timed('driveKv', async () => {
        metricsAgg.kvOpCount += 1;
        const { app, bindings } = ensure();
        // Repeatedly invoke /kv-counter to accumulate a KV write. The
        // handler stores under the key `dogfood`; we snapshot both the
        // final read + every intermediate write.
        for (let i = 0; i < iterations; i += 1) {
          await invokeRoute<DogfoodEnv, Record<string, unknown>>({
            app,
            method: 'POST',
            path: ROUTE_PATHS.kvCounter,
            headers: {
              ...buildAuthHeader(bindings),
              'content-type': 'application/json',
            },
            body: JSON.stringify({}),
            env: bindings.env,
            executionCtx: bindings.ctx,
          });
        }
        const snapshot = bindings.kv.__snapshot();
        const observation: KvObservation = {
          writes: Object.fromEntries(
            Object.entries(snapshot).map(([k, v]) => [k, v.value]),
          ),
          reads: { dogfood: (await bindings.kv.get('dogfood')) ?? null },
        };
        record('driveKv', iterations > 0, {
          detail: {
            iterations,
            finalValue: observation.reads.dogfood,
          },
        });
        return observation;
      });
    },

    async driveD1(seed) {
      return timed('driveD1', async () => {
        metricsAgg.d1OpCount += 1;
        const { app, bindings } = ensure();
        // kiwa D1 mock is query-string matched (no SQL parsing), so seed
        // the canned response the /d1-list handler will call. The exact
        // query string is defined in routes/app.ts d1ListHandler.
        const sql = 'SELECT id, title FROM notes ORDER BY id ASC';
        bindings.d1.__setResponse(
          sql,
          seed.map((row) => ({ id: row.id, title: row.title })),
        );
        const invocation = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
          app,
          method: 'GET',
          path: ROUTE_PATHS.d1List,
          headers: buildAuthHeader(bindings),
          env: bindings.env,
          executionCtx: bindings.ctx,
        });
        const body = invocation.response.body as
          | { notes?: Array<Record<string, unknown>> }
          | undefined;
        const rows = body?.notes ?? [];
        const observation: D1Observation = {
          sql,
          rowCount: rows.length,
          rows,
        };
        record('driveD1', invocation.response.status === 200, {
          detail: {
            seedCount: seed.length,
            rowCount: rows.length,
          },
        });
        return observation;
      });
    },

    async driveR2(uploads) {
      return timed('driveR2', async () => {
        metricsAgg.r2OpCount += 1;
        const { app, bindings } = ensure();
        const keysWritten: string[] = [];
        for (const upload of uploads) {
          const invocation = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
            app,
            method: 'POST',
            path: ROUTE_PATHS.r2Upload,
            headers: {
              ...buildAuthHeader(bindings),
              'content-type': 'application/json',
            },
            body: JSON.stringify(upload),
            env: bindings.env,
            executionCtx: bindings.ctx,
          });
          if (invocation.response.status === 200) keysWritten.push(upload.key);
        }
        const listing = await bindings.r2.list();
        const observation: R2Observation = {
          keysWritten,
          keysListed: listing.objects.map((o) => o.key),
        };
        record('driveR2', keysWritten.length === uploads.length, {
          detail: {
            uploadCount: uploads.length,
            writtenCount: keysWritten.length,
          },
        });
        return observation;
      });
    },

    async driveExecutionCtx(scheduleCount) {
      return timed('driveExecutionCtx', async () => {
        metricsAgg.execCtxCount += 1;
        const { bindings } = ensure();
        for (let i = 0; i < scheduleCount; i += 1) {
          bindings.ctx.waitUntil(Promise.resolve(i));
        }
        const pendingBefore = bindings.ctx.pendingCount();
        await bindings.ctx.waitUntilAll();
        const pendingAfter = bindings.ctx.pendingCount();
        const observation: ExecutionCtxObservation = {
          waitUntilCount: scheduleCount,
          pending: pendingAfter,
          passedThrough: bindings.ctx.didPassThrough(),
        };
        record('driveExecutionCtx', pendingAfter === 0, {
          detail: {
            scheduleCount,
            pendingBefore,
            pendingAfter,
          },
        });
        return observation;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        routeInvokeCount: metricsAgg.routeInvokeCount,
        rpcInvokeCount: metricsAgg.rpcInvokeCount,
        kvOpCount: metricsAgg.kvOpCount,
        d1OpCount: metricsAgg.d1OpCount,
        r2OpCount: metricsAgg.r2OpCount,
        execCtxCount: metricsAgg.execCtxCount,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.routeInvokeCount = 0;
      metricsAgg.rpcInvokeCount = 0;
      metricsAgg.kvOpCount = 0;
      metricsAgg.d1OpCount = 0;
      metricsAgg.r2OpCount = 0;
      metricsAgg.execCtxCount = 0;
      state = null;
      resetRateLimit();
    },
  };
}

/** Consumers of the mock adapter — surface constants for tests to import. */
export const MOCK_ROUTE_PATHS = ROUTE_PATHS;
export const MOCK_MIDDLEWARE_ORDER = MIDDLEWARE_ORDER;
export { readMiddlewareLog };
