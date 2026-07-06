/**
 * Like end-to-end fidelity spec (form-action-advanced axis: useFormStatus
 * + useOptimistic + revalidateTag).
 *
 * Sub-Issue CAR-786 (v1.34-3) AC — the mock adapter drives a full form
 * action + optimistic UI + revalidateTag ceremony end to end and the
 * fidelity harness diffs the raw {@link TraceEvent} sequence across four
 * axes.
 *
 *  1. markLikePending transitions the form action session to pending
 *     (useFormStatus). Trace records the submitter.
 *  2. applyOptimisticLike appends an optimistic patch (useOptimistic) and
 *     merges it into the form state.
 *  3. revalidateLikeTag transitions the server-action session to
 *     tag-revalidated and records the tag in the trace detail.
 *  4. resolveLike terminates the session (resolved or rejected).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  handleLikeRequest,
  validateLikeRequest,
} from '../src/app/like/route.js';
import type { ServerActionAdapter } from '../src/adapters/interface.js';

let mock: ServerActionAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — like form action + useOptimistic + revalidateTag', () => {
  it('axis 1: markLikePending records the submitter in the trace', async () => {
    await mock.runLike({
      routeId: '/like',
      actionId: 'like-a1',
      formId: 'like-form-1',
      targetId: 'post-1',
      submitter: 'button-heart',
      initial: { likes: 0 },
      revalidateTag: 'post-1-likes',
    });
    const pending = mock.traces().find((t) => t.op === 'markLikePending');
    expect(pending?.ok).toBe(true);
    expect((pending?.detail as { submitter?: string })?.submitter).toBe('button-heart');
  });

  it('axis 2: applyOptimisticLike appears in the trace when optimistic patch is provided', async () => {
    const result = await mock.runLike({
      routeId: '/like',
      actionId: 'like-a2',
      formId: 'like-form-2',
      targetId: 'post-2',
      submitter: 'button-heart',
      initial: { likes: 5, liked: false },
      optimistic: { liked: true, likes: 6 },
      resolveWith: { liked: true, likes: 6 },
      revalidateTag: 'post-2-likes',
    });
    expect(result.optimisticApplied).toBe(true);
    const optimistic = mock.traces().find((t) => t.op === 'applyOptimisticLike');
    expect(optimistic?.ok).toBe(true);
    expect((optimistic?.detail as { patchKeys?: string })?.patchKeys).toContain('liked');
  });

  it('axis 2: applyOptimisticLike is absent when no optimistic patch is provided', async () => {
    const result = await mock.runLike({
      routeId: '/like',
      actionId: 'like-a3',
      formId: 'like-form-3',
      targetId: 'post-3',
      submitter: 'button-heart',
      initial: { likes: 0 },
      resolveWith: { likes: 1 },
      revalidateTag: 'post-3-likes',
    });
    expect(result.optimisticApplied).toBe(false);
    const optimistic = mock.traces().find((t) => t.op === 'applyOptimisticLike');
    expect(optimistic).toBeUndefined();
  });

  it('axis 3: revalidateLikeTag appends the tag to revalidatedTags', async () => {
    const result = await mock.runLike({
      routeId: '/like',
      actionId: 'like-a4',
      formId: 'like-form-4',
      targetId: 'post-4',
      submitter: 'button-heart',
      initial: { likes: 0 },
      resolveWith: { likes: 1 },
      revalidateTag: 'trending-posts',
    });
    expect(result.revalidatedTags).toEqual(['trending-posts']);
  });

  it('axis 3: revalidateLikeTag trace records the tag', async () => {
    await mock.runLike({
      routeId: '/like',
      actionId: 'like-a5',
      formId: 'like-form-5',
      targetId: 'post-5',
      submitter: 'button-heart',
      initial: { likes: 0 },
      resolveWith: {},
      revalidateTag: 'featured-posts',
    });
    const reval = mock.traces().find((t) => t.op === 'revalidateLikeTag');
    expect(reval?.ok).toBe(true);
    expect((reval?.detail as { tag?: string })?.tag).toBe('featured-posts');
  });

  it('axis 4: resolveLike marks the session resolved on success', async () => {
    const result = await mock.runLike({
      routeId: '/like',
      actionId: 'like-a6',
      formId: 'like-form-6',
      targetId: 'post-6',
      submitter: 'button-heart',
      initial: { likes: 0 },
      resolveWith: { likes: 1 },
      revalidateTag: 't6',
    });
    expect(result.resolved).toBe(true);
    expect(result.rejected).toBe(false);
    expect(mock.metrics().formsResolved).toBe(1);
  });

  it('axis 4: resolveLike marks the session rejected when rejectWith is set', async () => {
    const result = await mock.runLike({
      routeId: '/like',
      actionId: 'like-a7',
      formId: 'like-form-7',
      targetId: 'post-7',
      submitter: 'button-heart',
      initial: { likes: 0 },
      rejectWith: 'rate-limited',
      revalidateTag: 't7',
    });
    expect(result.resolved).toBe(false);
    expect(result.rejected).toBe(true);
    expect(mock.metrics().formsRejected).toBe(1);
  });

  it('axis 4: rejectWith records the error kind in the resolveLike trace', async () => {
    await mock.runLike({
      routeId: '/like',
      actionId: 'like-a8',
      formId: 'like-form-8',
      targetId: 'post-8',
      submitter: 'button-heart',
      initial: { likes: 0 },
      rejectWith: 'server_error',
      revalidateTag: 't8',
    });
    const resolve = mock.traces().find((t) => t.op === 'resolveLike');
    expect(resolve?.ok).toBe(true);
    expect((resolve?.detail as { rejected?: boolean })?.rejected).toBe(true);
    expect((resolve?.detail as { reason?: string })?.reason).toBe('server_error');
  });

  it('trace order: startLike → markLikePending → applyOptimisticLike → submitLike → revalidateLikeTag → resolveLike', async () => {
    await mock.runLike({
      routeId: '/like',
      actionId: 'ordered',
      formId: 'ordered',
      targetId: 'p',
      submitter: 'btn',
      initial: { likes: 0 },
      optimistic: { likes: 1 },
      resolveWith: { likes: 1 },
      revalidateTag: 't',
    });
    const t = mock.traces();
    const s = t.findIndex((e) => e.op === 'startLike');
    const p = t.findIndex((e) => e.op === 'markLikePending');
    const o = t.findIndex((e) => e.op === 'applyOptimisticLike');
    const sub = t.findIndex((e) => e.op === 'submitLike');
    const r = t.findIndex((e) => e.op === 'revalidateLikeTag');
    const res = t.findIndex((e) => e.op === 'resolveLike');
    expect(s).toBeGreaterThanOrEqual(0);
    expect(p).toBeGreaterThan(s);
    expect(o).toBeGreaterThan(p);
    expect(sub).toBeGreaterThan(o);
    expect(r).toBeGreaterThan(sub);
    expect(res).toBeGreaterThan(r);
  });

  it('metrics.likesSubmitted + tagRevalidations + optimisticApplied track counts', async () => {
    await mock.runLike({
      routeId: '/like',
      actionId: 'a',
      formId: 'f',
      targetId: 'p',
      submitter: 'btn',
      initial: { likes: 0 },
      optimistic: { likes: 1 },
      resolveWith: { likes: 1 },
      revalidateTag: 't',
    });
    const m = mock.metrics();
    expect(m.likesSubmitted).toBe(1);
    expect(m.tagRevalidations).toBe(1);
    expect(m.optimisticApplied).toBe(1);
  });

  it('rejects empty formId', async () => {
    await expect(
      mock.runLike({
        routeId: '/l',
        actionId: 'a',
        formId: '',
        targetId: 'p',
        submitter: 'btn',
        initial: {},
        revalidateTag: 't',
      }),
    ).rejects.toThrow(/formId/);
  });

  it('rejects empty targetId', async () => {
    await expect(
      mock.runLike({
        routeId: '/l',
        actionId: 'a',
        formId: 'f',
        targetId: '',
        submitter: 'btn',
        initial: {},
        revalidateTag: 't',
      }),
    ).rejects.toThrow(/targetId/);
  });

  it('rejects empty revalidateTag', async () => {
    await expect(
      mock.runLike({
        routeId: '/l',
        actionId: 'a',
        formId: 'f',
        targetId: 'p',
        submitter: 'btn',
        initial: {},
        revalidateTag: '',
      }),
    ).rejects.toThrow(/revalidateTag/);
  });
});

describe('like route handler — request validation', () => {
  it('accepts a valid run request', () => {
    const result = validateLikeRequest({
      kind: 'run',
      routeId: '/like',
      actionId: 'a',
      formId: 'f',
      targetId: 'p',
      submitter: 'btn',
      initial: { likes: 0 },
      revalidateTag: 't',
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a non-object body', () => {
    const result = validateLikeRequest(42);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('rejects a missing formId', () => {
    const result = validateLikeRequest({
      kind: 'run',
      routeId: '/like',
      actionId: 'a',
      targetId: 'p',
      submitter: 'btn',
      initial: {},
      revalidateTag: 't',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('formId_required');
  });

  it('rejects a missing revalidateTag', () => {
    const result = validateLikeRequest({
      kind: 'run',
      routeId: '/like',
      actionId: 'a',
      formId: 'f',
      targetId: 'p',
      submitter: 'btn',
      initial: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('revalidateTag_required');
  });

  it('rejects an unknown kind', () => {
    const result = validateLikeRequest({
      kind: 'read',
      routeId: '/l',
      actionId: 'a',
      formId: 'f',
      targetId: 'p',
      submitter: 'btn',
      initial: {},
      revalidateTag: 't',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_run');
  });

  it('handleLikeRequest returns optimisticApplied:true when optimistic patch is provided', async () => {
    const parsed = validateLikeRequest({
      kind: 'run',
      routeId: '/like',
      actionId: 'h',
      formId: 'h-form',
      targetId: 'post-h',
      submitter: 'btn',
      initial: { likes: 0 },
      optimistic: { likes: 1 },
      resolveWith: { likes: 1 },
      revalidateTag: 't-h',
    });
    if (!parsed.ok) throw new Error('unreachable');
    const response = await handleLikeRequest(mock, parsed.value);
    expect(response.ok).toBe(true);
    expect(response.optimisticApplied).toBe(true);
    expect(response.resolved).toBe(true);
  });

  it('handleLikeRequest surfaces adapter errors as ok:false', async () => {
    const response = await handleLikeRequest(mock, {
      kind: 'run',
      routeId: '',
      actionId: '',
      formId: '',
      targetId: '',
      submitter: '',
      initial: {},
      revalidateTag: '',
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBeDefined();
  });
});

describe('real adapter — like refuses env-missing', () => {
  it('runLike throws with KIWA_SERVER_ACTION_ENV_MISSING when env is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.runLike({
        routeId: '/l',
        actionId: 'a',
        formId: 'f',
        targetId: 'p',
        submitter: 'btn',
        initial: {},
        revalidateTag: 't',
      }),
    ).rejects.toThrow(/KIWA_SERVER_ACTION_ENV_MISSING|KIWA_MODE=mock/);
  });
});
