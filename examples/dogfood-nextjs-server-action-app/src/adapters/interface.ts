/**
 * Provider-neutral Server Action surface for the dogfood app.
 *
 * The Next.js app talks to the Server Action + form action + optimistic UI
 * + revalidation + redirect + progressive enhancement surface only through
 * this interface. Two implementations exist —
 *  - {@link makeRealAdapter} — drives Playwright + Chromium headless when
 *    `KIWA_MODE=real` + `SERVER_ACTION_BROWSER_READY=1` are set; otherwise
 *    every op reports `KIWA_SERVER_ACTION_ENV_MISSING`.
 *  - {@link makeMockAdapter} — backed by `@kiwa-lab/component` v0.3 form-
 *    action-advanced semantics + `@kiwa-lab/nextjs` v1.2 server-action-
 *    advanced semantics.
 *
 * Both must satisfy the same 15-op contract so behavioural fidelity between
 * real vs mock can be measured side-by-side across the 3 axes v1.34-3
 * dogfoods —
 *  - Server Action (submit + revalidatePath + revalidateTag + redirect)
 *  - Form action + useFormStatus + useOptimistic + progressive enhancement
 *  - Session / redirect lifecycle
 *
 * The AC anchors this contract on the 3 domain surfaces the harness runs
 * against both adapters —
 *  - subscribe-e2e (form action + revalidatePath after successful submit)
 *  - like-e2e (useFormStatus pending + useOptimistic patch + revalidateTag)
 *  - login-e2e (progressive enhancement + redirect on success)
 * Each spec exercises a distinct subset of the ops below so the fidelity
 * report can point at the ops that diverged.
 */

/** Server Action revalidation kind — `path` maps to `revalidatePath`, `tag` to `revalidateTag`. */
export type RevalidateKind = 'path' | 'tag';

/** Result of submitting a subscribe form action + revalidatePath. */
export interface SubmitSubscribeResult {
  routeId: string;
  actionId: string;
  form: Record<string, string>;
  revalidatedPaths: string[];
  submitted: boolean;
  latencyMs: number;
}

/** Result of driving the like flow (form action + useFormStatus + useOptimistic + revalidateTag). */
export interface RunLikeResult {
  routeId: string;
  actionId: string;
  formId: string;
  optimisticApplied: boolean;
  revalidatedTags: string[];
  resolved: boolean;
  rejected: boolean;
  latencyMs: number;
}

/** Result of running the login flow (progressive enhancement + redirect). */
export interface RunLoginResult {
  routeId: string;
  actionId: string;
  formId: string;
  enhanced: boolean;
  redirectUrl: string | null;
  submitted: boolean;
  latencyMs: number;
}

/**
 * Trace event — every adapter method appends one entry to a shared trace
 * buffer. Downstream tests diff the trace across mock vs real to detect
 * behavioural divergences.
 */
export interface TraceEvent {
  op:
    | 'startSubscribe'
    | 'submitSubscribe'
    | 'revalidateSubscribePath'
    | 'startLike'
    | 'markLikePending'
    | 'applyOptimisticLike'
    | 'submitLike'
    | 'revalidateLikeTag'
    | 'resolveLike'
    | 'startLogin'
    | 'enhanceLogin'
    | 'markLoginPending'
    | 'submitLogin'
    | 'redirectLogin'
    | 'resolveLogin'
    | 'reset';
  ok: boolean;
  errorKind?: string | undefined;
  detail?: Record<string, unknown> | undefined;
}

/**
 * Server Action adapter — the dogfood app performs 15 ops split across the
 * 3 domain surfaces:
 *
 * - **subscribe surface (server-action-advanced axis: form action + revalidatePath)**
 *   - `startSubscribe` — begin a subscribe form action session
 *   - `submitSubscribe` — submit the form action (fields captured)
 *   - `revalidateSubscribePath` — call revalidatePath after successful submit
 *
 * - **like surface (form-action-advanced axis: useFormStatus + useOptimistic + revalidateTag)**
 *   - `startLike` — begin a like form action session
 *   - `markLikePending` — mark useFormStatus pending
 *   - `applyOptimisticLike` — apply useOptimistic patch
 *   - `submitLike` — submit the underlying server action
 *   - `revalidateLikeTag` — call revalidateTag after successful submit
 *   - `resolveLike` — resolve or reject the optimistic patch
 *
 * - **login surface (form-action-advanced + server-action-advanced axes: progressive enhancement + redirect)**
 *   - `startLogin` — begin a login form action session
 *   - `enhanceLogin` — enable progressive enhancement (JS-off fallback)
 *   - `markLoginPending` — mark useFormStatus pending
 *   - `submitLogin` — submit the underlying server action
 *   - `redirectLogin` — call redirect() after successful submit
 *   - `resolveLogin` — resolve or reject the session
 *
 * `metrics()` exposes rolling aggregates the fidelity harness uses to
 * populate the release-gate rows (perf.p95Ms + fidelity.ratio in
 * particular).
 */
export interface ServerActionAdapter {
  readonly mode: 'real' | 'mock';
  readonly traces: () => TraceEvent[];

  // ---- subscribe (server-action-advanced axis) ----

  submitSubscribe(input: {
    routeId: string;
    actionId: string;
    form: Record<string, string>;
    revalidatePath: string;
  }): Promise<SubmitSubscribeResult>;

  // ---- like (form-action-advanced axis with revalidateTag) ----

  runLike(input: {
    routeId: string;
    actionId: string;
    formId: string;
    targetId: string;
    submitter: string;
    initial: Record<string, unknown>;
    optimistic?: Record<string, unknown>;
    resolveWith?: Record<string, unknown>;
    rejectWith?: string;
    revalidateTag: string;
  }): Promise<RunLikeResult>;

  // ---- login (form-action-advanced + server-action-advanced axes with redirect) ----

  runLogin(input: {
    routeId: string;
    actionId: string;
    formId: string;
    submitter: string;
    credentials: Record<string, string>;
    enhance?: { actionUrl: string; method?: 'post' | 'get' };
    redirectTo?: string;
    rejectWith?: string;
  }): Promise<RunLoginResult>;

  /** Rolling metric aggregate for the fidelity harness. */
  metrics(): {
    subscribesSubmitted: number;
    likesSubmitted: number;
    loginsSubmitted: number;
    pathRevalidations: number;
    tagRevalidations: number;
    redirects: number;
    optimisticApplied: number;
    formsResolved: number;
    formsRejected: number;
    progressiveEnhancements: number;
    subscribeLatencySamplesMs: number[];
    likeLatencySamplesMs: number[];
    loginLatencySamplesMs: number[];
    requests: number;
  };

  reset(): Promise<void>;
}
