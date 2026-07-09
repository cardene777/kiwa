/**
 * Provider-neutral RSC streaming surface for the dogfood app.
 *
 * The Next.js app talks to the RSC + streaming SSR + view transitions +
 * form action advanced surface only through this interface. Two
 * implementations exist —
 *  - {@link makeRealAdapter} — drives Playwright + Chromium headless when
 *    `KIWA_MODE=real` + `RSC_STREAMING_BROWSER_READY=1` are set; otherwise
 *    every op reports `KIWA_RSC_STREAMING_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/component` v0.3 rsc-
 *    harness + streaming-ssr + view-transitions + form-action-advanced
 *    semantics and `@kiwa-lab/nextjs` v1.2 `renderServerComponent` +
 *    `setupNextRscEnv` helpers.
 *
 * Both must satisfy the same 12-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 4 v1.34-1 axes
 * (rsc-harness / streaming-ssr / view-transitions / form-action-advanced)
 * that `@kiwa-lab/component` v0.3 + `@kiwa-lab/nextjs` v1.2 expose in
 * production.
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - article-e2e (RSC render + Suspense boundary + streaming HTML chunks)
 *  - catalog-e2e (streaming SSR + progressive / selective hydration + error
 *    boundary)
 *  - signaling-e2e (view transitions + form action advanced + optimistic
 *    update + progressive enhancement)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** RSC render mode — full render for hydrated leaves, streaming for suspense boundaries. */
export type RscRenderMode = 'full' | 'streaming';

/** Result of rendering a server component (article body / recommended list). */
export interface RenderArticleResult {
  routeId: string;
  articleId: string;
  chunks: string[];
  suspenseFallback: string | null;
  html: string;
  latencyMs: number;
}

/** Result of driving a streaming SSR round trip (catalog page). */
export interface StreamCatalogResult {
  routeId: string;
  catalogId: string;
  pendingBoundaries: string[];
  hydratedBoundaries: string[];
  errors: Array<{ boundaryId: string; message: string }>;
  latencyMs: number;
}

/** Result of running a view transition (signaling accept / room switch). */
export interface RunTransitionResult {
  transitionId: string;
  elements: string[];
  documentTransition: string | null;
  assertions: string[];
  latencyMs: number;
}

/** Result of submitting a form action (subscribe / vote / accept invite). */
export interface SubmitFormActionResult {
  formId: string;
  submitter: string;
  enhanced: boolean;
  optimisticApplied: boolean;
  resolved: boolean;
  latencyMs: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across mock vs real to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op:
    | 'renderArticle'
    | 'enterSuspense'
    | 'streamChunk'
    | 'completeArticle'
    | 'startCatalog'
    | 'pendCatalogBoundary'
    | 'captureCatalogError'
    | 'hydrateCatalogBoundary'
    | 'startTransition'
    | 'finishTransition'
    | 'assertAnimation'
    | 'markFormPending'
    | 'applyOptimistic'
    | 'enhanceForm'
    | 'resolveForm'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * RSC streaming adapter — the dogfood app performs 12 ops split across the
 * 3 domain surfaces:
 *
 * - **article surface (rsc-harness axis)**
 *   - `renderArticle` — begin RSC render, receive first HTML chunk
 *   - `enterSuspense` — mark a Suspense boundary + stream its fallback
 *   - `streamChunk` — stream one resolved HTML chunk into the response
 *   - `completeArticle` — finalize the render + assemble the full HTML
 *
 * - **catalog surface (streaming-ssr axis)**
 *   - `startCatalog` — begin streaming SSR for a catalog route
 *   - `pendCatalogBoundary` — mark a boundary as suspense-pending
 *   - `captureCatalogError` — capture an error boundary (recoverable or
 *     not)
 *   - `hydrateCatalogBoundary` — begin progressive hydration then complete
 *     selective hydration for the boundary
 *
 * - **signaling surface (view-transitions + form-action-advanced axes)**
 *   - `startTransition` — begin an element / document view transition
 *   - `finishTransition` — finish an active element transition
 *   - `assertAnimation` — assert a completed animation (duration / easing)
 *   - `markFormPending` — mark a form action pending
 *   - `applyOptimistic` — apply an optimistic patch to the form state
 *   - `enhanceForm` — enable progressive enhancement for the form
 *   - `resolveForm` — resolve or reject the form action
 *
 * `metrics()` exposes rolling aggregates the fidelity harness uses to
 * populate the release-gate rows (perf.p95Ms + fidelity.ratio in
 * particular).
 */
export interface RscStreamingAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  // ---- article (rsc-harness axis) ----

  renderArticle(input: {
    routeId: string;
    articleId: string;
    suspenseFallback?: string;
    mode?: RscRenderMode;
    chunks?: string[];
  }): Promise<RenderArticleResult>;

  // ---- catalog (streaming-ssr axis) ----

  streamCatalog(input: {
    routeId: string;
    catalogId: string;
    boundaries: string[];
    /** Optionally inject an error for one boundary (recoverable by default). */
    errors?: Array<{ boundaryId: string; message: string; recoverable?: boolean }>;
  }): Promise<StreamCatalogResult>;

  // ---- signaling (view-transitions + form-action-advanced axes) ----

  runTransition(input: {
    transitionId: string;
    elements?: Array<{ elementId: string; from: string; to: string }>;
    documentTransition?: { name: string; fromUrl: string; toUrl: string };
    animations?: Array<{ assertionId: string; durationMs: number; easing?: string }>;
  }): Promise<RunTransitionResult>;

  submitFormAction(input: {
    formId: string;
    submitter: string;
    initial: Record<string, unknown>;
    optimistic?: Record<string, unknown>;
    enhance?: { actionUrl: string; method?: 'post' | 'get' };
    resolveWith?: Record<string, unknown>;
    rejectWith?: string;
  }): Promise<SubmitFormActionResult>;

  /** Rolling metric aggregate for the fidelity harness. */
  metrics(): {
    articlesRendered: number;
    catalogsStreamed: number;
    transitionsRun: number;
    formsSubmitted: number;
    boundariesHydrated: number;
    errorsCaptured: number;
    optimisticApplied: number;
    formsResolved: number;
    formsRejected: number;
    articleLatencySamplesMs: number[];
    catalogLatencySamplesMs: number[];
    transitionLatencySamplesMs: number[];
    formLatencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
