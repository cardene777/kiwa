/**
 * SvelteKit route logic for `POST /dispute/action` and `GET /dispute`.
 *
 * Dispatches a chargeback dispute lifecycle transition — open / evidence /
 * resolve — via a single POST endpoint keyed by the `action` field. Real
 * card networks (Visa VCR, Mastercard MCOP) run a multi-step dispute flow
 * (opened → evidence → representment → arbitration → final outcome); the
 * dogfood app reduces that to the observable 3-event envelope providers
 * surface (opened / evidence_submitted / won or lost).
 */

import type { ChargebackReason } from '@kiwa/payment';
import type {
  ChargebackEvidenceInput,
  ChargebackOpenInput,
  ChargebackResolveInput,
  LemonSqueezyDogfoodAdapter,
} from '../../adapters/interface.js';

export type DisputeActionKind = 'open' | 'evidence' | 'resolve';

export interface DisputeActionBody {
  action: DisputeActionKind;
  orderId?: string;
  chargebackId?: string;
  reason?: ChargebackReason;
  receiptUrl?: string;
  shippingProof?: string;
  customerCommunication?: string;
  merchantWon?: boolean;
}

const VALID_REASONS: ChargebackReason[] = [
  'fraudulent',
  'unrecognized',
  'duplicate',
  'product-not-received',
  'product-unacceptable',
  'subscription-canceled',
  'credit-not-processed',
  'general',
];

export function createDisputeActionHandler(
  adapter: LemonSqueezyDogfoodAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: DisputeActionBody;
    try {
      body = (await req.json()) as DisputeActionBody;
    } catch (err) {
      return jsonResponse(400, {
        error: 'invalid_json',
        message: err instanceof Error ? err.message : String(err),
      });
    }
    if (!body.action) {
      return jsonResponse(400, {
        error: 'missing_action',
        message: 'action is required',
      });
    }
    try {
      switch (body.action) {
        case 'open': {
          if (!body.orderId || !body.reason) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'orderId, reason required for open',
            });
          }
          if (!VALID_REASONS.includes(body.reason)) {
            return jsonResponse(400, {
              error: 'invalid_reason',
              message: `reason must be one of ${VALID_REASONS.join(', ')}`,
            });
          }
          const input: ChargebackOpenInput = {
            orderId: body.orderId,
            reason: body.reason,
          };
          const dispute = await adapter.openChargeback(input);
          return jsonResponse(200, { chargeback: dispute });
        }
        case 'evidence': {
          if (!body.chargebackId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'chargebackId required for evidence',
            });
          }
          const input: ChargebackEvidenceInput = {
            chargebackId: body.chargebackId,
          };
          if (body.receiptUrl !== undefined) input.receiptUrl = body.receiptUrl;
          if (body.shippingProof !== undefined) input.shippingProof = body.shippingProof;
          if (body.customerCommunication !== undefined) {
            input.customerCommunication = body.customerCommunication;
          }
          const dispute = await adapter.submitChargebackEvidence(input);
          return jsonResponse(200, { chargeback: dispute });
        }
        case 'resolve': {
          if (!body.chargebackId || typeof body.merchantWon !== 'boolean') {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'chargebackId, merchantWon required for resolve',
            });
          }
          const input: ChargebackResolveInput = {
            chargebackId: body.chargebackId,
            merchantWon: body.merchantWon,
          };
          const dispute = await adapter.resolveChargeback(input);
          return jsonResponse(200, { chargeback: dispute });
        }
        default:
          return jsonResponse(400, {
            error: 'unknown_action',
            message: `unknown action: ${String(body.action)}`,
          });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('is opened') ||
        message.includes('is evidence-submitted') ||
        message.includes('is won') ||
        message.includes('is lost') ||
        message.includes('submit evidence first') ||
        message.includes('not found')
      ) {
        return jsonResponse(409, {
          error: 'illegal_transition',
          message,
        });
      }
      const status = message.includes('KIWA_LEMONSQUEEZY_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'dispute_action_failed',
        message,
      });
    }
  };
}

export function createDisputeListHandler(
  adapter: LemonSqueezyDogfoodAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(_req: Request): Promise<Response> {
    return jsonResponse(200, { chargebacks: adapter.listChargebacks() });
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
