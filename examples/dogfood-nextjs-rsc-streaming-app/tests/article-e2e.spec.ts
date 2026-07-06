/**
 * Article end-to-end fidelity spec (rsc-harness axis).
 *
 * Sub-Issue CAR-785 (v1.34-2) AC — the mock adapter drives a full RSC render
 * + Suspense boundary + streaming HTML chunk ceremony end to end and the
 * fidelity harness diffs the raw {@link TraceEvent} sequence across four
 * axes.
 *
 *  1. renderArticle begins an RSC render and each streamed chunk lands in
 *     order. The final HTML is the concatenation of the chunk buffer.
 *  2. A Suspense boundary captures a fallback marker before any data chunk
 *     lands. Downstream tests can compare the fallback shape across mock
 *     vs real by inspecting the trace detail.
 *  3. Streamed HTML chunk boundaries are observable — the trace records
 *     each chunk with its byte length so a flight-payload divergence
 *     surfaces as a size mismatch.
 *  4. completeArticle records the final chunk count + the assembled HTML
 *     so downstream release-gate rows can attribute chunk count drift to
 *     a specific route.
 *
 * The real adapter is exercised through the env-detect skeleton and every
 * op refuses with `KIWA_RSC_STREAMING_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link RscStreamingAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleArticleRequest,
  validateArticleRequest,
} from '../src/app/article/route.js';
import type { RscStreamingAdapter } from '../src/adapters/interface.js';

let mock: RscStreamingAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 7, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — RSC article render ceremony', () => {
  it('axis 1: renderArticle emits streamed chunks in order and reassembles the HTML', async () => {
    const result = await mock.renderArticle({
      routeId: '/articles/1',
      articleId: 'article-1',
    });
    expect(result.routeId).toBe('/articles/1');
    expect(result.articleId).toBe('article-1');
    expect(result.chunks.length).toBeGreaterThanOrEqual(4);
    expect(result.html).toBe(result.chunks.join(''));
  });

  it('axis 1: two distinct articleIds produce distinct chunk bodies', async () => {
    const a = await mock.renderArticle({
      routeId: '/articles/a',
      articleId: 'article-a',
    });
    const b = await mock.renderArticle({
      routeId: '/articles/b',
      articleId: 'article-b',
    });
    expect(a.html).not.toBe(b.html);
    expect(a.chunks[0]).not.toBe(b.chunks[0]);
  });

  it('axis 1: explicit chunks override the synthesized sequence', async () => {
    const result = await mock.renderArticle({
      routeId: '/articles/explicit',
      articleId: 'article-explicit',
      chunks: ['<div>', 'hello', '</div>'],
    });
    expect(result.chunks).toEqual(['<div>', 'hello', '</div>']);
    expect(result.html).toBe('<div>hello</div>');
  });

  it('axis 2: Suspense boundary captures a fallback marker before any chunk lands', async () => {
    const result = await mock.renderArticle({
      routeId: '/articles/2',
      articleId: 'article-2',
      suspenseFallback: '<template data-fallback="skeleton"></template>',
    });
    expect(result.suspenseFallback).toBe('<template data-fallback="skeleton"></template>');
    const traces = mock.traces();
    const suspense = traces.find((t) => t.op === 'enterSuspense');
    expect(suspense).toBeDefined();
    expect(suspense?.ok).toBe(true);
    const suspenseIdx = traces.findIndex((t) => t.op === 'enterSuspense');
    const firstChunkIdx = traces.findIndex((t) => t.op === 'streamChunk');
    expect(suspenseIdx).toBeGreaterThanOrEqual(0);
    expect(firstChunkIdx).toBeGreaterThan(suspenseIdx);
  });

  it('axis 2: default fallback carries the route id so multi-route regressions surface', async () => {
    const result = await mock.renderArticle({
      routeId: '/articles/route-tag',
      articleId: 'tagged',
    });
    expect(result.suspenseFallback).toContain('/articles/route-tag');
  });

  it('axis 3: streamChunk trace records byte length per chunk', async () => {
    await mock.renderArticle({
      routeId: '/articles/3',
      articleId: 'article-3',
      chunks: ['<a>', '<b>bb</b>'],
    });
    const chunks = mock.traces().filter((t) => t.op === 'streamChunk');
    expect(chunks).toHaveLength(2);
    expect((chunks[0]?.detail as { bytes?: number })?.bytes).toBe(3);
    expect((chunks[1]?.detail as { bytes?: number })?.bytes).toBe(9);
  });

  it('axis 3: empty chunk arrays fall back to the synthesized 4-chunk sequence', async () => {
    const result = await mock.renderArticle({
      routeId: '/articles/empty',
      articleId: 'article-empty',
      chunks: [],
    });
    // An explicit empty array is treated as "no override" so the mock still
    // produces a full 4-chunk render. Real Next.js would refuse to stream a
    // zero-chunk RSC response, so this mirrors the production behaviour.
    expect(result.chunks.length).toBeGreaterThanOrEqual(4);
  });

  it('axis 4: completeArticle records the final chunk count', async () => {
    await mock.renderArticle({
      routeId: '/articles/4',
      articleId: 'article-4',
      chunks: ['x', 'y', 'z'],
    });
    const complete = mock.traces().find((t) => t.op === 'completeArticle');
    expect(complete?.ok).toBe(true);
    expect((complete?.detail as { chunkCount?: number })?.chunkCount).toBe(3);
  });

  it('axis 4: metrics.articlesRendered increments monotonically', async () => {
    expect(mock.metrics().articlesRendered).toBe(0);
    await mock.renderArticle({ routeId: '/1', articleId: 'a' });
    expect(mock.metrics().articlesRendered).toBe(1);
    await mock.renderArticle({ routeId: '/2', articleId: 'b' });
    expect(mock.metrics().articlesRendered).toBe(2);
  });

  it('axis 4: articleLatencySamplesMs records one sample per render', async () => {
    await mock.renderArticle({ routeId: '/1', articleId: 'a' });
    await mock.renderArticle({ routeId: '/2', articleId: 'b' });
    expect(mock.metrics().articleLatencySamplesMs).toHaveLength(2);
    for (const sample of mock.metrics().articleLatencySamplesMs) {
      expect(sample).toBeGreaterThanOrEqual(0);
    }
  });

  it('rejects empty routeId', async () => {
    await expect(
      mock.renderArticle({ routeId: '', articleId: 'a' }),
    ).rejects.toThrow(/routeId/);
  });

  it('rejects empty articleId', async () => {
    await expect(
      mock.renderArticle({ routeId: '/', articleId: '' }),
    ).rejects.toThrow(/articleId/);
  });
});

describe('article route handler — request validation', () => {
  it('accepts a valid render request', () => {
    const result = validateArticleRequest({
      kind: 'render',
      routeId: '/articles/1',
      articleId: 'a',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const result = validateArticleRequest('not-an-object');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('rejects a missing routeId', () => {
    const result = validateArticleRequest({ kind: 'render', articleId: 'a' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('routeId_required');
  });

  it('rejects a missing articleId', () => {
    const result = validateArticleRequest({ kind: 'render', routeId: '/x' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('articleId_required');
  });

  it('rejects an unknown kind', () => {
    const result = validateArticleRequest({
      kind: 'query',
      routeId: '/x',
      articleId: 'a',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_render');
  });

  it('handleArticleRequest returns hasFallback:true when a suspense fallback lands', async () => {
    const parsed = validateArticleRequest({
      kind: 'render',
      routeId: '/articles/handler',
      articleId: 'h',
      suspenseFallback: '<span>loading…</span>',
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw new Error('unreachable');
    const response = await handleArticleRequest(mock, parsed.value);
    expect(response.ok).toBe(true);
    expect(response.chunkCount).toBeGreaterThanOrEqual(4);
    expect(response.hasFallback).toBe(true);
  });

  it('handleArticleRequest surfaces mock errors as ok:false', async () => {
    const parsed = validateArticleRequest({
      kind: 'render',
      routeId: '/x',
      articleId: 'a',
    });
    if (!parsed.ok) throw new Error('unreachable');
    // Simulate an adapter that throws by using an empty-routeId trick — the
    // request validator would already reject the empty string, so we build
    // the request object directly.
    const response = await handleArticleRequest(mock, {
      kind: 'render',
      routeId: '',
      articleId: '',
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBeDefined();
  });
});

describe('real adapter — env-detect skeleton', () => {
  it('detectRealEnvMissing returns a reason string when RSC_STREAMING_BROWSER_READY is unset', () => {
    const previous = process.env['RSC_STREAMING_BROWSER_READY'];
    delete process.env['RSC_STREAMING_BROWSER_READY'];
    try {
      expect(detectRealEnvMissing()).toMatch(/ENV_MISSING|KIWA_MODE=mock/);
    } finally {
      if (previous !== undefined) process.env['RSC_STREAMING_BROWSER_READY'] = previous;
    }
  });

  it('renderArticle throws with KIWA_RSC_STREAMING_ENV_MISSING when env is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.renderArticle({ routeId: '/x', articleId: 'a' }),
    ).rejects.toThrow(/KIWA_RSC_STREAMING_ENV_MISSING|KIWA_MODE=mock/);
    const trace = real.traces().find((t) => t.op === 'renderArticle');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toMatch(/ENV_MISSING|KIWA_MODE=mock/);
  });
});
