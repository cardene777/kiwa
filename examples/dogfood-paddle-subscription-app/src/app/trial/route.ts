/**
 * Next.js 15 App Router-compatible handlers for trial extension routes.
 *
 * Handlers stay as plain Request/Response functions so tests can drive them
 * directly without a Next.js runtime.
 */

import type { PaddleSubscriptionAdapter } from '../../adapters/interface.js';

/**
 * Build the `POST /trial/extend` handler.
 */
export function extendTrialHandler(
  adapter: PaddleSubscriptionAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    if (req.method !== 'POST') return jsonResponse(405, { error: 'method_not_allowed', reason: 'POST required' });
    let body: { subscriptionId?: string; additionalDays?: number; createdAtMs?: number };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse(400, { error: 'invalid_json', reason: 'invalid_json' });
    }
    if (!body.subscriptionId || typeof body.additionalDays !== 'number') {
      return jsonResponse(400, { error: 'missing_fields', reason: 'invalid_input' });
    }
    try {
      const subscription = await adapter.extendTrial({
        subscriptionId: body.subscriptionId,
        additionalDays: body.additionalDays,
        ...(body.createdAtMs !== undefined ? { createdAtMs: body.createdAtMs } : {}),
      });
      return jsonResponse(200, { subscription });
    } catch (err) {
      return routeError(err);
    }
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function routeError(err: unknown): Response {
  const reason = getReason(err);
  return jsonResponse(statusFromReason(reason), { error: 'request_failed', reason });
}

function getReason(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'reason' in err &&
    typeof (err as { reason?: unknown }).reason === 'string'
  ) {
    return (err as { reason: string }).reason;
  }
  return err instanceof Error ? err.message : String(err);
}

function statusFromReason(reason: string): number {
  if (
    reason === 'invalid_input' ||
    reason === 'invalid_trial_days' ||
    reason === 'invalid_json'
  ) {
    return 400;
  }
  if (reason === 'entity_not_found') return 404;
  if (reason === 'not_trialing') return 409;
  return 500;
}
