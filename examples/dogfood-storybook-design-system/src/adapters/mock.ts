import {
  createStoryRegistry,
  hashMarkup,
  type MockNode,
  type StoryMeta,
  type StoryRegistry,
} from '@kiwa-lab/component';
import type {
  A11yReport,
  PlayRunReport,
  ResolvedArgs,
  StorybookAdapter,
  StoryDescriptor,
  StoryMountSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * Mock adapter — spins up an in-process `@kiwa-lab/component` `StoryRegistry`,
 * registers the 12 primitive metas, and drives args resolution + mount + play
 * + a11y through the harness API. Every op records a trace event, so the
 * fidelity harness can diff mock vs real behaviour without needing a live
 * Storybook preview.
 *
 * Latency is measured with `performance.now()` (perf-harness's default clock)
 * so the perf sample and the metric aggregate stay coherent — the mock is
 * intentionally fast (< 1 ms per op) but still records a per-op sample so the
 * report never reads as 0-sample.
 */
export function makeMockAdapter(): StorybookAdapter {
  const trace: TraceEvent[] = [];
  let registry: StoryRegistry | null = null;
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    playInvocations: 0,
    a11yInvocations: 0,
    mountInvocations: 0,
    handlersInvoked: 0,
  };

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensureRegistry(): StoryRegistry {
    if (registry) return registry;
    registry = createStoryRegistry();
    return registry;
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
        errorKind: 'STORYBOOK_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async registerAll(metas): Promise<StoryDescriptor[]> {
      return timed('registerAll', () => {
        const reg = ensureRegistry();
        for (const meta of metas) {
          reg.register(meta as StoryMeta<Record<string, unknown>>);
        }
        const entries = reg.list();
        const descriptors: StoryDescriptor[] = entries.map((e) => ({
          id: e.id,
          title: e.title,
          storyName: e.storyName,
          args: { ...e.args },
          hasPlay: Boolean(e.play),
        }));
        record('registerAll', true, {
          detail: { metaCount: metas.length, storyCount: descriptors.length },
        });
        return descriptors;
      });
    },

    async listStories(): Promise<StoryDescriptor[]> {
      return timed('listStories', () => {
        const reg = ensureRegistry();
        const entries = reg.list();
        const descriptors: StoryDescriptor[] = entries.map((e) => ({
          id: e.id,
          title: e.title,
          storyName: e.storyName,
          args: { ...e.args },
          hasPlay: Boolean(e.play),
        }));
        record('listStories', true, { detail: { count: descriptors.length } });
        return descriptors;
      });
    },

    async resolveArgs(title, storyName): Promise<ResolvedArgs> {
      return timed('resolveArgs', () => {
        const reg = ensureRegistry();
        const entry = reg.get(title, storyName);
        record('resolveArgs', true, { detail: { storyId: entry.id } });
        return { storyId: entry.id, args: { ...entry.args } };
      });
    },

    async mount(title, storyName, overrideArgs): Promise<StoryMountSnapshot> {
      return timed('mount', () => {
        const reg = ensureRegistry();
        const { canvas, entry } = reg.mount(title, storyName, overrideArgs);
        const markup = canvas.toMarkup();
        metricsAgg.mountInvocations += 1;
        record('mount', true, { detail: { storyId: entry.id } });
        return {
          storyId: entry.id,
          markup,
          hash: hashMarkup(markup),
        };
      });
    },

    async play(title, storyName): Promise<PlayRunReport> {
      return timed('play', async () => {
        const reg = ensureRegistry();
        const entry = reg.get(title, storyName);
        if (!entry.play) {
          record('play', true, {
            detail: { storyId: entry.id, skipped: true },
          });
          return {
            storyId: entry.id,
            steps: [],
            ok: true,
            handlersInvoked: 0,
          };
        }
        // Instrument every handler in the tree so each fire increments a
        // counter — the metric feeds the fidelity harness's play-parity
        // signal (real Storybook increments an interaction counter on every
        // fireEvent call; the mock counts each invocation synchronously).
        const { canvas } = reg.mount(title, storyName);
        const counter = { fires: 0 };
        instrumentHandlers(canvas.root, counter);
        const result = await reg.play(title, storyName, canvas);
        metricsAgg.playInvocations += 1;
        metricsAgg.handlersInvoked += counter.fires;
        record('play', true, {
          detail: {
            storyId: entry.id,
            stepCount: result.steps.length,
            ok: result.ok,
            handlersInvoked: counter.fires,
          },
        });
        return {
          storyId: entry.id,
          steps: result.steps,
          ok: result.ok,
          handlersInvoked: counter.fires,
        };
      });
    },

    async runA11y(title, storyName): Promise<A11yReport> {
      return timed('runA11y', () => {
        const reg = ensureRegistry();
        const entry = reg.get(title, storyName);
        const { canvas } = reg.mount(title, storyName);
        const result = reg.runA11y(title, storyName, canvas);
        metricsAgg.a11yInvocations += 1;
        record('runA11y', true, {
          detail: {
            storyId: entry.id,
            violationCount: result.violations.length,
          },
        });
        return {
          storyId: entry.id,
          violations: result.violations,
        };
      });
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        playInvocations: metricsAgg.playInvocations,
        a11yInvocations: metricsAgg.a11yInvocations,
        mountInvocations: metricsAgg.mountInvocations,
        handlersInvoked: metricsAgg.handlersInvoked,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.playInvocations = 0;
      metricsAgg.a11yInvocations = 0;
      metricsAgg.mountInvocations = 0;
      metricsAgg.handlersInvoked = 0;
      registry = null;
    },
  };
}

// Tree walk that wraps every handler with an invocation counter so the play
// function's actual handler firings are counted (rather than the registered
// handler count). Mirrors what Playwright CT's interaction log records under
// the hood — 1 tick per fireEvent call, not per handler registration.
function instrumentHandlers(node: MockNode, counter: { fires: number }): void {
  for (const [event, handlers] of Object.entries(node.handlers)) {
    node.handlers[event] = handlers.map((original) => (evt) => {
      counter.fires += 1;
      original(evt);
    });
  }
  for (const child of node.children) {
    instrumentHandlers(child, counter);
  }
}
