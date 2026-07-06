/**
 * `/like` HTTP handler — form action + useFormStatus + useOptimistic +
 * revalidateTag ops the Next.js runtime exposes to the like surface. The
 * route is intentionally shape-neutral — the fidelity harness feeds plain
 * objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up Next.js.
 *
 * The like surface pairs the parent v1.34-1 `form-action-advanced` axis
 * with `@kiwa-test/component` v0.3 form-action-advanced helpers +
 * `@kiwa-test/nextjs` v1.2 server-action-advanced helpers — every op has a
 * neutral event counterpart the fidelity harness can compare across mock
 * vs real.
 */

import type { ServerActionAdapter } from '../../adapters/interface.js';

export type LikeOpKind = 'run';

export interface LikeRequest {
  kind: LikeOpKind;
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
}

export interface LikeResponse {
  ok: boolean;
  kind: LikeOpKind;
  routeId: string;
  actionId: string;
  formId: string;
  optimisticApplied?: boolean;
  revalidatedTags?: string[];
  resolved?: boolean;
  rejected?: boolean;
  errorKind?: string;
}

export function validateLikeRequest(
  body: unknown,
): { ok: true; value: LikeRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['routeId'] !== 'string' || !b['routeId']) {
    return { ok: false, errorKind: 'routeId_required' };
  }
  if (typeof b['actionId'] !== 'string' || !b['actionId']) {
    return { ok: false, errorKind: 'actionId_required' };
  }
  if (typeof b['formId'] !== 'string' || !b['formId']) {
    return { ok: false, errorKind: 'formId_required' };
  }
  if (typeof b['targetId'] !== 'string' || !b['targetId']) {
    return { ok: false, errorKind: 'targetId_required' };
  }
  if (typeof b['submitter'] !== 'string' || !b['submitter']) {
    return { ok: false, errorKind: 'submitter_required' };
  }
  if (b['kind'] !== 'run') {
    return { ok: false, errorKind: 'kind_must_be_run' };
  }
  if (!b['initial'] || typeof b['initial'] !== 'object') {
    return { ok: false, errorKind: 'initial_required' };
  }
  if (typeof b['revalidateTag'] !== 'string' || !b['revalidateTag']) {
    return { ok: false, errorKind: 'revalidateTag_required' };
  }
  const req: LikeRequest = {
    kind: 'run',
    routeId: b['routeId'],
    actionId: b['actionId'],
    formId: b['formId'],
    targetId: b['targetId'],
    submitter: b['submitter'],
    initial: b['initial'] as Record<string, unknown>,
    revalidateTag: b['revalidateTag'],
  };
  if (b['optimistic'] && typeof b['optimistic'] === 'object') {
    req.optimistic = b['optimistic'] as Record<string, unknown>;
  }
  if (b['resolveWith'] && typeof b['resolveWith'] === 'object') {
    req.resolveWith = b['resolveWith'] as Record<string, unknown>;
  }
  if (typeof b['rejectWith'] === 'string') {
    req.rejectWith = b['rejectWith'];
  }
  return { ok: true, value: req };
}

export async function handleLikeRequest(
  adapter: ServerActionAdapter,
  req: LikeRequest,
): Promise<LikeResponse> {
  try {
    const input: Parameters<ServerActionAdapter['runLike']>[0] = {
      routeId: req.routeId,
      actionId: req.actionId,
      formId: req.formId,
      targetId: req.targetId,
      submitter: req.submitter,
      initial: req.initial,
      revalidateTag: req.revalidateTag,
    };
    if (req.optimistic !== undefined) input.optimistic = req.optimistic;
    if (req.resolveWith !== undefined) input.resolveWith = req.resolveWith;
    if (req.rejectWith !== undefined) input.rejectWith = req.rejectWith;
    const result = await adapter.runLike(input);
    return {
      ok: true,
      kind: 'run',
      routeId: result.routeId,
      actionId: result.actionId,
      formId: result.formId,
      optimisticApplied: result.optimisticApplied,
      revalidatedTags: result.revalidatedTags,
      resolved: result.resolved,
      rejected: result.rejected,
    };
  } catch (err) {
    return {
      ok: false,
      kind: 'run',
      routeId: req.routeId,
      actionId: req.actionId,
      formId: req.formId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
