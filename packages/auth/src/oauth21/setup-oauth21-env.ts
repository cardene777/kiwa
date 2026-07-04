import { createAuthorizationServer } from './authorization-server.js';
import { __resetDpopCounters, createDpopProof } from './dpop.js';
import {
  __resetPkceCounter,
  createPkceChallenge,
  deriveCodeChallenge,
  generateCodeVerifier,
} from './pkce.js';
import { __resetTokenCounters } from './refresh-rotation.js';
import type {
  DpopProof,
  DpopProofInput,
  OAuth21TestEnv,
  PkceChallenge,
  PkceChallengeMethod,
  SetupOAuth21EnvOptions,
  TokenResponse,
} from './types.js';

/**
 * Reset every module-scope counter used by the OAuth 2.1 adapter so
 * consecutive `setupOAuth21Env` calls produce stable, deterministic ids.
 */
export function __resetOAuth21Counters(): void {
  __resetPkceCounter();
  __resetDpopCounters();
  __resetTokenCounters();
}

/**
 * Set up the OAuth 2.1 test environment. Composes a mock Authorization Server
 * with PKCE + DPoP helpers so a test can drive the full RFC 9700 flow through
 * a single handle.
 *
 * The env is hermetic — every mutation goes through the returned surface, and
 * a single `stop()` disposes the AS state. Consecutive `setupOAuth21Env`
 * calls in the same process should be preceded by `__resetOAuth21Counters()`
 * when reproducibility of ids matters.
 */
export async function setupOAuth21Env(
  options: SetupOAuth21EnvOptions = {},
): Promise<OAuth21TestEnv> {
  const server = createAuthorizationServer(options);

  function createDpopProofBinding(input: DpopProofInput): DpopProof {
    return createDpopProof(input);
  }

  function derivePkceChallenge(
    verifier: string,
    method?: PkceChallengeMethod,
  ): string {
    return deriveCodeChallenge(verifier, method);
  }

  function refreshToken(
    refreshToken: string,
    clientId: string,
    dpop?: DpopProof,
  ): TokenResponse {
    return server.token({
      grantType: 'refresh_token',
      refreshToken,
      clientId,
      ...(dpop === undefined ? {} : { dpop }),
    });
  }

  function createPkceChallengeBinding(): PkceChallenge {
    return createPkceChallenge();
  }

  const env: OAuth21TestEnv = {
    mode: 'mock',
    server,
    generateCodeVerifier,
    deriveCodeChallenge: derivePkceChallenge,
    createPkceChallenge: createPkceChallengeBinding,
    createDpopProof: createDpopProofBinding,
    refreshToken,
    reset(): void {
      server.reset();
    },
    async stop(): Promise<void> {
      server.reset();
    },
  };

  return env;
}
