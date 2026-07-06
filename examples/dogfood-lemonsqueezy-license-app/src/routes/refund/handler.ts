/**
 * `POST /refund` handler — enforces the 30-day window + amount policy
 * via the adapter and classifies rejection reasons into stable kinds.
 */

import type {
  LemonSqueezyLicenseAdapter,
  RefundInput,
  RefundResult,
} from '../../adapters/interface.js';

export type RefundRouteResult =
  | { ok: true; status: 200; body: RefundResult }
  | { ok: false; status: 400 | 404 | 409; body: { error: string; kind: string } };

export function makeRefundRoute(
  adapter: LemonSqueezyLicenseAdapter,
): (input: RefundInput) => Promise<RefundRouteResult> {
  return async (input: RefundInput): Promise<RefundRouteResult> => {
    try {
      const body = await adapter.refund(input);
      return { ok: true, status: 200, body };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const { status, kind } = classifyRefundError(message);
      return { ok: false, status, body: { error: message, kind } };
    }
  };
}

function classifyRefundError(message: string): {
  status: 400 | 404 | 409;
  kind: string;
} {
  if (message === 'order_not_found') return { status: 404, kind: 'order_not_found' };
  if (message === 'refund_window_expired') return { status: 409, kind: 'window_expired' };
  if (message === 'refund_amount_exceeds_original') {
    return { status: 400, kind: 'amount_exceeds_original' };
  }
  if (message === 'refund_amount_below_min') return { status: 400, kind: 'amount_below_min' };
  if (message === 'refund_amount_above_max') return { status: 400, kind: 'amount_above_max' };
  if (message === 'refund_order_already_fully_refunded') {
    return { status: 409, kind: 'already_fully_refunded' };
  }
  if (message === 'refund_non_positive_amount') {
    return { status: 400, kind: 'non_positive_amount' };
  }
  return { status: 400, kind: message };
}
