/**
 * `/signaling` HTTP handler — view transitions (element + document +
 * animation) + form action advanced (pending + optimistic + progressive
 * enhancement + resolve/reject) ops the Next.js runtime exposes to the
 * signaling surface. The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up
 * Next.js.
 *
 * The signaling surface pairs the parent v1.34-1 `view-transitions` +
 * `form-action-advanced` axes with the neutral event vocabulary that
 * `@kiwa/component` v0.3 emits — every op has a neutral event
 * counterpart the fidelity harness can compare across mock vs real.
 */

import type { RscStreamingAdapter } from '../../adapters/interface.js';

export type SignalingOpKind = 'transition' | 'form';

export interface SignalingRequestBase {
  routeId: string;
}

export interface SignalingTransitionRequest extends SignalingRequestBase {
  kind: 'transition';
  transitionId: string;
  elements?: Array<{ elementId: string; from: string; to: string }>;
  documentTransition?: { name: string; fromUrl: string; toUrl: string };
  animations?: Array<{ assertionId: string; durationMs: number; easing?: string }>;
}

export interface SignalingFormRequest extends SignalingRequestBase {
  kind: 'form';
  formId: string;
  submitter: string;
  initial: Record<string, unknown>;
  optimistic?: Record<string, unknown>;
  enhance?: { actionUrl: string; method?: 'post' | 'get' };
  resolveWith?: Record<string, unknown>;
  rejectWith?: string;
}

export type SignalingRequest = SignalingTransitionRequest | SignalingFormRequest;

export interface SignalingResponse {
  ok: boolean;
  kind: SignalingOpKind;
  routeId: string;
  transitionId?: string;
  formId?: string;
  elementCount?: number;
  documentTransition?: string | null;
  assertionCount?: number;
  enhanced?: boolean;
  optimisticApplied?: boolean;
  resolved?: boolean;
  errorKind?: string;
}

export function validateSignalingRequest(
  body: unknown,
): { ok: true; value: SignalingRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['routeId'] !== 'string' || !b['routeId']) {
    return { ok: false, errorKind: 'routeId_required' };
  }
  if (b['kind'] === 'transition') {
    if (typeof b['transitionId'] !== 'string' || !b['transitionId']) {
      return { ok: false, errorKind: 'transitionId_required' };
    }
    const req: SignalingTransitionRequest = {
      kind: 'transition',
      routeId: b['routeId'],
      transitionId: b['transitionId'],
    };
    if (Array.isArray(b['elements'])) {
      req.elements = [];
      for (const raw of b['elements']) {
        if (!raw || typeof raw !== 'object') {
          return { ok: false, errorKind: 'element_entry_not_object' };
        }
        const e = raw as Record<string, unknown>;
        if (
          typeof e['elementId'] !== 'string' ||
          typeof e['from'] !== 'string' ||
          typeof e['to'] !== 'string'
        ) {
          return { ok: false, errorKind: 'element_fields_required' };
        }
        req.elements.push({ elementId: e['elementId'], from: e['from'], to: e['to'] });
      }
    }
    if (b['documentTransition'] && typeof b['documentTransition'] === 'object') {
      const d = b['documentTransition'] as Record<string, unknown>;
      if (
        typeof d['name'] !== 'string' ||
        typeof d['fromUrl'] !== 'string' ||
        typeof d['toUrl'] !== 'string'
      ) {
        return { ok: false, errorKind: 'document_transition_fields_required' };
      }
      req.documentTransition = {
        name: d['name'],
        fromUrl: d['fromUrl'],
        toUrl: d['toUrl'],
      };
    }
    if (Array.isArray(b['animations'])) {
      req.animations = [];
      for (const raw of b['animations']) {
        if (!raw || typeof raw !== 'object') {
          return { ok: false, errorKind: 'animation_entry_not_object' };
        }
        const a = raw as Record<string, unknown>;
        if (typeof a['assertionId'] !== 'string' || typeof a['durationMs'] !== 'number') {
          return { ok: false, errorKind: 'animation_fields_required' };
        }
        const parsed: NonNullable<SignalingTransitionRequest['animations']>[number] = {
          assertionId: a['assertionId'],
          durationMs: a['durationMs'],
        };
        if (typeof a['easing'] === 'string') parsed.easing = a['easing'];
        req.animations.push(parsed);
      }
    }
    return { ok: true, value: req };
  }
  if (b['kind'] === 'form') {
    if (typeof b['formId'] !== 'string' || !b['formId']) {
      return { ok: false, errorKind: 'formId_required' };
    }
    if (typeof b['submitter'] !== 'string' || !b['submitter']) {
      return { ok: false, errorKind: 'submitter_required' };
    }
    if (!b['initial'] || typeof b['initial'] !== 'object') {
      return { ok: false, errorKind: 'initial_required' };
    }
    const req: SignalingFormRequest = {
      kind: 'form',
      routeId: b['routeId'],
      formId: b['formId'],
      submitter: b['submitter'],
      initial: b['initial'] as Record<string, unknown>,
    };
    if (b['optimistic'] && typeof b['optimistic'] === 'object') {
      req.optimistic = b['optimistic'] as Record<string, unknown>;
    }
    if (b['enhance'] && typeof b['enhance'] === 'object') {
      const e = b['enhance'] as Record<string, unknown>;
      if (typeof e['actionUrl'] !== 'string' || !e['actionUrl']) {
        return { ok: false, errorKind: 'enhance_actionUrl_required' };
      }
      const parsed: NonNullable<SignalingFormRequest['enhance']> = {
        actionUrl: e['actionUrl'],
      };
      if (e['method'] === 'post' || e['method'] === 'get') parsed.method = e['method'];
      req.enhance = parsed;
    }
    if (b['resolveWith'] && typeof b['resolveWith'] === 'object') {
      req.resolveWith = b['resolveWith'] as Record<string, unknown>;
    }
    if (typeof b['rejectWith'] === 'string') {
      req.rejectWith = b['rejectWith'];
    }
    return { ok: true, value: req };
  }
  return { ok: false, errorKind: 'kind_must_be_transition_or_form' };
}

export async function handleSignalingRequest(
  adapter: RscStreamingAdapter,
  req: SignalingRequest,
): Promise<SignalingResponse> {
  if (req.kind === 'transition') {
    try {
      const input: Parameters<RscStreamingAdapter['runTransition']>[0] = {
        transitionId: req.transitionId,
      };
      if (req.elements !== undefined) input.elements = req.elements;
      if (req.documentTransition !== undefined) input.documentTransition = req.documentTransition;
      if (req.animations !== undefined) input.animations = req.animations;
      const result = await adapter.runTransition(input);
      return {
        ok: true,
        kind: 'transition',
        routeId: req.routeId,
        transitionId: result.transitionId,
        elementCount: (req.elements ?? []).length,
        documentTransition: result.documentTransition,
        assertionCount: result.assertions.length,
      };
    } catch (err) {
      return {
        ok: false,
        kind: 'transition',
        routeId: req.routeId,
        transitionId: req.transitionId,
        errorKind: coerceErrorKind(err),
      };
    }
  }
  try {
    const input: Parameters<RscStreamingAdapter['submitFormAction']>[0] = {
      formId: req.formId,
      submitter: req.submitter,
      initial: req.initial,
    };
    if (req.optimistic !== undefined) input.optimistic = req.optimistic;
    if (req.enhance !== undefined) input.enhance = req.enhance;
    if (req.resolveWith !== undefined) input.resolveWith = req.resolveWith;
    if (req.rejectWith !== undefined) input.rejectWith = req.rejectWith;
    const result = await adapter.submitFormAction(input);
    return {
      ok: true,
      kind: 'form',
      routeId: req.routeId,
      formId: result.formId,
      enhanced: result.enhanced,
      optimisticApplied: result.optimisticApplied,
      resolved: result.resolved,
    };
  } catch (err) {
    return {
      ok: false,
      kind: 'form',
      routeId: req.routeId,
      formId: req.formId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
