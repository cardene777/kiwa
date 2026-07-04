import type {
  VirtualAuthenticator,
  VirtualAuthenticatorOptions,
  WebAuthnCredential,
} from './types.js';

let authenticatorCounter = 0;

/**
 * Reset the module-scoped counter — test-only affordance so consecutive suites
 * start with `authenticator-1` instead of an arbitrary offset.
 */
export function __resetAuthenticatorCounter(): void {
  authenticatorCounter = 0;
}

/**
 * Build a Chrome Virtual Authenticator API compatible mock. Mirrors the shape
 * of `WebAuthn.addVirtualAuthenticator` in the Chrome DevTools protocol which
 * Playwright and Puppeteer surface as `page.context().addInitScript(...)` /
 * `CDPSession.send('WebAuthn.addVirtualAuthenticator', ...)`.
 *
 * The mock keeps credentials in a `Map<credentialId, WebAuthnCredential>` and
 * hands out an internal view — the RP-facing surface goes through
 * `WebAuthnTestEnv` instead.
 */
export function createVirtualAuthenticator(
  options: VirtualAuthenticatorOptions,
): {
  handle: VirtualAuthenticator;
  credentials: Map<string, WebAuthnCredential>;
} {
  const attachment = options.attachment;
  if (attachment !== 'platform' && attachment !== 'cross-platform') {
    throw new Error(
      `createVirtualAuthenticator: unknown attachment "${attachment}" — expected "platform" or "cross-platform"`,
    );
  }
  const transport = options.transport;
  if (
    transport !== 'internal' &&
    transport !== 'usb' &&
    transport !== 'nfc' &&
    transport !== 'ble' &&
    transport !== 'hybrid'
  ) {
    throw new Error(
      `createVirtualAuthenticator: unknown transport "${transport}" — expected one of internal / usb / nfc / ble / hybrid`,
    );
  }
  // Platform authenticators are internal-only; cross-platform authenticators
  // never use the internal transport. WebAuthn L3 §5.4.5 pins this pairing.
  if (attachment === 'platform' && transport !== 'internal') {
    throw new Error(
      `createVirtualAuthenticator: platform attachment requires internal transport, got "${transport}"`,
    );
  }
  if (attachment === 'cross-platform' && transport === 'internal') {
    throw new Error(
      'createVirtualAuthenticator: cross-platform attachment cannot use internal transport',
    );
  }

  const credentials = new Map<string, WebAuthnCredential>();
  authenticatorCounter += 1;
  const id = `authenticator-${authenticatorCounter}`;

  const state = {
    isUserPresent: options.isUserPresent ?? true,
  };

  const handle: VirtualAuthenticator = {
    id,
    attachment,
    transport,
    hasResidentKey: options.hasResidentKey ?? false,
    hasUserVerification: options.hasUserVerification ?? true,
    get isUserPresent(): boolean {
      return state.isUserPresent;
    },
    set isUserPresent(value: boolean) {
      state.isUserPresent = value;
    },
    listCredentials(): WebAuthnCredential[] {
      return Array.from(credentials.values());
    },
  };

  return { handle, credentials };
}
