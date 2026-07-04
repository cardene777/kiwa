import { createVirtualAuthenticator } from '../webauthn/authenticator.js';
import type {
  WebAuthnCredential,
  WebAuthnTransport,
} from '../webauthn/types.js';
import type {
  RoamingAuthenticator,
  RoamingAuthenticatorOptions,
} from './types.js';

/**
 * Map the roaming kind to the wire transport the mock uses. `security-key`
 * defaults to `usb` (the common YubiKey path). `phone` defaults to `hybrid`
 * — the transport rebranded to caBLE in later WebAuthn drafts, used for the
 * phone-based cross-device sign-in flow initiated via QR code + BLE.
 */
function resolveRoamingTransport(
  kind: RoamingAuthenticatorOptions['kind'],
): WebAuthnTransport {
  if (kind === 'security-key') return 'usb';
  if (kind === 'phone') return 'hybrid';
  throw new Error(
    `createRoamingAuthenticator: unknown roaming kind "${kind}" — expected security-key or phone`,
  );
}

/**
 * Build a roaming authenticator (security key / phone via caBLE). Roaming
 * authenticators are portable — the factory pins `attachment: cross-platform`
 * and picks the wire transport from `kind`. Unlike platform authenticators,
 * roaming authenticators can be non-discoverable (a bare U2F-style token) —
 * the caller decides via `hasResidentKey`.
 */
export function createRoamingAuthenticator(
  options: RoamingAuthenticatorOptions,
): { handle: RoamingAuthenticator; credentials: Map<string, WebAuthnCredential> } {
  const transport = resolveRoamingTransport(options.kind);
  const { handle: base, credentials } = createVirtualAuthenticator({
    attachment: 'cross-platform',
    transport,
    hasResidentKey: options.hasResidentKey ?? true,
    hasUserVerification: options.hasUserVerification ?? true,
    ...(options.isUserPresent === undefined
      ? {}
      : { isUserPresent: options.isUserPresent }),
  });
  const handle: RoamingAuthenticator = {
    id: base.id,
    attachment: base.attachment,
    transport: base.transport,
    hasResidentKey: base.hasResidentKey,
    hasUserVerification: base.hasUserVerification,
    get isUserPresent(): boolean {
      return base.isUserPresent;
    },
    set isUserPresent(value: boolean) {
      base.isUserPresent = value;
    },
    listCredentials: () => base.listCredentials(),
    kind: 'roaming' as const,
    roamingKind: options.kind,
  };
  return { handle, credentials };
}
