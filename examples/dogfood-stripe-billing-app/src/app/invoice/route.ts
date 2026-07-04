/**
 * Next.js 15 App Router route handlers for the invoice lifecycle.
 *
 *  - `GET  /invoice` — list every persisted invoice.
 *  - `POST /invoice/action` — dispatch an invoice-lifecycle action
 *    (`draft` / `open` / `pay` / `void` / `markUncollectible` / `creditNote`).
 *
 * Response shape mirrors `SemanticInvoice` — id + customerId + amountCents +
 * currency + state + history.
 */

import type { CreditNoteInput, StripeBillingAdapter } from '../../adapters/interface.js';

export type InvoiceActionKind =
  | 'draft'
  | 'open'
  | 'pay'
  | 'void'
  | 'markUncollectible'
  | 'creditNote';

export interface InvoiceActionBody {
  action: InvoiceActionKind;
  invoiceId?: string;
  customerId?: string;
  amountCents?: number;
  currency?: string;
  creditAmountCents?: number;
}

/**
 * `GET /invoice` — returns the persisted invoice list. Real Stripe paginates;
 * the mock returns everything.
 */
export function createInvoiceListHandler(
  adapter: StripeBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(_req: Request): Promise<Response> {
    const invoices = adapter.listInvoices();
    return jsonResponse(200, { invoices });
  };
}

/**
 * `POST /invoice/action` — dispatches an invoice-lifecycle action. Every
 * action returns the updated invoice (or the newly created one).
 */
export function createInvoiceActionHandler(
  adapter: StripeBillingAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: InvoiceActionBody;
    try {
      body = (await req.json()) as InvoiceActionBody;
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
        case 'draft': {
          if (!body.customerId || typeof body.amountCents !== 'number') {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'customerId and amountCents required for draft',
            });
          }
          if (body.amountCents <= 0) {
            return jsonResponse(400, {
              error: 'invalid_amount',
              message: `amountCents must be > 0 (got ${body.amountCents})`,
            });
          }
          const input: {
            customerId: string;
            amountCents: number;
            currency?: string;
          } = {
            customerId: body.customerId,
            amountCents: body.amountCents,
          };
          if (body.currency !== undefined) input.currency = body.currency;
          const invoice = await adapter.draftInvoice(input);
          return jsonResponse(200, { invoice });
        }
        case 'open': {
          if (!body.invoiceId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'invoiceId is required',
            });
          }
          const invoice = await adapter.openInvoice(body.invoiceId);
          return jsonResponse(200, { invoice });
        }
        case 'pay': {
          if (!body.invoiceId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'invoiceId is required',
            });
          }
          const invoice = await adapter.payInvoice(body.invoiceId);
          return jsonResponse(200, { invoice });
        }
        case 'void': {
          if (!body.invoiceId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'invoiceId is required',
            });
          }
          const invoice = await adapter.voidInvoice(body.invoiceId);
          return jsonResponse(200, { invoice });
        }
        case 'markUncollectible': {
          if (!body.invoiceId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'invoiceId is required',
            });
          }
          const invoice = await adapter.markInvoiceUncollectible(body.invoiceId);
          return jsonResponse(200, { invoice });
        }
        case 'creditNote': {
          if (
            !body.invoiceId ||
            typeof body.creditAmountCents !== 'number' ||
            body.creditAmountCents <= 0
          ) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'invoiceId and positive creditAmountCents required',
            });
          }
          const input: CreditNoteInput = {
            invoiceId: body.invoiceId,
            creditAmountCents: body.creditAmountCents,
          };
          const invoice = await adapter.creditNote(input);
          return jsonResponse(200, { invoice });
        }
        default:
          return jsonResponse(400, {
            error: 'unknown_action',
            message: `unknown action: ${String(body.action)}`,
          });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Semantics-layer guards throw for illegal transitions — 409 Conflict
      // is the standard HTTP mapping. Each matcher targets a specific guard
      // in packages/payment/src/semantics/invoice.ts so unrelated errors
      // (env-missing, TypeError) fall through to 500 unchanged.
      if (
        message.includes('cannot void') ||
        message.includes('must be paid') ||
        message.includes('exceeds invoice') ||
        message.includes('creditAmountCents must be > 0') ||
        /invoice inv_\S+ is \w+/.test(message) ||
        message.includes('not found')
      ) {
        return jsonResponse(409, {
          error: 'illegal_transition',
          message,
        });
      }
      const status = message.includes('KIWA_STRIPE_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'invoice_action_failed',
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
