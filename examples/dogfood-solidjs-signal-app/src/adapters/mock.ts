import {
  createResourceStub,
  h,
  renderSolid,
  renderWithSuspense,
  stringify,
  type SolidChild,
} from '@kiwa-lab/solidjs';
import { Counter } from '../components/Counter.js';
import { TodoList } from '../components/TodoList.js';
import { UserProfile, UserProfileLoadingFallback } from '../components/UserProfile.js';
import { createCounterStore, type CounterStore } from '../store/counter.js';
import { createTodosStore, type TodosStore } from '../store/todos.js';
import type {
  RenderSnapshot,
  ResourceTransition,
  SolidAdapter,
  SuspenseObservation,
  TodoDriveAction,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — spins up `@kiwa-lab/solidjs` mock primitives, mounts the
 * dogfood components with the store fixtures, and drives the 6-op surface
 * through the harness API. Every op records a trace event so the fidelity
 * harness can diff mock vs real behaviour without needing a live Solid
 * runtime.
 *
 * Latency is measured with `performance.now()` so the perf sample and the
 * metric aggregate stay coherent — the mock is intentionally fast (< 1 ms
 * per op) but still records a per-op sample so the report never reads as
 * 0-sample.
 */
export function makeMockAdapter(): SolidAdapter {
  const trace: TraceEvent[] = [];
  let counterStore: CounterStore | null = null;
  let todosStore: TodosStore | null = null;
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    counterMountCount: 0,
    todosMountCount: 0,
    resourceMountCount: 0,
    suspenseMountCount: 0,
  };

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
        errorKind: 'SOLID_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  function ensureCounterStore(initial: number): CounterStore {
    if (counterStore) counterStore.dispose();
    counterStore = createCounterStore(initial);
    return counterStore;
  }

  function ensureTodosStore(): TodosStore {
    if (todosStore) todosStore.dispose();
    todosStore = createTodosStore([]);
    return todosStore;
  }

  function renderCounter(): RenderSnapshot {
    const store = counterStore;
    if (!store) throw new Error('Counter store not initialised — call mountCounter first');
    const rendered = renderSolid<{ store: CounterStore }>({
      component: Counter,
      props: { store },
    });
    const markup = stringify(rendered.tree as SolidChild);
    rendered.dispose();
    return { component: 'Counter', markup };
  }

  function renderTodos(): RenderSnapshot {
    const store = todosStore;
    if (!store) throw new Error('Todos store not initialised — call mountTodos first');
    const rendered = renderSolid<{ store: TodosStore }>({
      component: TodoList,
      props: { store },
    });
    const markup = stringify(rendered.tree as SolidChild);
    rendered.dispose();
    return { component: 'TodoList', markup };
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async mountCounter(initial) {
      return timed('mountCounter', () => {
        const store = ensureCounterStore(initial);
        metricsAgg.counterMountCount += 1;
        const snapshot = renderCounter();
        record('mountCounter', true, {
          detail: { initial, initialValue: store.observed()[0] ?? null },
        });
        return {
          snapshot,
          effect: {
            runCount: store.effect.runCount(),
            values: store.observed(),
          },
        };
      });
    },

    async driveCounter(ticks) {
      return timed('driveCounter', () => {
        const store = counterStore;
        if (!store) throw new Error('mountCounter must run first');
        for (let i = 0; i < ticks; i += 1) store.increment(1);
        const snapshot = renderCounter();
        record('driveCounter', true, {
          detail: { ticks, runCount: store.effect.runCount() },
        });
        return {
          snapshot,
          effect: {
            runCount: store.effect.runCount(),
            values: store.observed(),
          },
        };
      });
    },

    async mountTodos(titles) {
      return timed('mountTodos', () => {
        const store = ensureTodosStore();
        metricsAgg.todosMountCount += 1;
        for (const title of titles) store.add(title);
        const snapshot = renderTodos();
        record('mountTodos', true, {
          detail: { seedCount: titles.length },
        });
        return snapshot;
      });
    },

    async driveTodos(actions: TodoDriveAction[]) {
      return timed('driveTodos', () => {
        const store = todosStore;
        if (!store) throw new Error('mountTodos must run first');
        for (const action of actions) {
          if (action.kind === 'add') store.add(action.title);
          else if (action.kind === 'toggle') store.toggle(action.id);
          else store.markAll(action.completed);
        }
        const snapshot = renderTodos();
        record('driveTodos', true, {
          detail: {
            actionCount: actions.length,
            runCount: store.effect.runCount(),
          },
        });
        return {
          snapshot,
          effect: {
            runCount: store.effect.runCount(),
            values: [store.completedCount()],
          },
        };
      });
    },

    async mountResource(fetcher) {
      return timed('mountResource', async () => {
        metricsAgg.resourceMountCount += 1;
        const handle = createResourceStub(fetcher);
        const transitions: ResourceTransition[] = [
          { at: 0, state: handle.accessor.state },
        ];
        const t0 = performance.now();
        // capture pending state
        transitions.push({ at: performance.now() - t0, state: handle.accessor.state });
        await handle.initialFetch;
        transitions.push({ at: performance.now() - t0, state: handle.accessor.state });
        // Render the profile component after settle to observe final markup
        // (loading fallback vs ready card). This mirrors what a real Solid
        // client would do after Suspense fulfils.
        const store = {
          handle,
          waitReady: async () => handle.accessor(),
          refresh: async () => handle.actions.refetch(),
        };
        const rendered = renderSolid<{ store: typeof store }>({
          component: UserProfile,
          props: { store },
        });
        const finalMarkup = stringify(rendered.tree as SolidChild);
        rendered.dispose();
        record('mountResource', handle.accessor.state === 'ready', {
          detail: { finalState: handle.accessor.state, transitions: transitions.length },
        });
        return { transitions, finalMarkup };
      });
    },

    async driveSuspense(fetchDelayMs) {
      return timed('driveSuspense', async () => {
        metricsAgg.suspenseMountCount += 1;
        const waitFor = new Promise<{ id: string; displayName: string; email: string }>(
          (resolve) => {
            setTimeout(
              () => resolve({ id: 'u1', displayName: 'Ada Lovelace', email: 'ada@example.com' }),
              fetchDelayMs,
            );
          },
        );
        const boundary = await renderWithSuspense({
          component: () =>
            h(
              'section',
              { class: 'user-profile ready', 'data-testid': 'user-profile-ready' },
              h('h2', null, 'Ada Lovelace'),
              h('p', null, 'ada@example.com'),
            ),
          fallback: UserProfileLoadingFallback,
          waitFor,
          timeoutMs: 200,
        });
        const observation: SuspenseObservation = {
          fallbackMarkup: stringify(boundary.fallback),
          resolvedMarkup: boundary.resolved ? stringify(boundary.resolved) : null,
          timedOut: boundary.timedOut,
        };
        record('driveSuspense', !boundary.timedOut, {
          detail: {
            fetchDelayMs,
            timedOut: boundary.timedOut,
            resolvedRendered: boundary.resolved !== null,
          },
        });
        return observation;
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        counterMountCount: metricsAgg.counterMountCount,
        todosMountCount: metricsAgg.todosMountCount,
        resourceMountCount: metricsAgg.resourceMountCount,
        suspenseMountCount: metricsAgg.suspenseMountCount,
      };
    },

    async reset() {
      if (counterStore) counterStore.dispose();
      if (todosStore) todosStore.dispose();
      counterStore = null;
      todosStore = null;
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.counterMountCount = 0;
      metricsAgg.todosMountCount = 0;
      metricsAgg.resourceMountCount = 0;
      metricsAgg.suspenseMountCount = 0;
    },
  };
}
