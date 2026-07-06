/**
 * `/login` HTTP handler — progressive enhancement + form action + redirect
 * ops the Next.js runtime exposes to the login surface. The route is
 * intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise mock
 * and real without spinning up Next.js.
 *
 * The login surface pairs the parent v1.34-1 `form-action-advanced` axis
 * (progressive enhancement) with the `server-action-advanced` axis (submit
 * + redirect) — every op has a neutral event counterpart the fidelity
 * harness can compare across mock vs real.
 */

import type { ServerActionAdapter } from '../../adapters/interface.js';

export type LoginOpKind = 'run';

export interface LoginRequest {
  kind: LoginOpKind;
  routeId: string;
  actionId: string;
  formId: string;
  submitter: string;
  credentials: Record<string, string>;
  enhance?: { actionUrl: string; method?: 'post' | 'get' };
  redirectTo?: string;
  rejectWith?: string;
}

export interface LoginResponse {
  ok: boolean;
  kind: LoginOpKind;
  routeId: string;
  actionId: string;
  formId: string;
  enhanced?: boolean;
  redirectUrl?: string | null;
  submitted?: boolean;
  errorKind?: string;
}

export function validateLoginRequest(
  body: unknown,
): { ok: true; value: LoginRequest } | { ok: false; errorKind: string } {
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
  if (typeof b['submitter'] !== 'string' || !b['submitter']) {
    return { ok: false, errorKind: 'submitter_required' };
  }
  if (b['kind'] !== 'run') {
    return { ok: false, errorKind: 'kind_must_be_run' };
  }
  if (!b['credentials'] || typeof b['credentials'] !== 'object') {
    return { ok: false, errorKind: 'credentials_required' };
  }
  const credentials: Record<string, string> = {};
  for (const [k, v] of Object.entries(b['credentials'] as Record<string, unknown>)) {
    if (typeof v !== 'string') {
      return { ok: false, errorKind: 'credentials_values_must_be_strings' };
    }
    credentials[k] = v;
  }
  const req: LoginRequest = {
    kind: 'run',
    routeId: b['routeId'],
    actionId: b['actionId'],
    formId: b['formId'],
    submitter: b['submitter'],
    credentials,
  };
  if (b['enhance'] && typeof b['enhance'] === 'object') {
    const e = b['enhance'] as Record<string, unknown>;
    if (typeof e['actionUrl'] !== 'string' || !e['actionUrl']) {
      return { ok: false, errorKind: 'enhance_actionUrl_required' };
    }
    const parsed: NonNullable<LoginRequest['enhance']> = { actionUrl: e['actionUrl'] };
    if (e['method'] === 'post' || e['method'] === 'get') parsed.method = e['method'];
    req.enhance = parsed;
  }
  if (typeof b['redirectTo'] === 'string' && b['redirectTo']) {
    req.redirectTo = b['redirectTo'];
  }
  if (typeof b['rejectWith'] === 'string') {
    req.rejectWith = b['rejectWith'];
  }
  return { ok: true, value: req };
}

export async function handleLoginRequest(
  adapter: ServerActionAdapter,
  req: LoginRequest,
): Promise<LoginResponse> {
  try {
    const input: Parameters<ServerActionAdapter['runLogin']>[0] = {
      routeId: req.routeId,
      actionId: req.actionId,
      formId: req.formId,
      submitter: req.submitter,
      credentials: req.credentials,
    };
    if (req.enhance !== undefined) input.enhance = req.enhance;
    if (req.redirectTo !== undefined) input.redirectTo = req.redirectTo;
    if (req.rejectWith !== undefined) input.rejectWith = req.rejectWith;
    const result = await adapter.runLogin(input);
    return {
      ok: true,
      kind: 'run',
      routeId: result.routeId,
      actionId: result.actionId,
      formId: result.formId,
      enhanced: result.enhanced,
      redirectUrl: result.redirectUrl,
      submitted: result.submitted,
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
