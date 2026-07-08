/**
 * Provider-neutral Storybook 8 MDX adapter contract for the dogfood app.
 *
 * The app talks to Storybook 8 through this interface. Two implementations
 * exist — {@link makeRealAdapter} (drives a real Storybook 8 preview via
 * `STORYBOOK_URL` env + `STORYBOOK_MDX_READY=1` gate, else returns a
 * `skipped` adapter whose every method records
 * `STORYBOOK_MDX_REAL_ENV_MISSING`) and {@link makeMockAdapter} (backed by
 * `@kiwa/component` `createStoryRegistry` + in-process MdxRegistry +
 * InteractionRunner + CoverageReporter). Both satisfy the same contract so
 * behavioural fidelity between real vs mock can be measured side-by-side and
 * fed to `@kiwa/quality-metrics` 7-axis release gate.
 *
 * The 8 ops mirror the AC in Issue #1051 — story registration + args
 * resolution + mount + MDX render + interaction (click / type / assert) +
 * coverage report.
 *
 * v1.34-4 milestone (Issue #1051) 新設。 v1.16-2 の dogfood-storybook-design-
 * system を base に、 MDX + interaction test + coverage の 3 axis を追加。
 */

import type { A11yViolation, StoryMeta } from '@kiwa/component';

/** Registered story identifier (Storybook 8 SB URL param compatible). */
export interface StoryDescriptor {
  id: string;
  title: string;
  storyName: string;
  args: Record<string, unknown>;
  hasPlay: boolean;
  hasMdx: boolean;
}

/** Resolved-args snapshot after meta + story merge. */
export interface ResolvedArgs {
  storyId: string;
  args: Record<string, unknown>;
}

/** Mount + markup capture — used by story rendering / Chromatic hashing. */
export interface StoryMountSnapshot {
  storyId: string;
  markup: string;
  hash: string;
}

/**
 * MDX document — a Storybook 8 MDX doc combines 3 blocks. Prose paragraphs
 * (Markdown), inline component preview (StoryObj rendered inline), and code
 * samples (fenced code block). The adapter renders 1 MDX doc into an ordered
 * list of blocks so tests can assert the composition.
 */
export type MdxBlock =
  | { kind: 'prose'; text: string }
  | { kind: 'preview'; storyId: string; markup: string; hash: string }
  | { kind: 'code'; language: string; source: string };

export interface MdxRenderReport {
  docId: string;
  title: string;
  blocks: MdxBlock[];
}

/**
 * Interaction step — 1 entry per `interaction()` invocation. The mock records
 * the operation label + optional target locator + assertion outcome. Real
 * mode would mirror this from the `@storybook/test` runner traces.
 */
export interface InteractionStep {
  label: string;
  op: 'click' | 'type' | 'assert' | 'wait';
  target?: string | undefined;
  ok: boolean;
  detail?: Record<string, unknown> | undefined;
}

export interface InteractionRunReport {
  storyId: string;
  steps: InteractionStep[];
  ok: boolean;
  assertionsPassed: number;
  assertionsFailed: number;
}

/**
 * Story coverage report — every registered story is either `covered` (has
 * MDX doc + interaction step + a11y check) or `uncovered` (missing 1+). The
 * mock computes this from the in-memory state; real mode would fetch it from
 * a compiled coverage index.
 */
export interface CoverageEntry {
  storyId: string;
  hasMdx: boolean;
  hasInteraction: boolean;
  hasA11y: boolean;
  covered: boolean;
}

export interface CoverageReport {
  entries: CoverageEntry[];
  totalStories: number;
  coveredStories: number;
  coveragePct: number;
}

/** A11y run report — reused from v1.16-2. */
export interface A11yReport {
  storyId: string;
  violations: A11yViolation[];
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across the two adapters to detect
 * behavioural divergences (fidelity harness input).
 */
export interface TraceEvent {
  op: string;
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * MDX descriptor registered alongside a story. `content` holds an ordered
 * sequence of authored blocks the MDX renderer will assemble at render time.
 */
export interface MdxAuthoredBlock {
  kind: 'prose' | 'preview' | 'code';
  /** For `prose` = the paragraph text. */
  text?: string;
  /** For `preview` = story name to mount + inline. */
  storyName?: string;
  /** For `code` = language hint. */
  language?: string;
  /** For `code` = the code source string. */
  source?: string;
}

export interface MdxDoc {
  docId: string;
  /** Doc display title (e.g. "Button"). */
  title: string;
  /**
   * The `StoryMeta.title` this doc previews (e.g. "DesignSystem/Button").
   * `renderMdx` uses this to look up the story via `reg.mount(storyTitle, storyName)`.
   */
  storyTitle: string;
  /** Story ids this doc previews (used by CoverageReporter for MDX coverage). */
  associatedStoryIds: string[];
  blocks: MdxAuthoredBlock[];
}

/**
 * Provider-neutral story-driver contract. Every method emits at least one
 * trace event so the fidelity harness has a shape to diff.
 */
export interface StorybookMdxAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  /** Bulk-register all metas + MDX docs into the registry. */
  registerAll(
    metas: ReadonlyArray<StoryMeta<Record<string, unknown>>>,
    docs: ReadonlyArray<MdxDoc>,
  ): Promise<StoryDescriptor[]>;

  /** List every registered story descriptor. */
  listStories(): Promise<StoryDescriptor[]>;

  /** Resolve args for 1 story — CSF3 merge semantics. */
  resolveArgs(title: string, storyName: string): Promise<ResolvedArgs>;

  /** Mount 1 story and return a markup snapshot. */
  mount(
    title: string,
    storyName: string,
    overrideArgs?: Record<string, unknown>,
  ): Promise<StoryMountSnapshot>;

  /** Render 1 MDX doc into an ordered block list. */
  renderMdx(docId: string): Promise<MdxRenderReport>;

  /** Run the @storybook/test interaction for 1 story. */
  runInteraction(title: string, storyName: string): Promise<InteractionRunReport>;

  /** Run the a11y checker for 1 story. */
  runA11y(title: string, storyName: string): Promise<A11yReport>;

  /** Compute the story coverage report. */
  computeCoverage(): Promise<CoverageReport>;

  /** Rolling metric aggregate seen since construction / last reset. */
  metrics(): {
    latencySamplesMs: number[];
    interactionInvocations: number;
    a11yInvocations: number;
    mountInvocations: number;
    mdxRenderInvocations: number;
    assertionsRun: number;
  };

  reset(): Promise<void>;
}
