/**
 * SvelteKit route logic for `POST /license/action` and `GET /license`.
 *
 * Dispatches a license key lifecycle transition — issue / activate /
 * revoke — via a single POST endpoint keyed by the `action` field. Real
 * Lemon Squeezy uses distinct URLs (`POST /v1/licenses/activate` /
 * `POST /v1/licenses/deactivate`); the dogfood app collapses them for
 * uniformity with the Nuxt subscription-action pattern.
 */

import type {
  LemonSqueezyDogfoodAdapter,
  LicenseActivateInput,
  LicenseIssueInput,
  LicenseRevokeInput,
} from '../../adapters/interface.js';

export type LicenseActionKind = 'issue' | 'activate' | 'revoke';

export interface LicenseActionBody {
  action: LicenseActionKind;
  licenseKeyId?: string;
  orderId?: string;
  customerId?: string;
  variantId?: string;
  activationsLimit?: number;
  expiresAt?: number;
  instanceName?: string;
  instanceId?: string;
}

export function createLicenseActionHandler(
  adapter: LemonSqueezyDogfoodAdapter,
): (req: Request) => Promise<Response> {
  return async function POST(req: Request): Promise<Response> {
    let body: LicenseActionBody;
    try {
      body = (await req.json()) as LicenseActionBody;
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
        case 'issue': {
          if (!body.orderId || !body.customerId || !body.variantId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'orderId, customerId, variantId required for issue',
            });
          }
          const input: LicenseIssueInput = {
            orderId: body.orderId,
            customerId: body.customerId,
            variantId: body.variantId,
          };
          if (body.activationsLimit !== undefined) input.activationsLimit = body.activationsLimit;
          if (body.expiresAt !== undefined) input.expiresAt = body.expiresAt;
          const record = await adapter.issueLicenseKey(input);
          return jsonResponse(200, { license: record });
        }
        case 'activate': {
          if (!body.licenseKeyId || !body.instanceName) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'licenseKeyId, instanceName required for activate',
            });
          }
          const input: LicenseActivateInput = {
            licenseKeyId: body.licenseKeyId,
            instanceName: body.instanceName,
          };
          const record = await adapter.activateLicense(input);
          return jsonResponse(200, { license: record });
        }
        case 'revoke': {
          if (!body.licenseKeyId || !body.instanceId) {
            return jsonResponse(400, {
              error: 'missing_fields',
              message: 'licenseKeyId, instanceId required for revoke',
            });
          }
          const input: LicenseRevokeInput = {
            licenseKeyId: body.licenseKeyId,
            instanceId: body.instanceId,
          };
          const record = await adapter.revokeLicense(input);
          return jsonResponse(200, { license: record });
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
        message.includes('activations limit reached') ||
        message.includes('already revoked') ||
        message.includes('is disabled') ||
        message.includes('is expired') ||
        message.includes('is inactive') ||
        message.includes('not found')
      ) {
        return jsonResponse(409, {
          error: 'illegal_transition',
          message,
        });
      }
      const status = message.includes('KIWA_LEMONSQUEEZY_ENV_MISSING') ? 503 : 500;
      return jsonResponse(status, {
        error: 'license_action_failed',
        message,
      });
    }
  };
}

export function createLicenseListHandler(
  adapter: LemonSqueezyDogfoodAdapter,
): (req: Request) => Promise<Response> {
  return async function GET(_req: Request): Promise<Response> {
    return jsonResponse(200, { licenses: adapter.listLicenseKeys() });
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
