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
 * "Real" adapter — targets a real Storybook 8 preview via HTTP + preview
 * channel messages. When `STORYBOOK_URL` is not set the adapter returns a
 * `skipped` variant whose every method records a `STORYBOOK_REAL_ENV_MISSING`
 * trace and throws a distinguished error. Tests use this behaviour to
 * short-circuit gracefully — the fidelity report captures "environment
 * absent" rather than failing the whole suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly install
 * `@storybook/react` (or its browser-only runtime) because the workspace does
 * not need a live browser process for the mock path. When
 * `STORYBOOK_URL=<preview base>` is set, the connected implementation would
 * fetch `stories.json`, invoke the preview iframe channel with `mount` and
 * `play`, and mirror the trace shape.
 *
 * The v0.1 dogfood ships the skip path only — a follow-up "live" perf harness
 * exists (see `tests/perf/dogfood-storybook-design-system.live.perf.ts`) to
 * hook a real preview when the caller sets the env, so the perf and fidelity
 * paths converge on the same env-detect logic.
 */

export interface RealAdapterEnv {
  storybookUrl: string;
  chromaticProjectToken?: string | undefined;
}

const DEFAULT_STORYBOOK_URL_ENV = 'STORYBOOK_URL';

export function detectRealEnv(): RealAdapterEnv | null {
  const storybookUrl = process.env[DEFAULT_STORYBOOK_URL_ENV];
  if (!storybookUrl) return null;
  return {
    storybookUrl,
    chromaticProjectToken: process.env['CHROMATIC_PROJECT_TOKEN'],
  };
}

/**
 * Distinguished error emitted when the real adapter is asked to run without
 * the required environment. Callers should catch it and let the fidelity
 * harness record the divergence rather than aborting the whole suite.
 */
export class SkippedError extends Error {
  readonly code = 'STORYBOOK_REAL_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because STORYBOOK_URL is not set (real Storybook preview requires a running preview base URL)`,
    );
  }
}

export function makeRealAdapter(): StorybookAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): StorybookAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'STORYBOOK_REAL_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    registerAll: async () => unsupported<StoryDescriptor[]>('registerAll'),
    listStories: async () => unsupported<StoryDescriptor[]>('listStories'),
    resolveArgs: async () => unsupported<ResolvedArgs>('resolveArgs'),
    mount: async () => unsupported<StoryMountSnapshot>('mount'),
    play: async () => unsupported<PlayRunReport>('play'),
    runA11y: async () => unsupported<A11yReport>('runA11y'),
    metrics: () => ({
      latencySamplesMs: [],
      playInvocations: 0,
      a11yInvocations: 0,
      mountInvocations: 0,
      handlersInvoked: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

/**
 * Connected real-mode driver — v0.1 ships as a placeholder that records a
 * `STORYBOOK_LIVE_NOT_IMPLEMENTED` trace event so the fidelity harness reads
 * the divergence. The intent is to swap this for a real `@storybook/react`
 * preview channel driver in a follow-up milestone once the caller opts in
 * with `STORYBOOK_URL` and the workspace hosts a browser runtime.
 *
 * The trace shape is intentionally identical to the skip path (mode='real',
 * errorKind on every trace) so the release-gate divergence count reports the
 * same "absent" signal without a shape-level noise diff.
 */
function makeConnectedRealAdapter(env: RealAdapterEnv): StorybookAdapter {
  const trace: TraceEvent[] = [];
  const noteEnv: TraceEvent = {
    op: 'connect',
    ok: false,
    errorKind: 'STORYBOOK_LIVE_NOT_IMPLEMENTED',
    detail: { storybookUrl: env.storybookUrl },
  };
  trace.push(noteEnv);
  function unsupported<T>(op: string): T {
    trace.push({
      op,
      ok: false,
      errorKind: 'STORYBOOK_LIVE_NOT_IMPLEMENTED',
      detail: { storybookUrl: env.storybookUrl },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    registerAll: async () => unsupported<StoryDescriptor[]>('registerAll'),
    listStories: async () => unsupported<StoryDescriptor[]>('listStories'),
    resolveArgs: async () => unsupported<ResolvedArgs>('resolveArgs'),
    mount: async () => unsupported<StoryMountSnapshot>('mount'),
    play: async () => unsupported<PlayRunReport>('play'),
    runA11y: async () => unsupported<A11yReport>('runA11y'),
    metrics: () => ({
      latencySamplesMs: [],
      playInvocations: 0,
      a11yInvocations: 0,
      mountInvocations: 0,
      handlersInvoked: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
