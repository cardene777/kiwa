/**
 * `/subscribe` HTTP handler — Server Action form action + revalidatePath
 * ops the Next.js runtime exposes to the subscribe surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise mock
 * and real without spinning up Next.js.
 *
 * The subscribe surface pairs the parent v1.34-1 `server-action-advanced`
 * axis (submit + revalidatePath) with `@kiwa/nextjs` v1.2 — every op
 * has a neutral event counterpart the fidelity harness can compare across
 * mock vs real.
 */

import type { ServerActionAdapter } from '../../adapters/interface.js';

export type SubscribeOpKind = 'submit';

export interface SubscribeRequest {
  kind: SubscribeOpKind;
  routeId: string;
  actionId: string;
  form: Record<string, string>;
  revalidatePath: string;
}

export interface SubscribeResponse {
  ok: boolean;
  kind: SubscribeOpKind;
  routeId: string;
  actionId: string;
  fieldCount?: number;
  revalidatedPaths?: string[];
  errorKind?: string;
}

export function validateSubscribeRequest(
  body: unknown,
): { ok: true; value: SubscribeRequest } | { ok: false; errorKind: string } {
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
  if (b['kind'] !== 'submit') {
    return { ok: false, errorKind: 'kind_must_be_submit' };
  }
  if (!b['form'] || typeof b['form'] !== 'object') {
    return { ok: false, errorKind: 'form_required' };
  }
  const form: Record<string, string> = {};
  for (const [k, v] of Object.entries(b['form'] as Record<string, unknown>)) {
    if (typeof v !== 'string') {
      return { ok: false, errorKind: 'form_values_must_be_strings' };
    }
    form[k] = v;
  }
  if (typeof b['revalidatePath'] !== 'string' || !b['revalidatePath']) {
    return { ok: false, errorKind: 'revalidatePath_required' };
  }
  if (!(b['revalidatePath'] as string).startsWith('/')) {
    return { ok: false, errorKind: 'revalidatePath_must_start_with_slash' };
  }
  return {
    ok: true,
    value: {
      kind: 'submit',
      routeId: b['routeId'],
      actionId: b['actionId'],
      form,
      revalidatePath: b['revalidatePath'],
    },
  };
}

export async function handleSubscribeRequest(
  adapter: ServerActionAdapter,
  req: SubscribeRequest,
): Promise<SubscribeResponse> {
  try {
    const result = await adapter.submitSubscribe({
      routeId: req.routeId,
      actionId: req.actionId,
      form: req.form,
      revalidatePath: req.revalidatePath,
    });
    return {
      ok: true,
      kind: 'submit',
      routeId: result.routeId,
      actionId: result.actionId,
      fieldCount: Object.keys(result.form).length,
      revalidatedPaths: result.revalidatedPaths,
    };
  } catch (err) {
    return {
      ok: false,
      kind: 'submit',
      routeId: req.routeId,
      actionId: req.actionId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
