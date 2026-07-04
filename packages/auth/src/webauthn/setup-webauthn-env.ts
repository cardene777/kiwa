import {
  __resetAuthenticatorCounter,
  createVirtualAuthenticator,
} from './authenticator.js';
import { __resetCredentialCounter, credentialCreation } from './creation.js';
import { credentialAssertion } from './assertion.js';
import type {
  AuthenticatorAssertionResponse,
  AuthenticatorAttestationResponse,
  PublicKeyCredentialCreationOptionsInit,
  PublicKeyCredentialRequestOptionsInit,
  SetupWebAuthnEnvOptions,
  VirtualAuthenticator,
  VirtualAuthenticatorOptions,
  WebAuthnCredential,
  WebAuthnTestEnv,
} from './types.js';

/**
 * Full test-env reset — restarts credential IDs and authenticator IDs from 1
 * so consecutive `setupWebAuthnEnv` calls produce stable, deterministic IDs.
 * Exposed for tests that want to reset counters without tearing down the env
 * object itself.
 */
export function __resetWebAuthnCounters(): void {
  __resetAuthenticatorCounter();
  __resetCredentialCounter();
}

/**
 * Set up the WebAuthn test environment. Creates zero or more virtual
 * authenticators (as configured), a shared credential registry, and returns a
 * `WebAuthnTestEnv` handle. Follow-on calls (`credentialCreation` /
 * `credentialAssertion`) go through the returned env.
 *
 * When no authenticator is passed the env is empty — the caller adds
 * authenticators lazily with `addAuthenticator`. Most tests preseed one
 * platform authenticator to mirror the Chrome DevTools "add virtual
 * authenticator" workflow.
 */
export async function setupWebAuthnEnv(
  opts: SetupWebAuthnEnvOptions = {},
): Promise<WebAuthnTestEnv> {
  // Registry the RP would keep in its own database. The mock owns it so a
  // single credential lookup covers every authenticator in the env.
  const globalRegistry = new Map<string, WebAuthnCredential>();
  const authenticators: VirtualAuthenticator[] = [];
  const credentialStores = new Map<string, Map<string, WebAuthnCredential>>();
  // credentialId -> authenticatorId. Assertion routes through the owning
  // authenticator so a credential cannot float to a sibling authenticator that
  // happens to share a transport.
  const credentialOwnership = new Map<string, string>();

  function addAuthenticator(options: VirtualAuthenticatorOptions): VirtualAuthenticator {
    const { handle, credentials } = createVirtualAuthenticator(options);
    authenticators.push(handle);
    credentialStores.set(handle.id, credentials);
    return handle;
  }

  for (const authenticatorOpts of opts.authenticators ?? []) {
    addAuthenticator(authenticatorOpts);
  }

  function pickAuthenticator(
    authenticatorId: string | undefined,
  ): VirtualAuthenticator {
    if (authenticators.length === 0) {
      throw new Error(
        'setupWebAuthnEnv: no authenticator available — call addAuthenticator first or preseed via options.authenticators',
      );
    }
    if (authenticatorId) {
      const found = authenticators.find((auth) => auth.id === authenticatorId);
      if (!found) {
        throw new Error(
          `setupWebAuthnEnv: unknown authenticatorId "${authenticatorId}"`,
        );
      }
      return found;
    }
    // Default = first authenticator, matches the single-authenticator common case.
    return authenticators[0]!;
  }

  const env: WebAuthnTestEnv = {
    mode: 'mock',
    authenticators,
    addAuthenticator,
    removeAuthenticator(id: string): void {
      const index = authenticators.findIndex((auth) => auth.id === id);
      if (index === -1) return;
      authenticators.splice(index, 1);
      const store = credentialStores.get(id);
      if (store) {
        for (const credentialId of store.keys()) {
          globalRegistry.delete(credentialId);
          credentialOwnership.delete(credentialId);
        }
        credentialStores.delete(id);
      }
    },
    async credentialCreation(
      options: PublicKeyCredentialCreationOptionsInit,
      authenticatorId?: string,
    ): Promise<AuthenticatorAttestationResponse> {
      const authenticator = pickAuthenticator(authenticatorId);
      const store = credentialStores.get(authenticator.id)!;
      return credentialCreation(
        options,
        authenticator,
        store,
        globalRegistry,
        credentialOwnership,
      );
    },
    async credentialAssertion(
      options: PublicKeyCredentialRequestOptionsInit,
    ): Promise<AuthenticatorAssertionResponse> {
      return credentialAssertion(
        options,
        globalRegistry,
        authenticators,
        credentialOwnership,
      );
    },
    getCredential(credentialId: string): WebAuthnCredential | null {
      return globalRegistry.get(credentialId) ?? null;
    },
    listCredentials(): WebAuthnCredential[] {
      return Array.from(globalRegistry.values());
    },
    deleteCredential(credentialId: string): boolean {
      if (!globalRegistry.delete(credentialId)) return false;
      credentialOwnership.delete(credentialId);
      for (const store of credentialStores.values()) {
        store.delete(credentialId);
      }
      return true;
    },
    reset(): void {
      globalRegistry.clear();
      credentialOwnership.clear();
      for (const store of credentialStores.values()) {
        store.clear();
      }
    },
    async stop(): Promise<void> {
      globalRegistry.clear();
      credentialOwnership.clear();
      credentialStores.clear();
      authenticators.splice(0, authenticators.length);
    },
  };

  return env;
}
