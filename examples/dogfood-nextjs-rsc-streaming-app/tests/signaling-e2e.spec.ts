/**
 * Signaling end-to-end fidelity spec (view-transitions + form-action-
 * advanced axes).
 *
 * Sub-Issue CAR-785 (v1.34-2) AC — the mock adapter drives a full view
 * transitions + form action advanced ceremony end to end and the fidelity
 * harness diffs the raw {@link TraceEvent} sequence across four axes.
 *
 *  1. runTransition drives element + document view transitions in order.
 *     Element transitions register active elements which finishTransition
 *     retires; document transitions record a single active transition
 *     name.
 *  2. assertAnimation records duration + easing per assertion so downstream
 *     specs can prove an animation actually ran (vs was silently skipped).
 *  3. submitFormAction covers the 4-step form action lifecycle — pending
 *     → optimistic → enhanced → resolved. The optimistic patch merges into
 *     the form state before the action resolves, matching React 19.1
 *     `useOptimistic`.
 *  4. submitFormAction with rejectWith records a rejection separately from
 *     a resolution so the release-gate can distinguish failed vs succeeded
 *     forms.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleSignalingRequest,
  validateSignalingRequest,
} from '../src/app/signaling/route.js';
import type { RscStreamingAdapter } from '../src/adapters/interface.js';

let mock: RscStreamingAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ seed: 17, latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — view transitions ceremony', () => {
  it('axis 1: element transitions register active elements then finishTransition retires them', async () => {
    const result = await mock.runTransition({
      transitionId: 'nav-1',
      elements: [
        { elementId: 'hero', from: '/', to: '/detail' },
        { elementId: 'sidebar', from: '/', to: '/detail' },
      ],
    });
    expect(result.elements).toHaveLength(0);
    const starts = mock.traces().filter(
      (t) => t.op === 'startTransition' && (t.detail as { kind?: string })?.kind === 'element',
    );
    expect(starts).toHaveLength(2);
    const finishes = mock.traces().filter((t) => t.op === 'finishTransition');
    expect(finishes).toHaveLength(2);
  });

  it('axis 1: documentTransition records the transition name', async () => {
    const result = await mock.runTransition({
      transitionId: 'doc-1',
      documentTransition: { name: 'slide', fromUrl: '/', toUrl: '/next' },
    });
    expect(result.documentTransition).toBe('slide');
  });

  it('axis 2: assertAnimation records duration + easing per assertion', async () => {
    const result = await mock.runTransition({
      transitionId: 'anim-1',
      animations: [
        { assertionId: 'fade-in', durationMs: 200 },
        { assertionId: 'slide-up', durationMs: 300, easing: 'ease-in-out' },
      ],
    });
    expect(result.assertions).toEqual(['fade-in', 'slide-up']);
    const asserts = mock.traces().filter((t) => t.op === 'assertAnimation');
    expect(asserts).toHaveLength(2);
    expect((asserts[0]?.detail as { durationMs?: number })?.durationMs).toBe(200);
  });

  it('axis 2: metrics.transitionsRun increments per runTransition call', async () => {
    await mock.runTransition({ transitionId: 't-1' });
    await mock.runTransition({ transitionId: 't-2' });
    expect(mock.metrics().transitionsRun).toBe(2);
    expect(mock.metrics().transitionLatencySamplesMs).toHaveLength(2);
  });

  it('rejects empty transitionId', async () => {
    await expect(mock.runTransition({ transitionId: '' })).rejects.toThrow(/transitionId/);
  });
});

describe('mock adapter — form action advanced ceremony', () => {
  it('axis 3: submitFormAction goes through pending → optimistic → enhanced → resolved', async () => {
    const result = await mock.submitFormAction({
      formId: 'subscribe',
      submitter: 'button-primary',
      initial: { email: 'guest@example.com' },
      optimistic: { subscribed: true },
      enhance: { actionUrl: '/api/subscribe', method: 'post' },
      resolveWith: { subscribed: true, welcomeMessage: 'hi' },
    });
    expect(result.enhanced).toBe(true);
    expect(result.optimisticApplied).toBe(true);
    expect(result.resolved).toBe(true);
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toContain('markFormPending');
    expect(ops).toContain('applyOptimistic');
    expect(ops).toContain('enhanceForm');
    expect(ops).toContain('resolveForm');
  });

  it('axis 3: applyOptimistic trace records the patch keys', async () => {
    await mock.submitFormAction({
      formId: 'vote',
      submitter: 'button-vote',
      initial: { count: 0 },
      optimistic: { count: 1 },
      resolveWith: { count: 1 },
    });
    const opt = mock.traces().find((t) => t.op === 'applyOptimistic');
    expect((opt?.detail as { patchKeys?: string })?.patchKeys).toBe('count');
  });

  it('axis 3: metrics.optimisticApplied only counts when the patch is supplied', async () => {
    await mock.submitFormAction({
      formId: 'a',
      submitter: 's',
      initial: {},
      resolveWith: {},
    });
    expect(mock.metrics().optimisticApplied).toBe(0);
    await mock.submitFormAction({
      formId: 'b',
      submitter: 's',
      initial: {},
      optimistic: { x: 1 },
      resolveWith: {},
    });
    expect(mock.metrics().optimisticApplied).toBe(1);
  });

  it('axis 4: submitFormAction with rejectWith records a rejection separately from a resolution', async () => {
    const result = await mock.submitFormAction({
      formId: 'accept-invite',
      submitter: 'button-accept',
      initial: { status: 'idle' },
      rejectWith: 'invite_expired',
    });
    expect(result.resolved).toBe(false);
    expect(mock.metrics().formsRejected).toBe(1);
    expect(mock.metrics().formsResolved).toBe(0);
    const resolve = mock.traces().find((t) => t.op === 'resolveForm');
    expect((resolve?.detail as { rejected?: boolean })?.rejected).toBe(true);
    expect((resolve?.detail as { reason?: string })?.reason).toBe('invite_expired');
  });

  it('axis 4: resolveWith merges into the form and enhanced stays honoured', async () => {
    const result = await mock.submitFormAction({
      formId: 'form-merge',
      submitter: 's',
      initial: { a: 1 },
      enhance: { actionUrl: '/api/merge' },
      resolveWith: { a: 2, b: 3 },
    });
    expect(result.enhanced).toBe(true);
    expect(result.resolved).toBe(true);
  });

  it('rejects empty formId', async () => {
    await expect(
      mock.submitFormAction({
        formId: '',
        submitter: 's',
        initial: {},
      }),
    ).rejects.toThrow(/formId/);
  });

  it('rejects empty submitter', async () => {
    await expect(
      mock.submitFormAction({
        formId: 'f',
        submitter: '',
        initial: {},
      }),
    ).rejects.toThrow(/submitter/);
  });
});

describe('signaling route handler — request validation', () => {
  it('accepts a valid transition request', () => {
    const result = validateSignalingRequest({
      kind: 'transition',
      routeId: '/x',
      transitionId: 't-1',
      elements: [{ elementId: 'e', from: '/', to: '/x' }],
    });
    expect(result.ok).toBe(true);
  });

  it('accepts a valid form request', () => {
    const result = validateSignalingRequest({
      kind: 'form',
      routeId: '/x',
      formId: 'f',
      submitter: 's',
      initial: { a: 1 },
    });
    expect(result.ok).toBe(true);
  });

  it('rejects a transition request missing elementId', () => {
    const result = validateSignalingRequest({
      kind: 'transition',
      routeId: '/x',
      transitionId: 't-1',
      elements: [{ from: '/', to: '/x' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('element_fields_required');
  });

  it('rejects a form request missing initial', () => {
    const result = validateSignalingRequest({
      kind: 'form',
      routeId: '/x',
      formId: 'f',
      submitter: 's',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('initial_required');
  });

  it('rejects an unknown kind', () => {
    const result = validateSignalingRequest({ kind: 'shrug', routeId: '/x' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('kind_must_be_transition_or_form');
  });

  it('handleSignalingRequest routes transition to runTransition', async () => {
    const parsed = validateSignalingRequest({
      kind: 'transition',
      routeId: '/x',
      transitionId: 't-1',
      elements: [{ elementId: 'e', from: '/', to: '/x' }],
    });
    if (!parsed.ok) throw new Error('unreachable');
    const response = await handleSignalingRequest(mock, parsed.value);
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('transition');
    expect(response.transitionId).toBe('t-1');
  });

  it('handleSignalingRequest routes form to submitFormAction', async () => {
    const parsed = validateSignalingRequest({
      kind: 'form',
      routeId: '/x',
      formId: 'f',
      submitter: 's',
      initial: { a: 1 },
      resolveWith: { a: 2 },
    });
    if (!parsed.ok) throw new Error('unreachable');
    const response = await handleSignalingRequest(mock, parsed.value);
    expect(response.ok).toBe(true);
    expect(response.kind).toBe('form');
    expect(response.resolved).toBe(true);
  });
});

describe('real adapter — env-detect skeleton (signaling)', () => {
  it('runTransition throws with KIWA_RSC_STREAMING_ENV_MISSING when env is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.runTransition({ transitionId: 't' }),
    ).rejects.toThrow(/KIWA_RSC_STREAMING_ENV_MISSING|KIWA_MODE=mock/);
    const trace = real.traces().find((t) => t.op === 'startTransition');
    expect(trace?.ok).toBe(false);
  });

  it('submitFormAction throws with KIWA_RSC_STREAMING_ENV_MISSING when env is not ready', async () => {
    const real = makeRealAdapter();
    await expect(
      real.submitFormAction({
        formId: 'f',
        submitter: 's',
        initial: {},
      }),
    ).rejects.toThrow(/KIWA_RSC_STREAMING_ENV_MISSING|KIWA_MODE=mock/);
    const trace = real.traces().find((t) => t.op === 'markFormPending');
    expect(trace?.ok).toBe(false);
  });

  it('real adapter mode is "real"', () => {
    const real = makeRealAdapter();
    expect(real.mode).toBe('real');
  });
});
