/**
 * Real adapter — drives a SimpleWebAuthn-shaped RP server backed by a real
 * Chrome Virtual Authenticator. On systems without a headed browser
 * (`DISPLAY` unset on Linux, or the Playwright browsers not installed) the
 * adapter refuses to run and every method reports
 * `KIWA_WEBAUTHN_ENV_MISSING`. Downstream tests inspect
 * {@link WebAuthnRPAdapter.mode} + the trace to skip real assertions on
 * those systems.
 *
 * Full Playwright wiring lands in Sub-Issue #857 (`/signin` + Chrome
 * Virtual Authenticator). Sub-Issue #856 (this one) lands the env-detect
 * skeleton so the fidelity harness can uniformly drive both adapters even
 * when only the mock has an actual body.
 */

import type { WebAuthnCredential } from '@kiwa-lab/auth';
import type {
  RegisterInput,
  RegisterResult,
  SigninInput,
  SigninResult,
  TraceEvent,
  WebAuthnRPAdapter,
} from './interface.js';

const MISSING_ENV_ERROR = 'KIWA_WEBAUTHN_ENV_MISSING';

/**
 * Report whether the current process can talk to a headed Chrome. Returns
 * `null` on capable systems, or a short reason string when the env is
 * missing (used to populate `TraceEvent.errorKind`).
 */
export function detectRealEnvMissing(): string | null {
  // KIWA_MODE=mock is the explicit "please stay mock" toggle used by tests
  // that want to compare mock-vs-mock without touching Chrome.
  if (process.env['KIWA_MODE'] === 'mock') return 'KIWA_MODE=mock';
  // DISPLAY absence is the usual signal on headless Linux; on macOS + Windows
  // the browsers cluster is available as long as Playwright is installed.
  if (process.platform === 'linux' && !process.env['DISPLAY']) {
    return 'DISPLAY unset';
  }
  // The `KIWA_WEBAUTHN_REAL_READY=1` env flag opts in to real ceremonies once
  // Playwright + Chrome Virtual Authenticator wiring is in place. Until it is
  // set every ceremony errors out with MISSING_ENV_ERROR — Sub-Issue #857
  // (this one) ships the Playwright e2e that flips the flag inside a
  // BrowserContext driven by Chrome DevTools Protocol's
  // `WebAuthn.addVirtualAuthenticator`.
  if (process.env['KIWA_WEBAUTHN_REAL_READY'] === '1') return null;
  return MISSING_ENV_ERROR;
}

export function makeRealAdapter(): WebAuthnRPAdapter {
  const trace: TraceEvent[] = [];
  const store = new Map<string, WebAuthnCredential>();

  function record(op: TraceEvent['op'], ok: boolean, extra?: Partial<TraceEvent>): void {
    const entry: TraceEvent = { op, ok };
    if (extra?.errorKind !== undefined) entry.errorKind = extra.errorKind;
    if (extra?.detail !== undefined) entry.detail = extra.detail;
    trace.push(entry);
  }

  function envError(op: TraceEvent['op']): Error {
    const reason = detectRealEnvMissing() ?? MISSING_ENV_ERROR;
    record(op, false, { errorKind: reason });
    return new Error(`makeRealAdapter.${op}: ${reason}`);
  }

  return {
    mode: 'real',
    traces: () => [...trace],

    async register(_input: RegisterInput): Promise<RegisterResult> {
      throw envError('register');
    },

    async signin(_input: SigninInput): Promise<SigninResult> {
      // Sub-Issue #857 wires this to Playwright + Chrome Virtual Authenticator;
      // without `KIWA_WEBAUTHN_REAL_READY=1` the ceremony refuses so the
      // fidelity harness reports env-missing rather than silently returning a
      // fabricated response.
      throw envError('signin');
    },

    listCredentials(): WebAuthnCredential[] {
      const creds = Array.from(store.values());
      record('listCredentials', true, { detail: { count: creds.length } });
      return creds;
    },

    deleteCredential(credentialId): boolean {
      const removed = store.delete(credentialId);
      record('deleteCredential', removed, { detail: { credentialId } });
      return removed;
    },

    async reset(): Promise<void> {
      store.clear();
      trace.length = 0;
      record('reset', true);
    },
  };
}
