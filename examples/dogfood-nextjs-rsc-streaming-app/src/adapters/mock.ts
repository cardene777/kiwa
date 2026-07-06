/**
 * Mock adapter — drives `@kiwa-test/component` v0.3 rsc-harness + streaming-
 * ssr + view-transitions + form-action-advanced semantics helpers so the
 * same app code exercises a deterministic RSC + streaming SSR + view
 * transitions ceremony without launching Chromium. Both mock and real
 * adapters satisfy {@link RscStreamingAdapter}, so the fidelity harness can
 * diff them side-by-side.
 *
 * State model — one route/component session per (routeId, articleId /
 * catalogId / transitionId / formId) tuple; each session is isolated so
 * per-surface metrics stay separated. That matches how Next.js 15.4 + React
 * 19.1 allocate one RSC render pass per request in production.
 *
 * The mock intentionally piggy-backs on the same neutral event vocabulary
 * that the parent v1.34-1 semantics packages emit — every op appends the
 * matching neutral event into the trace so the fidelity harness can
 * assert the mock and real adapters produce identical event orderings.
 */

import {
  applyOptimisticUpdate,
  beginRscRender,
  captureErrorBoundary,
  completeRscRender,
  completeSelectiveHydration,
  enableProgressiveEnhancement,
  enterSuspenseBoundary,
  finishElementTransition,
  markFormStatusPending,
  markSuspensePending,
  rejectFormAction,
  resolveFormAction,
  startElementTransition,
  startDocumentTransition,
  startFormActionSession,
  startProgressiveHydration,
  startRscHarness,
  startStreamingSsr,
  startViewTransitionSession,
  streamHtmlChunk,
  assertAnimation as assertViewAnimation,
} from '@kiwa-test/component';
import type {
  RenderArticleResult,
  RscStreamingAdapter,
  RunTransitionResult,
  StreamCatalogResult,
  SubmitFormActionResult,
  TraceEvent,
} from './interface.js';

export interface MakeMockAdapterOptions {
  /** deterministic seed used to synthesize chunk bodies; default 1. */
  seed?: number;
  /** artificial latency injected into every mock op (ms、 default 1). */
  latencyMs?: number;
  /** ComponentTarget used by the semantics helpers; default 'playwright-ct'. */
  target?: 'storybook8' | 'playwright-ct' | 'chromatic';
}

const DEFAULT_TARGET = 'playwright-ct' as const;

export function makeMockAdapter(opts: MakeMockAdapterOptions = {}): RscStreamingAdapter {
  const trace: TraceEvent[] = [];
  const target = opts.target ?? DEFAULT_TARGET;
  const latency = Math.max(opts.latencyMs ?? 1, 0);

  let articlesRendered = 0;
  let catalogsStreamed = 0;
  let transitionsRun = 0;
  let formsSubmitted = 0;
  let boundariesHydrated = 0;
  let errorsCaptured = 0;
  let optimisticApplied = 0;
  let formsResolved = 0;
  let formsRejected = 0;
  const articleLatencySamplesMs: number[] = [];
  const catalogLatencySamplesMs: number[] = [];
  const transitionLatencySamplesMs: number[] = [];
  const formLatencySamplesMs: number[] = [];
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

    async renderArticle(input): Promise<RenderArticleResult> {
      requests += 1;
      const start = Date.now();
      try {
        if (!input.routeId) throw new Error('routeId must not be empty');
        if (!input.articleId) throw new Error('articleId must not be empty');
        const seedChunks =
          input.chunks && input.chunks.length > 0
            ? input.chunks
            : synthesizeArticleChunks(input.articleId, opts.seed ?? 1);
        const session = startRscHarness({
          target,
          componentId: input.articleId,
          suspenseFallback:
            input.suspenseFallback ?? `<template data-suspense="pending" data-route="${input.routeId}"></template>`,
        });
        beginRscRender(session);
        record('renderArticle', true, { detail: { articleId: input.articleId, chunkCount: seedChunks.length } });

        // A Suspense boundary streams the fallback first so the real Next.js
        // runtime can paint a skeleton before the async data settles. The
        // mock mirrors that behaviour so downstream tests can assert the
        // fallback shows up in the chunk log.
        enterSuspenseBoundary(session);
        record('enterSuspense', true, { detail: { fallback: session.suspenseFallback ?? '' } });

        for (const chunk of seedChunks) {
          streamHtmlChunk(session, chunk);
          record('streamChunk', true, { detail: { bytes: chunk.length } });
        }

        completeRscRender(session);
        const latencyMs = await tick();
        articlesRendered += 1;
        articleLatencySamplesMs.push(latencyMs);
        record('completeArticle', true, { detail: { chunkCount: session.chunks.length } });
        return {
          routeId: input.routeId,
          articleId: input.articleId,
          chunks: [...session.chunks],
          suspenseFallback: session.suspenseFallback,
          html: session.chunks.join(''),
          latencyMs: latencyMs + (Date.now() - start),
        };
      } catch (err) {
        record('renderArticle', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async streamCatalog(input): Promise<StreamCatalogResult> {
      requests += 1;
      const start = Date.now();
      try {
        if (!input.routeId) throw new Error('routeId must not be empty');
        if (!input.catalogId) throw new Error('catalogId must not be empty');
        if (input.boundaries.length === 0) throw new Error('boundaries must not be empty');
        const session = startStreamingSsr({ target, routeId: input.routeId });
        record('startCatalog', true, {
          detail: { catalogId: input.catalogId, boundaryCount: input.boundaries.length },
        });

        for (const boundaryId of input.boundaries) {
          markSuspensePending(session, boundaryId);
          record('pendCatalogBoundary', true, { detail: { boundaryId } });
        }

        for (const err of input.errors ?? []) {
          captureErrorBoundary(session, {
            boundaryId: err.boundaryId,
            error: err.message,
            recoverable: err.recoverable ?? true,
          });
          errorsCaptured += 1;
          record('captureCatalogError', true, {
            detail: { boundaryId: err.boundaryId, recoverable: err.recoverable ?? true },
          });
        }

        for (const boundaryId of input.boundaries) {
          // captureErrorBoundary with recoverable:false clears the boundary
          // from the pending set — those cannot be hydrated because their
          // subtree never resolved. The mock mirrors that so tests can assert
          // the harness does not accidentally hydrate a failed boundary.
          if (!session.pendingBoundaries.has(boundaryId)) continue;
          startProgressiveHydration(session, boundaryId);
          completeSelectiveHydration(session, boundaryId);
          boundariesHydrated += 1;
          record('hydrateCatalogBoundary', true, { detail: { boundaryId } });
        }

        const latencyMs = await tick();
        catalogsStreamed += 1;
        catalogLatencySamplesMs.push(latencyMs);
        return {
          routeId: input.routeId,
          catalogId: input.catalogId,
          pendingBoundaries: [...session.pendingBoundaries],
          hydratedBoundaries: [...session.hydratedBoundaries],
          errors: [...session.errors],
          latencyMs: latencyMs + (Date.now() - start),
        };
      } catch (err) {
        record('startCatalog', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async runTransition(input): Promise<RunTransitionResult> {
      requests += 1;
      const start = Date.now();
      try {
        if (!input.transitionId) throw new Error('transitionId must not be empty');
        const session = startViewTransitionSession({
          target,
          transitionId: input.transitionId,
        });

        for (const element of input.elements ?? []) {
          startElementTransition(session, element);
          record('startTransition', true, { detail: { kind: 'element', elementId: element.elementId } });
        }
        if (input.documentTransition) {
          startDocumentTransition(session, input.documentTransition);
          record('startTransition', true, {
            detail: { kind: 'document', name: input.documentTransition.name },
          });
        }

        for (const element of input.elements ?? []) {
          finishElementTransition(session, element.elementId);
          record('finishTransition', true, { detail: { elementId: element.elementId } });
        }

        for (const animation of input.animations ?? []) {
          assertViewAnimation(session, animation);
          record('assertAnimation', true, {
            detail: { assertionId: animation.assertionId, durationMs: animation.durationMs },
          });
        }

        const latencyMs = await tick();
        transitionsRun += 1;
        transitionLatencySamplesMs.push(latencyMs);
        return {
          transitionId: session.transitionId,
          elements: [...session.activeElements],
          documentTransition: session.documentTransition,
          assertions: [...session.assertions],
          latencyMs: latencyMs + (Date.now() - start),
        };
      } catch (err) {
        record('startTransition', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    async submitFormAction(input): Promise<SubmitFormActionResult> {
      requests += 1;
      const start = Date.now();
      try {
        if (!input.formId) throw new Error('formId must not be empty');
        if (!input.submitter) throw new Error('submitter must not be empty');
        const session = startFormActionSession({
          target,
          formId: input.formId,
          initial: input.initial,
        });
        markFormStatusPending(session, input.submitter);
        record('markFormPending', true, { detail: { formId: input.formId, submitter: input.submitter } });

        let didApplyOptimistic = false;
        if (input.optimistic) {
          applyOptimisticUpdate(session, input.optimistic);
          optimisticApplied += 1;
          didApplyOptimistic = true;
          record('applyOptimistic', true, {
            detail: { patchKeys: Object.keys(input.optimistic).join(',') },
          });
        }

        if (input.enhance) {
          enableProgressiveEnhancement(session, input.enhance);
          record('enhanceForm', true, {
            detail: { actionUrl: input.enhance.actionUrl, method: input.enhance.method ?? 'post' },
          });
        }

        let resolved = false;
        if (input.rejectWith) {
          rejectFormAction(session, input.rejectWith);
          formsRejected += 1;
          record('resolveForm', true, {
            detail: { rejected: true, reason: input.rejectWith },
          });
        } else {
          resolveFormAction(session, input.resolveWith ?? {});
          formsResolved += 1;
          resolved = true;
          record('resolveForm', true, {
            detail: { resolvedKeys: Object.keys(input.resolveWith ?? {}).join(',') },
          });
        }

        const latencyMs = await tick();
        formsSubmitted += 1;
        formLatencySamplesMs.push(latencyMs);
        return {
          formId: input.formId,
          submitter: input.submitter,
          enhanced: session.enhanced,
          optimisticApplied: didApplyOptimistic,
          resolved,
          latencyMs: latencyMs + (Date.now() - start),
        };
      } catch (err) {
        record('markFormPending', false, { errorKind: coerceErrorKind(err) });
        throw err;
      }
    },

    metrics() {
      return {
        articlesRendered,
        catalogsStreamed,
        transitionsRun,
        formsSubmitted,
        boundariesHydrated,
        errorsCaptured,
        optimisticApplied,
        formsResolved,
        formsRejected,
        articleLatencySamplesMs: [...articleLatencySamplesMs],
        catalogLatencySamplesMs: [...catalogLatencySamplesMs],
        transitionLatencySamplesMs: [...transitionLatencySamplesMs],
        formLatencySamplesMs: [...formLatencySamplesMs],
        requests,
      };
    },

    async reset(): Promise<void> {
      trace.length = 0;
      articlesRendered = 0;
      catalogsStreamed = 0;
      transitionsRun = 0;
      formsSubmitted = 0;
      boundariesHydrated = 0;
      errorsCaptured = 0;
      optimisticApplied = 0;
      formsResolved = 0;
      formsRejected = 0;
      articleLatencySamplesMs.length = 0;
      catalogLatencySamplesMs.length = 0;
      transitionLatencySamplesMs.length = 0;
      formLatencySamplesMs.length = 0;
      requests = 0;
      record('reset', true);
    },
  };
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message.split(':')[0] ?? err.message;
  return 'unknown_error';
}

/**
 * Synthesize a deterministic 4-chunk RSC HTML sequence for an article. Real
 * Next.js emits a mix of `<!--$-->` markers + inline `<script>` bootstraps
 * around the streamed HTML; the mock keeps the shape recognizable without
 * trying to reproduce Flight bytes verbatim, which is out of scope for the
 * kiwa harness (see `packages/nextjs/src/render-server-component.ts` § out
 * of scope).
 */
function synthesizeArticleChunks(articleId: string, seed: number): string[] {
  const salt = ((seed & 0xffff) ^ hashString(articleId)).toString(16);
  return [
    `<article data-article="${articleId}" data-salt="${salt}">`,
    `<header><h1>${articleId}</h1></header>`,
    `<section data-boundary="body">${articleId} body chunk ${salt}</section>`,
    `</article>`,
  ];
}

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h & 0x7fffffff;
}
