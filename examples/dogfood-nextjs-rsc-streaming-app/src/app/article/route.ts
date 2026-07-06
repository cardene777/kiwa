/**
 * `/article` HTTP handler — RSC render + Suspense boundary + streaming HTML
 * chunk ops the Next.js runtime exposes to the article surface. The route
 * is intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise mock
 * and real without spinning up Next.js.
 *
 * The article surface pairs the parent v1.34-1 `rsc-harness` axis with
 * `renderServerComponent` from `@kiwa-test/nextjs` v1.2 — every op has a
 * neutral event counterpart the fidelity harness can compare across mock
 * vs real.
 */

import type { RscStreamingAdapter } from '../../adapters/interface.js';

export type ArticleOpKind = 'render';

export interface ArticleRequestBase {
  routeId: string;
  articleId: string;
}

export interface ArticleRenderRequest extends ArticleRequestBase {
  kind: 'render';
  suspenseFallback?: string;
  mode?: 'full' | 'streaming';
  /** Explicit chunks — when omitted, the mock synthesizes a 4-chunk sequence. */
  chunks?: string[];
}

export type ArticleRequest = ArticleRenderRequest;

export interface ArticleResponse {
  ok: boolean;
  kind: ArticleOpKind;
  routeId: string;
  articleId: string;
  chunkCount?: number;
  hasFallback?: boolean;
  errorKind?: string;
}

export function validateArticleRequest(
  body: unknown,
): { ok: true; value: ArticleRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['routeId'] !== 'string' || !b['routeId']) {
    return { ok: false, errorKind: 'routeId_required' };
  }
  if (typeof b['articleId'] !== 'string' || !b['articleId']) {
    return { ok: false, errorKind: 'articleId_required' };
  }
  if (b['kind'] !== 'render') {
    return { ok: false, errorKind: 'kind_must_be_render' };
  }
  const req: ArticleRenderRequest = {
    kind: 'render',
    routeId: b['routeId'],
    articleId: b['articleId'],
  };
  if (typeof b['suspenseFallback'] === 'string') {
    req.suspenseFallback = b['suspenseFallback'];
  }
  if (b['mode'] === 'full' || b['mode'] === 'streaming') {
    req.mode = b['mode'];
  }
  if (Array.isArray(b['chunks']) && b['chunks'].every((c) => typeof c === 'string')) {
    req.chunks = b['chunks'] as string[];
  }
  return { ok: true, value: req };
}

export async function handleArticleRequest(
  adapter: RscStreamingAdapter,
  req: ArticleRequest,
): Promise<ArticleResponse> {
  try {
    const input: Parameters<RscStreamingAdapter['renderArticle']>[0] = {
      routeId: req.routeId,
      articleId: req.articleId,
    };
    if (req.suspenseFallback !== undefined) input.suspenseFallback = req.suspenseFallback;
    if (req.mode !== undefined) input.mode = req.mode;
    if (req.chunks !== undefined) input.chunks = req.chunks;
    const result = await adapter.renderArticle(input);
    return {
      ok: true,
      kind: 'render',
      routeId: result.routeId,
      articleId: result.articleId,
      chunkCount: result.chunks.length,
      hasFallback: result.suspenseFallback !== null,
    };
  } catch (err) {
    return {
      ok: false,
      kind: 'render',
      routeId: req.routeId,
      articleId: req.articleId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
