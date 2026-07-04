/**
 * Nuxt 3 server route for `POST /api/subscription/action`.
 *
 * Dispatches a subscription lifecycle transition — the tier
 * upgrade/downgrade UI + pause/resume/cancel/reactivate flow uses this
 * single endpoint keyed by the `action` field. Every action returns the
 * updated subscription (or the newly created one). The runtime enforces
 * state guards; the handler just translates HTTP → adapter call.
 */

import type {
  PaddleBillingAdapter,
  SubscriptionPlanChangeInput,
} from '../../adapters/interface.js';

export type SubscriptionActionKind =
  | 'create'
  | 'changePlan'
  | 'pause'
  | 'resume'
  | 'cancel'
  | 'reactivate';

export interface SubscriptionActionBody {
  action: SubscriptionActionKind;
  subscriptionId?: string;
  customerId?: string;
  planId?: string;
  amountCents?: number;
  newPlanId?: string;
  newAmountCents?: number;
  currency?: string;
}

export function createSubscriptionActionHandler(
  adapter: PaddleBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: SubscriptionActionBody;
    try {
      body = (await req.json()) as SubscriptionActionBody;
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
        case 'create': {
          if (!body.customerId || !body.planId || typeof body.amountCents !== 'number') {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'customerId, planId, amountCents required for create',
            });
          }
          if (body.amountCents <= 0) {
            return jsonResponse(400, {
              error: 'invalid_amount',
              message: `amountCents must be > 0 (got ${body.amountCents})`,
            });
          }
          const withRuntime = adapter as unknown as {
            runtime?: () => {
              createSubscription: (i: {
                customerId: string;
                planId: string;
                amountCents: number;
                currency?: string;
              }) => Promise<unknown>;
            };
          };
          const runtime = withRuntime.runtime?.();
          if (!runtime) {
            return jsonResponse(501, {
              error: 'not_implemented',
              message: 'create is only available on the mock adapter (KIWA_MODE=mock)',
            });
          }
          const createInput: {
            customerId: string;
            planId: string;
            amountCents: number;
            currency?: string;
          } = {
            customerId: body.customerId,
            planId: body.planId,
            amountCents: body.amountCents,
          };
          if (body.currency !== undefined) createInput.currency = body.currency;
          const subscription = await runtime.createSubscription(createInput);
          return jsonResponse(200, { subscription });
        }
        case 'changePlan': {
          if (
            !body.subscriptionId ||
            !body.newPlanId ||
            typeof body.newAmountCents !== 'number'
          ) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'subscriptionId, newPlanId, newAmountCents required',
            });
          }
          const input: SubscriptionPlanChangeInput = {
            subscriptionId: body.subscriptionId,
            newPlanId: body.newPlanId,
            newAmountCents: body.newAmountCents,
          };
          const subscription = await adapter.changePlan(input);
          return jsonResponse(200, { subscription });
        }
        case 'pause': {
          if (!body.subscriptionId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'subscriptionId is required',
            });
          }
          const subscription = await adapter.pauseSubscription(body.subscriptionId);
          return jsonResponse(200, { subscription });
        }
        case 'resume': {
          if (!body.subscriptionId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'subscriptionId is required',
            });
          }
          const subscription = await adapter.resumeSubscription(body.subscriptionId);
          return jsonResponse(200, { subscription });
        }
        case 'cancel': {
          if (!body.subscriptionId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'subscriptionId is required',
            });
          }
          const subscription = await adapter.cancelSubscription(body.subscriptionId);
          return jsonResponse(200, { subscription });
        }
        case 'reactivate': {
          if (!body.subscriptionId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'subscriptionId is required',
            });
          }
          const subscription = await adapter.reactivateSubscription(body.subscriptionId);
          return jsonResponse(200, { subscription });
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
        message.includes('is canceled') ||
        message.includes('is paused') ||
        message.includes('already canceled') ||
        message.includes('no-op') ||
        message.includes('not found')
      ) {
        return jsonResponse(409, {
          error: 'illegal_transition',
          message,
        });
      }
      const status = message.includes('KIWA_PADDLE_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'subscription_action_failed',
        message,
      });
    }
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
