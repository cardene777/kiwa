import {
  createCanvas,
  createChromaticVisualMock,
  createStoryRegistry,
  type ChromaticVisualMock,
  type StoryEntry,
  type StoryRegistry,
  type VisualBaseline,
  type VisualDiff,
  type VisualReviewEntry,
} from '@kiwa/component';
import type { SceneSpec } from '../scenes/index.js';
import type {
  BaselineSeedOutcome,
  CaptureOutcome,
  ReviewOutcome,
  TraceEvent,
  VisualRegressionAdapter,
} from './interface.js';

/**
 * Mock adapter — drives Chromatic-style visual regression through
 * `@kiwa/component` `createChromaticVisualMock`. Every op records a trace
 * event so the fidelity harness can diff mock vs real behaviour without a
 * live Chromatic CI upload.
 *
 * The mock is intentionally fast (< 1 ms per op) but still records a per-op
 * latency sample so `perf.p95Ms` in the 7-axis release gate never reads as
 * 0-sample. A parallel `StoryRegistry` registers every scene so the Chromatic
 * mock consumes a real `StoryEntry` (matching the semantics a real Chromatic
 * capture would see when it walks the Storybook preview).
 *
 * Multi-viewport policy — each scene declares
 * `parameters.chromatic.viewports = ['mobile', 'desktop']`, so `captureAll`
 * inside the mock produces 2 diffs per scene (20 total for the 10-scene run).
 * The mock's `captureAll(entry, canvas)` walks the viewport list itself.
 */
export function makeMockAdapter(): VisualRegressionAdapter {
  const trace: TraceEvent[] = [];
  const metricsAgg = {
    latencySamplesMs: [] as number[],
    seedInvocations: 0,
    captureInvocations: 0,
    reviewInvocations: 0,
  };
  let visualMock: ChromaticVisualMock | null = null;
  let registry: StoryRegistry | null = null;

  function record(op: string, ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function ensureVisualMock(): ChromaticVisualMock {
    if (visualMock) return visualMock;
    visualMock = createChromaticVisualMock({
      // Multi-viewport is scene-scoped through `parameters.chromatic.viewports`,
      // so the default viewport is a marker for scenes that opt out (none in
      // the current dogfood). Keeping the string stable makes the trace
      // deterministic across runs.
      defaultViewport: 'default',
      // Every scene sets diffThreshold=0 explicitly. Keeping the ctor default
      // at 0 makes the intent-change diff test hit `status='failed'` without
      // relying on a threshold nudge.
      defaultDiffThreshold: 0,
    });
    return visualMock;
  }

  function ensureRegistry(): StoryRegistry {
    if (registry) return registry;
    registry = createStoryRegistry();
    return registry;
  }

  function registerScene(spec: SceneSpec): StoryEntry {
    const reg = ensureRegistry();
    // Register the scene as a single-story meta so the Chromatic mock consumes
    // a real `StoryEntry` — the parameters (viewports / diffThreshold) attach
    // to the entry the mock inspects during capture.
    //
    // Title = primitive, storyName = theme so `buildId` (kebab-case
    // `${norm(title)}--${norm(storyName)}`) yields `card--light` etc.
    // We do NOT rely on this id shape — the Chromatic mock keys by
    // `storyId` which we override on entry.id right below so
    // `spec.sceneId = "card-light"` (single-dash form) is the canonical
    // key for both seedBaseline and capture. Aligning the ids lets the
    // review op target `spec.sceneId` directly.
    reg.register({
      title: spec.primitive,
      render: (args) => spec.render(args as ReturnType<SceneSpec['seedArgs']>),
      parameters: spec.parameters,
      stories: {
        [spec.theme]: {},
      },
    });
    const entry = reg.get(spec.primitive, spec.theme);
    // Return an entry that carries the canonical sceneId so the Chromatic
    // mock keys everything by the same string across seed / capture /
    // review. This does not mutate the registry — only the returned handle
    // used by the mock adapter's Chromatic capture.
    return { ...entry, id: spec.sceneId };
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
        errorKind: 'CHROMATIC_MOCK_ERROR',
        detail: { message: err instanceof Error ? err.message : String(err) },
      });
      throw err;
    }
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async seedBaselines(specs: SceneSpec[]): Promise<BaselineSeedOutcome[]> {
      return timed('seedBaselines', () => {
        const vm = ensureVisualMock();
        const outcomes: BaselineSeedOutcome[] = [];
        for (const spec of specs) {
          registerScene(spec);
          const viewports = spec.parameters.chromatic?.viewports ?? ['default'];
          const args = spec.seedArgs();
          const root = spec.render(args);
          const canvas = createCanvas(root);
          const markup = canvas.toMarkup();
          const hashes: Record<string, string> = {};
          for (const viewport of viewports) {
            const seeded: VisualBaseline = vm.seedBaseline({
              storyId: spec.sceneId,
              viewport,
              markup,
            });
            hashes[viewport] = seeded.hash;
            metricsAgg.seedInvocations += 1;
          }
          outcomes.push({
            sceneId: spec.sceneId,
            viewports: [...viewports],
            hashes,
          });
        }
        record('seedBaselines', true, {
          detail: {
            sceneCount: specs.length,
            seededPairs: outcomes.reduce(
              (sum, o) => sum + Object.keys(o.hashes).length,
              0,
            ),
          },
        });
        return outcomes;
      });
    },

    async captureOne(
      spec: SceneSpec,
      args: ReturnType<SceneSpec['seedArgs']>,
    ): Promise<CaptureOutcome> {
      return timed('captureOne', () => {
        const vm = ensureVisualMock();
        const entry = registerScene(spec);
        const root = spec.render(args);
        const canvas = createCanvas(root);
        const diffs: VisualDiff[] = vm.captureAll({
          entry,
          canvas,
        });
        metricsAgg.captureInvocations += 1;
        record('captureOne', true, {
          detail: {
            sceneId: spec.sceneId,
            viewportCount: diffs.length,
            changedCount: diffs.filter((d) => d.changed).length,
            statuses: diffs.map((d) => d.status),
          },
        });
        return { sceneId: spec.sceneId, diffs };
      });
    },

    async captureAll(
      specs: SceneSpec[],
      useIntentChange: boolean,
    ): Promise<CaptureOutcome[]> {
      return timed('captureAll', async () => {
        const vm = ensureVisualMock();
        const outcomes: CaptureOutcome[] = [];
        for (const spec of specs) {
          const entry = registerScene(spec);
          const args = useIntentChange ? spec.changedArgs() : spec.seedArgs();
          const root = spec.render(args);
          const canvas = createCanvas(root);
          const diffs: VisualDiff[] = vm.captureAll({
            entry,
            canvas,
          });
          metricsAgg.captureInvocations += 1;
          outcomes.push({ sceneId: spec.sceneId, diffs });
        }
        record('captureAll', true, {
          detail: {
            sceneCount: specs.length,
            intentChange: useIntentChange,
            failedDiffCount: outcomes.reduce(
              (sum, o) => sum + o.diffs.filter((d) => d.status === 'failed').length,
              0,
            ),
          },
        });
        return outcomes;
      });
    },

    async review(input): Promise<ReviewOutcome> {
      return timed('review', () => {
        const vm = ensureVisualMock();
        const entry = vm.review({
          storyId: input.sceneId,
          viewport: input.viewport,
          action: input.action,
        });
        metricsAgg.reviewInvocations += 1;
        record('review', true, {
          detail: {
            sceneId: input.sceneId,
            viewport: input.viewport,
            action: input.action,
          },
        });
        return { sceneId: input.sceneId, viewport: input.viewport, entry };
      });
    },

    reviewHistory(): VisualReviewEntry[] {
      const vm = visualMock;
      if (!vm) return [];
      return vm.reviewHistory();
    },

    metrics() {
      return {
        latencySamplesMs: [...metricsAgg.latencySamplesMs],
        seedInvocations: metricsAgg.seedInvocations,
        captureInvocations: metricsAgg.captureInvocations,
        reviewInvocations: metricsAgg.reviewInvocations,
      };
    },

    async reset() {
      trace.length = 0;
      metricsAgg.latencySamplesMs.length = 0;
      metricsAgg.seedInvocations = 0;
      metricsAgg.captureInvocations = 0;
      metricsAgg.reviewInvocations = 0;
      visualMock?.reset();
      visualMock = null;
      registry = null;
    },
  };
}
