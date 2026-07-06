/**
 * `POST /license/{action}` handler — routes issue / activate / deactivate
 * license actions to the adapter and classifies domain errors into
 * stable string kinds so tests can pin without message matching.
 */

import type {
  LemonSqueezyLicenseAdapter,
  LicenseActivateInput,
  LicenseDeactivateInput,
  LicenseIssueInput,
} from '../../adapters/interface.js';
import type {
  LicenseActivation,
  LicenseKeyRecord,
} from '../../lib/store.js';

export type LicenseAction = 'issue' | 'activate' | 'deactivate';

export type LicenseRouteResult =
  | { ok: true; status: 200; body: LicenseKeyRecord | LicenseActivation }
  | { ok: false; status: 400 | 404 | 409; body: { error: string; kind: string } };

export function makeLicenseRoute(
  adapter: LemonSqueezyLicenseAdapter,
): (
  action: LicenseAction,
  input: LicenseIssueInput | LicenseActivateInput | LicenseDeactivateInput,
) => Promise<LicenseRouteResult> {
  return async (action, input) => {
    try {
      if (action === 'issue') {
        const body = await adapter.issueLicenseKey(input as LicenseIssueInput);
        return { ok: true, status: 200, body };
      }
      if (action === 'activate') {
        const body = await adapter.activateLicense(input as LicenseActivateInput);
        return { ok: true, status: 200, body };
      }
      if (action === 'deactivate') {
        const body = await adapter.deactivateLicense(input as LicenseDeactivateInput);
        return { ok: true, status: 200, body };
      }
      return {
        ok: false,
        status: 400,
        body: { error: 'unknown_action', kind: 'unknown_action' },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const { status, kind } = classifyLicenseError(message);
      return { ok: false, status, body: { error: message, kind } };
    }
  };
}

function classifyLicenseError(message: string): {
  status: 400 | 404 | 409;
  kind: string;
} {
  if (message === 'license_not_found' || message === 'license_instance_not_found') {
    return { status: 404, kind: message };
  }
  if (message === 'license_limit_reached') {
    return { status: 409, kind: 'license_limit_reached' };
  }
  if (message.startsWith('license_is_')) {
    return { status: 409, kind: message };
  }
  return { status: 400, kind: message };
}
