import type {
  A11yReport,
  CoverageReport,
  InteractionRunReport,
  MdxRenderReport,
  ResolvedArgs,
  StorybookMdxAdapter,
  StoryDescriptor,
  StoryMountSnapshot,
  TraceEvent,
} from './interface.js';

/**
 * "Real" adapter — targets a real Storybook 8 preview via HTTP + preview
 * channel messages. When `STORYBOOK_URL` is not set or
 * `STORYBOOK_MDX_READY=1` is not set the adapter returns a `skipped` variant
 * whose every method records a `STORYBOOK_MDX_REAL_ENV_MISSING` trace and
 * throws a distinguished error. Tests use this behaviour to short-circuit
 * gracefully — the fidelity report captures "environment absent" rather than
 * failing the whole suite in local dev.
 *
 * The real driving is intentionally lazy — we do not eagerly install the
 * `@storybook/react` browser runtime because the workspace does not need a
 * live browser process for the mock path. When both env vars are set, the
 * connected implementation would fetch `stories.json` + `index.json` (SB 8),
 * render each MDX doc through `@storybook/blocks`, and drive interactions
 * through `@storybook/test`.
 *
 * v1.34-4 ships the skip path only — the fidelity harness captures the
 * divergence between mock (full trace) and real (skipped trace) so the
 * release gate reports the parity delta accurately.
 */

export interface RealAdapterEnv {
  storybookUrl: string;
  mdxReady: boolean;
  storybookTestReady: boolean;
}

const DEFAULT_STORYBOOK_URL_ENV = 'STORYBOOK_URL';
const DEFAULT_MDX_READY_ENV = 'STORYBOOK_MDX_READY';
const DEFAULT_TEST_READY_ENV = 'STORYBOOK_TEST_READY';

export function detectRealEnv(): RealAdapterEnv | null {
  const storybookUrl = process.env[DEFAULT_STORYBOOK_URL_ENV];
  if (!storybookUrl) return null;
  const mdxReady = process.env[DEFAULT_MDX_READY_ENV] === '1';
  const storybookTestReady = process.env[DEFAULT_TEST_READY_ENV] === '1';
  // Both gates must be satisfied for the real adapter to attempt any op.
  if (!mdxReady || !storybookTestReady) return null;
  return { storybookUrl, mdxReady, storybookTestReady };
}

/**
 * Distinguished error emitted when the real adapter is asked to run without
 * the required environment. Callers should catch it and let the fidelity
 * harness record the divergence rather than aborting the whole suite.
 */
export class SkippedError extends Error {
  override readonly name = 'SkippedError';
  readonly code = 'STORYBOOK_MDX_REAL_ENV_MISSING';
  constructor(op: string) {
    super(
      `SkippedError: cannot execute ${op} because STORYBOOK_URL / STORYBOOK_MDX_READY / STORYBOOK_TEST_READY are not all set (real Storybook preview + MDX + @storybook/test requires all 3 to gate correctly)`,
    );
  }
}

export function makeRealAdapter(): StorybookMdxAdapter {
  const env = detectRealEnv();
  if (!env) return makeSkippedRealAdapter();
  return makeConnectedRealAdapter(env);
}

function makeSkippedRealAdapter(): StorybookMdxAdapter {
  const trace: TraceEvent[] = [];
  function unsupported<T>(op: string): T {
    trace.push({ op, ok: false, errorKind: 'STORYBOOK_MDX_REAL_ENV_MISSING' });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    registerAll: async () => unsupported<StoryDescriptor[]>('registerAll'),
    listStories: async () => unsupported<StoryDescriptor[]>('listStories'),
    resolveArgs: async () => unsupported<ResolvedArgs>('resolveArgs'),
    mount: async () => unsupported<StoryMountSnapshot>('mount'),
    renderMdx: async () => unsupported<MdxRenderReport>('renderMdx'),
    runInteraction: async () => unsupported<InteractionRunReport>('runInteraction'),
    runA11y: async () => unsupported<A11yReport>('runA11y'),
    computeCoverage: async () => unsupported<CoverageReport>('computeCoverage'),
    metrics: () => ({
      latencySamplesMs: [],
      interactionInvocations: 0,
      a11yInvocations: 0,
      mountInvocations: 0,
      mdxRenderInvocations: 0,
      assertionsRun: 0,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}

function makeConnectedRealAdapter(env: RealAdapterEnv): StorybookMdxAdapter {
  // Real preview driving is intentionally a stub — the fidelity harness
  // treats it as if it were connected but never runs any op path. If a caller
  // sets both env gates in the future, this would negotiate the preview
  // channel + MDX renderer + interaction runner. For the v1.34-4 milestone
  // the connected shape is documented but never executed.
  const trace: TraceEvent[] = [];
  const metrics = {
    latencySamplesMs: [] as number[],
    interactionInvocations: 0,
    a11yInvocations: 0,
    mountInvocations: 0,
    mdxRenderInvocations: 0,
    assertionsRun: 0,
  };
  function stub<T>(op: string): T {
    // Even in the connected branch, the mock v1.34-4 milestone ships without
    // a live driver. Record a distinct trace so the fidelity harness records
    // this as "connected but not implemented" rather than "env missing".
    trace.push({
      op,
      ok: false,
      errorKind: 'STORYBOOK_MDX_REAL_NOT_IMPLEMENTED',
      detail: { storybookUrl: env.storybookUrl },
    });
    throw new SkippedError(op);
  }
  return {
    mode: 'real',
    traces: () => [...trace],
    registerAll: async () => stub<StoryDescriptor[]>('registerAll'),
    listStories: async () => stub<StoryDescriptor[]>('listStories'),
    resolveArgs: async () => stub<ResolvedArgs>('resolveArgs'),
    mount: async () => stub<StoryMountSnapshot>('mount'),
    renderMdx: async () => stub<MdxRenderReport>('renderMdx'),
    runInteraction: async () => stub<InteractionRunReport>('runInteraction'),
    runA11y: async () => stub<A11yReport>('runA11y'),
    computeCoverage: async () => stub<CoverageReport>('computeCoverage'),
    metrics: () => ({
      latencySamplesMs: [...metrics.latencySamplesMs],
      interactionInvocations: metrics.interactionInvocations,
      a11yInvocations: metrics.a11yInvocations,
      mountInvocations: metrics.mountInvocations,
      mdxRenderInvocations: metrics.mdxRenderInvocations,
      assertionsRun: metrics.assertionsRun,
    }),
    reset: async () => {
      trace.length = 0;
    },
  };
}
