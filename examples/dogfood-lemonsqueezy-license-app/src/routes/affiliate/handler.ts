/**
 * `POST /affiliate/{action}` handler. Registers affiliates + records
 * referral conversions at order paid time. Commission is computed by
 * tier policy at the moment of conversion (see lib/affiliate-tier.ts).
 */

import type {
  AffiliateConvertInput,
  AffiliateRegisterInput,
  LemonSqueezyLicenseAdapter,
} from '../../adapters/interface.js';
import type { AffiliateReferralRecord } from '../../lib/store.js';

export type AffiliateAction = 'register' | 'convert' | 'claw-back';

export type AffiliateRouteResult =
  | { ok: true; status: 200; body: AffiliateReferralRecord | { registered: string } | { clawedBack: true } }
  | { ok: false; status: 400 | 404; body: { error: string; kind: string } };

export function makeAffiliateRoute(
  adapter: LemonSqueezyLicenseAdapter,
): (
  action: AffiliateAction,
  input: AffiliateRegisterInput | AffiliateConvertInput | { orderId: string },
) => Promise<AffiliateRouteResult> {
  return async (action, input) => {
    try {
      if (action === 'register') {
        const typed = input as AffiliateRegisterInput;
        await adapter.registerAffiliate(typed);
        return { ok: true, status: 200, body: { registered: typed.affiliateId } };
      }
      if (action === 'convert') {
        const body = await adapter.recordAffiliateConversion(input as AffiliateConvertInput);
        return { ok: true, status: 200, body };
      }
      if (action === 'claw-back') {
        const typed = input as { orderId: string };
        const result = await adapter.refundAffiliateCommission(typed.orderId);
        if (result === undefined) {
          return {
            ok: false,
            status: 404,
            body: { error: 'referral_not_found', kind: 'referral_not_found' },
          };
        }
        return { ok: true, status: 200, body: { clawedBack: true } };
      }
      return {
        ok: false,
        status: 400,
        body: { error: 'unknown_action', kind: 'unknown_action' },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const kind = message === 'affiliate_not_found' ? 'affiliate_not_found' : message;
      const status: 400 | 404 = message === 'affiliate_not_found' ? 404 : 400;
      return { ok: false, status, body: { error: message, kind } };
    }
  };
}
