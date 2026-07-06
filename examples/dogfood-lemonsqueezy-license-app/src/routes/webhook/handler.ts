/**
 * `POST /webhook` handler. Verifies the X-Signature header against the
 * raw body via the adapter and dispatches the event's effect on the
 * store. Real Lemon Squeezy re-delivers on failure so the receiver must
 * dedupe by event id (handled inside the adapter).
 */

import type {
  LemonSqueezyLicenseAdapter,
  WebhookReceiveInput,
  WebhookReceiveResult,
} from '../../adapters/interface.js';

export type WebhookRouteResult =
  | { ok: true; status: 200; body: WebhookReceiveResult }
  | { ok: false; status: 400; body: { error: string; reason: string } };

export function makeWebhookRoute(
  adapter: LemonSqueezyLicenseAdapter,
): (input: WebhookReceiveInput) => Promise<WebhookRouteResult> {
  return async (input: WebhookReceiveInput): Promise<WebhookRouteResult> => {
    const result = await adapter.receiveWebhook(input);
    if (result.verify.ok !== true) {
      return {
        ok: false,
        status: 400,
        body: { error: 'signature_verify_failed', reason: result.verify.reason },
      };
    }
    return { ok: true, status: 200, body: result };
  };
}
