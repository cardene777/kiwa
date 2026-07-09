import {
  defineHead,
  hydrateIslands,
  invokeDefineRoute,
  invokeFreshHandler,
  islandPlaceholder,
  simulateInteraction,
  h,
  stringify,
  type HeadFragment,
  type IslandDefinition,
} from '@kiwa-lab/fresh';
import {
  CounterIsland,
  getCounterState,
  resetCounterState,
} from '../islands/counter-island.js';
import {
  TodoListIsland,
  getTodoListState,
  resetTodoListState,
} from '../islands/todo-list-island.js';
import { buildSiteHead } from '../head/site-head.js';
import { withEdgeEnv, sampleEdgeHandler } from '../edge/env-mock.js';
import { greetDefineRoute, greetHandlers, greetPage } from '../routes/greet.js';
import type {
  EdgeEnvObservation,
  FreshAdapter,
  FreshMethod,
  HeadSnapshot,
  InteractionSummary,
  IslandSnapshot,
  RouteSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — spins up `@kiwa-lab/fresh` mock primitives, drives the
 * dogfood routes / islands / head / edge harness through the 6-op surface,
 * and records a trace event per op so the fidelity harness can diff mock
 * vs real behaviour without needing a live Deno runtime.
 *
 * Latency is measured with `performance.now()` so the perf sample and the
 * metric aggregate stay coherent. Every op appends 1 latency sample so the
 * report never reads as 0-sample.
 */
export function makeMockAdapter(): FreshAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    routeMountCount: 0,
    handlerDispatchCount: 0,
    islandMountCount: 0,
    interactionCount: 0,
    headMergeCount: 0,
    edgeEnvCount: 0,
  };
  const mountedIslandCache = new Map<
    'Counter' | 'TodoList',
    ReturnType<typeof hydrateIslands>['hydrated'][number]
  >();

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
        errorKind: 'FRESH_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  function pickIsland(name: 'Counter' | 'TodoList'): IslandDefinition {
    return name === 'Counter'
      ? (CounterIsland as unknown as IslandDefinition)
      : (TodoListIsland as unknown as IslandDefinition);
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async mountRoute(pathname) {
      return timed('mountRoute', async () => {
        metricsAgg.routeMountCount += 1;
        const req = new Request(`http://x${pathname}`);
        const outcome = await invokeDefineRoute({
          route: greetDefineRoute,
          req,
          params: { name: pathname.split('/').pop() || 'world' },
        });
        const snapshot: RouteSnapshot = {
          status: outcome.error !== undefined ? 500 : outcome.notFound ? 404 : outcome.redirect ? outcome.redirect.status : 200,
          html: outcome.html,
          renderData: null,
        };
        record('mountRoute', outcome.error === undefined && outcome.tree !== null, {
          detail: {
            pathname,
            hasTree: outcome.tree !== null,
            hasRedirect: outcome.redirect !== null,
            hasNotFound: outcome.notFound !== null,
          },
        });
        return snapshot;
      });
    },

    async driveHandler(method: FreshMethod, body?: unknown) {
      return timed('driveHandler', async () => {
        metricsAgg.handlerDispatchCount += 1;
        const url = 'http://x/greet?name=fresh';
        const init: RequestInit = { method };
        if (body !== undefined) {
          init.body = JSON.stringify(body);
          init.headers = { 'content-type': 'application/json' };
        }
        const req = new Request(url, init);
        const outcome = await invokeFreshHandler({
          handlers: greetHandlers,
          req,
          page: greetPage,
        });
        const html = outcome.page ? stringify(outcome.page) : await outcome.response.clone().text();
        record('driveHandler', outcome.response.status < 400, {
          detail: {
            method,
            status: outcome.response.status,
            hasRenderData: outcome.renderData !== undefined,
          },
        });
        return {
          status: outcome.response.status,
          html,
          renderData: outcome.renderData ?? null,
        };
      });
    },

    async mountIsland(name, seedProps) {
      return timed('mountIsland', async () => {
        metricsAgg.islandMountCount += 1;
        if (name === 'Counter') resetCounterState();
        else resetTodoListState();
        const island = pickIsland(name);
        const ssrTree = h('main', null, islandPlaceholder(island, seedProps));
        const outcome = hydrateIslands({
          ssrTree,
          islands: [island],
        });
        const mount = outcome.hydrated[0];
        if (!mount) throw new Error(`island ${name} did not hydrate`);
        mountedIslandCache.set(name, mount);
        const snapshot: IslandSnapshot = {
          name,
          html: mount.mount.html,
          propsJson: JSON.stringify(mount.mount.props),
        };
        record('mountIsland', outcome.unregistered.length === 0, {
          detail: {
            name,
            hydratedCount: outcome.hydrated.length,
            missing: outcome.missing,
          },
        });
        return snapshot;
      });
    },

    async driveInteraction(name, event, value) {
      return timed('driveInteraction', async () => {
        metricsAgg.interactionCount += 1;
        const cached = mountedIslandCache.get(name);
        if (!cached) throw new Error(`mountIsland must run first for ${name}`);
        const result = simulateInteraction({
          mount: cached.mount,
          event,
          value,
        });
        const summary: InteractionSummary = {
          invoked: result.invoked,
          defaultPrevented: result.defaultPrevented,
        };
        // Observe the side-effect through the island's out-of-tree state so
        // tests can assert the handler actually mutated something.
        const stateSnapshot =
          name === 'Counter'
            ? { counter: getCounterState() }
            : { todoList: getTodoListState() };
        record('driveInteraction', result.invoked > 0, {
          detail: {
            name,
            event,
            invoked: result.invoked,
            defaultPrevented: result.defaultPrevented,
            state: stateSnapshot,
          },
        });
        return summary;
      });
    },

    async mountHead(fragments) {
      return timed('mountHead', async () => {
        metricsAgg.headMergeCount += 1;
        const parsed: HeadFragment[] = fragments.map((frag) => {
          const defineHeadOpts: {
            title?: string;
            meta: { name?: string; property?: string; content?: string }[];
            link: { rel: string; href: string }[];
          } = {
            meta: (frag.meta ?? []).map((m) => {
              const out: { name?: string; property?: string; content?: string } = {};
              if (m.name !== undefined) out.name = m.name;
              if (m.property !== undefined) out.property = m.property;
              if (m.content !== undefined) out.content = m.content;
              return out;
            }),
            link: [...(frag.link ?? [])],
          };
          if (frag.title !== undefined) defineHeadOpts.title = frag.title;
          return defineHead(defineHeadOpts);
        });
        const { merged, html } = buildSiteHead(parsed);
        const snapshot: HeadSnapshot = {
          title: merged.title ?? null,
          metaCount: merged.meta.length,
          linkCount: merged.link.length,
          html,
        };
        record('mountHead', true, {
          detail: {
            fragmentCount: fragments.length,
            title: snapshot.title,
            metaCount: snapshot.metaCount,
            linkCount: snapshot.linkCount,
          },
        });
        return snapshot;
      });
    },

    async driveEdgeEnv(env, handlerPath) {
      return timed('driveEdgeEnv', async () => {
        metricsAgg.edgeEnvCount += 1;
        const { snapshot } = await withEdgeEnv({ env, denoInstalled: true }, async () => {
          const req = new Request(`http://x${handlerPath}`);
          const response = sampleEdgeHandler(req);
          return response.status;
        });
        const observation: EdgeEnvObservation = {
          denoInstalled: snapshot.denoInstalled,
          envRead: snapshot.envRead,
          serveCalls: snapshot.serveCalls,
        };
        record('driveEdgeEnv', snapshot.serveCalls > 0, {
          detail: {
            handlerPath,
            serveCalls: snapshot.serveCalls,
            envReadKeys: Object.keys(snapshot.envRead),
          },
        });
        return observation;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        routeMountCount: metricsAgg.routeMountCount,
        handlerDispatchCount: metricsAgg.handlerDispatchCount,
        islandMountCount: metricsAgg.islandMountCount,
        interactionCount: metricsAgg.interactionCount,
        headMergeCount: metricsAgg.headMergeCount,
        edgeEnvCount: metricsAgg.edgeEnvCount,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.routeMountCount = 0;
      metricsAgg.handlerDispatchCount = 0;
      metricsAgg.islandMountCount = 0;
      metricsAgg.interactionCount = 0;
      metricsAgg.headMergeCount = 0;
      metricsAgg.edgeEnvCount = 0;
      mountedIslandCache.clear();
      resetCounterState();
      resetTodoListState();
    },
  };
}
