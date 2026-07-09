/**
 * Mock adapter — drives `@kiwa-lab/component` v0.3 form-action-advanced
 * semantics helpers + `@kiwa-lab/nextjs` v1.2 server-action-advanced
 * semantics so the same app code exercises a deterministic Server Action +
 * form action + optimistic UI + revalidation + redirect ceremony without
 * launching Chromium. Both mock and real adapters satisfy
 * {@link ServerActionAdapter}, so the fidelity harness can diff them side-by-
 * side.
 *
 * State model — one session per (routeId, actionId / formId) tuple; each
 * session is isolated so per-surface metrics stay separated. That matches
 * how Next.js 15.4 + React 19.1 allocate one server action pass per form
 * submission in production.
 *
 * The mock intentionally piggy-backs on the same neutral event vocabulary
 * that the parent v1.34-1 semantics packages emit — every op appends the
 * matching neutral event into the trace so the fidelity harness can
 * assert the mock and real adapters produce identical event orderings.
 */

import {
  applyOptimisticUpdate,
  enableProgressiveEnhancement,
  markFormStatusPending,
  rejectFormAction,
  resolveFormAction,
  startFormActionSession,
} from '@kiwa-lab/component';
import {
  redirectAction,
  revalidateActionPath,
  revalidateActionTag,
  startServerActionAdvanced,
  submitFormAction as submitServerAction,
} from '@kiwa-lab/nextjs';
import type {
  RunLikeResult,
  RunLoginResult,
  ServerActionAdapter,
  SubmitSubscribeResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
  /** ComponentTarget used by the form-action-advanced semantics helpers; default 'playwright-ct'. */
  target?: 'storybook8' | 'playwright-ct' | 'chromatic';
  /** NextTarget used by the server-action-advanced semantics helpers; default 'app-router'. */
  nextTarget?: 'app-router' | 'pages-router' | 'edge-runtime';
}

const DEFAULT_TARGET = 'playwright-ct' as const;
const DEFAULT_NEXT_TARGET = 'app-router' as const;

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): ServerActionAdapter {
  const trace: TraceEvent[] = [];
  const target = opts.target ?? DEFAULT_TARGET;
  const nextTarget = opts.nextTarget ?? DEFAULT_NEXT_TARGET;
  const latency = Math.max(opts.latencyMs ?? 1, 0);

  let subscribesSubmitted = 0;
  let likesSubmitted = 0;
  let loginsSubmitted = 0;
  let pathRevalidations = 0;
  let tagRevalidations = 0;
  let redirects = 0;
  let optimisticApplied = 0;
  let formsResolved = 0;
  let formsRejected = 0;
  let progressiveEnhancements = 0;
  const subscribeLatencySamplesMs: number[] = [];
  const likeLatencySamplesMs: number[] = [];
  const loginLatencySamplesMs: number[] = [];
  let requests = 0;

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  async function tick(): Promise<number> {
    if (latency === 0) return 0;
    await new Promise<void>((resolve) => setTimeout(resolve, latency));
    return latency;
  }

  return {
    mode: 'mock',
    traces: () => [...trace],

    async submitSubscribe(input): Promise<SubmitSubscribeResult> {
      requests += 1;
      const start = Date.now();
      try {
        if (!input.routeId) throw new Error('routeId must not be empty');
        if (!input.actionId) throw new Error('actionId must not be empty');
        if (!input.revalidatePath) throw new Error('revalidatePath must not be empty');
        if (!input.revalidatePath.startsWith('/')) {
          throw new Error('revalidatePath must start with /');
        }
        const session = startServerActionAdvanced({
          target: nextTarget,
          actionId: input.actionId,
        });
        record('startSubscribe', true, {
          detail: { actionId: input.actionId, routeId: input.routeId },
        });

        submitServerAction(session, input.form);
        record('submitSubscribe', true, {
          detail: { fieldCount: Object.keys(input.form).length },
        });

        revalidateActionPath(session, input.revalidatePath);
        pathRevalidations += 1;
        record('revalidateSubscribePath', true, {
          detail: { path: input.revalidatePath },
        });

        const latencyMs = await tick();
        subscribesSubmitted += 1;
        subscribeLatencySamplesMs.push(latencyMs);
        return {
          routeId: input.routeId,
          actionId: input.actionId,
          form: { ...session.form },
          revalidatedPaths: [...session.revalidatedPaths],
          submitted: true,
          latencyMs: latencyMs + (Date.now() - start),
        };
      } catch (err) {
        record('submitSubscribe', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async runLike(input): Promise<RunLikeResult> {
      requests += 1;
      const start = Date.now();
      try {
        if (!input.routeId) throw new Error('routeId must not be empty');
        if (!input.actionId) throw new Error('actionId must not be empty');
        if (!input.formId) throw new Error('formId must not be empty');
        if (!input.targetId) throw new Error('targetId must not be empty');
        if (!input.revalidateTag) throw new Error('revalidateTag must not be empty');

        const formSession = startFormActionSession({
          target,
          formId: input.formId,
          initial: input.initial,
        });
        record('startLike', true, {
          detail: { formId: input.formId, targetId: input.targetId },
        });

        markFormStatusPending(formSession, input.submitter);
        record('markLikePending', true, {
          detail: { submitter: input.submitter },
        });

        let didApplyOptimistic = false;
        if (input.optimistic) {
          applyOptimisticUpdate(formSession, input.optimistic);
          optimisticApplied += 1;
          didApplyOptimistic = true;
          record('applyOptimisticLike', true, {
            detail: { patchKeys: Object.keys(input.optimistic).join(',') },
          });
        }

        const actionSession = startServerActionAdvanced({
          target: nextTarget,
          actionId: input.actionId,
        });
        submitServerAction(actionSession, { targetId: input.targetId });
        record('submitLike', true, {
          detail: { targetId: input.targetId },
        });

        revalidateActionTag(actionSession, input.revalidateTag);
        tagRevalidations += 1;
        record('revalidateLikeTag', true, {
          detail: { tag: input.revalidateTag },
        });

        let resolved = false;
        let rejected = false;
        if (input.rejectWith) {
          rejectFormAction(formSession, input.rejectWith);
          formsRejected += 1;
          rejected = true;
          record('resolveLike', true, {
            detail: { rejected: true, reason: input.rejectWith },
          });
        } else {
          resolveFormAction(formSession, input.resolveWith ?? {});
          formsResolved += 1;
          resolved = true;
          record('resolveLike', true, {
            detail: { resolvedKeys: Object.keys(input.resolveWith ?? {}).join(',') },
          });
        }

        const latencyMs = await tick();
        likesSubmitted += 1;
        likeLatencySamplesMs.push(latencyMs);
        return {
          routeId: input.routeId,
          actionId: input.actionId,
          formId: input.formId,
          optimisticApplied: didApplyOptimistic,
          revalidatedTags: [...actionSession.revalidatedTags],
          resolved,
          rejected,
          latencyMs: latencyMs + (Date.now() - start),
        };
      } catch (err) {
        record('submitLike', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async runLogin(input): Promise<RunLoginResult> {
      requests += 1;
      const start = Date.now();
      try {
        if (!input.routeId) throw new Error('routeId must not be empty');
        if (!input.actionId) throw new Error('actionId must not be empty');
        if (!input.formId) throw new Error('formId must not be empty');

        const formSession = startFormActionSession({
          target,
          formId: input.formId,
          initial: input.credentials,
        });
        record('startLogin', true, {
          detail: { formId: input.formId, routeId: input.routeId },
        });

        if (input.enhance) {
          enableProgressiveEnhancement(formSession, input.enhance);
          progressiveEnhancements += 1;
          record('enhanceLogin', true, {
            detail: {
              actionUrl: input.enhance.actionUrl,
              method: input.enhance.method ?? 'post',
            },
          });
        }

        markFormStatusPending(formSession, input.submitter);
        record('markLoginPending', true, {
          detail: { submitter: input.submitter },
        });

        const actionSession = startServerActionAdvanced({
          target: nextTarget,
          actionId: input.actionId,
        });
        submitServerAction(actionSession, input.credentials);
        record('submitLogin', true, {
          detail: { fieldCount: Object.keys(input.credentials).length },
        });

        let redirectUrl: string | null = null;
        if (input.rejectWith) {
          rejectFormAction(formSession, input.rejectWith);
          formsRejected += 1;
          record('resolveLogin', true, {
            detail: { rejected: true, reason: input.rejectWith },
          });
        } else {
          if (input.redirectTo) {
            redirectAction(actionSession, input.redirectTo);
            redirects += 1;
            redirectUrl = input.redirectTo;
            record('redirectLogin', true, {
              detail: { url: input.redirectTo },
            });
          }
          resolveFormAction(formSession, { redirected: redirectUrl !== null ? 'true' : 'false' });
          formsResolved += 1;
          record('resolveLogin', true, {
            detail: { redirected: redirectUrl !== null },
          });
        }

        const latencyMs = await tick();
        loginsSubmitted += 1;
        loginLatencySamplesMs.push(latencyMs);
        return {
          routeId: input.routeId,
          actionId: input.actionId,
          formId: input.formId,
          enhanced: formSession.enhanced,
          redirectUrl,
          submitted: true,
          latencyMs: latencyMs + (Date.now() - start),
        };
      } catch (err) {
        record('submitLogin', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    metrics() {
      return {
        subscribesSubmitted,
        likesSubmitted,
        loginsSubmitted,
        pathRevalidations,
        tagRevalidations,
        redirects,
        optimisticApplied,
        formsResolved,
        formsRejected,
        progressiveEnhancements,
        subscribeLatencySamplesMs: [...subscribeLatencySamplesMs],
        likeLatencySamplesMs: [...likeLatencySamplesMs],
        loginLatencySamplesMs: [...loginLatencySamplesMs],
        requests,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      subscribesSubmitted = 0;
      likesSubmitted = 0;
      loginsSubmitted = 0;
      pathRevalidations = 0;
      tagRevalidations = 0;
      redirects = 0;
      optimisticApplied = 0;
      formsResolved = 0;
      formsRejected = 0;
      progressiveEnhancements = 0;
      subscribeLatencySamplesMs.length = 0;
      likeLatencySamplesMs.length = 0;
      loginLatencySamplesMs.length = 0;
      requests = 0;
      record('reset', true);
    },
  };
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message.split(':')[0] ?? err.message;
  return 'unknown_error';
}
