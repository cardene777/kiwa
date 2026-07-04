import { setupOAuth21Env } from '../oauth21/setup-oauth21-env.js';
import {
  __resetDcrCounter,
  dynamicClientRegistration,
} from './dcr.js';
import { createDiscoveryEndpoint } from './discovery.js';
import { resolveTrustChain } from './federation.js';
import { __resetIdTokenCounter, createIdTokenSigner } from './id-token.js';
import { __resetJwksCounter, createJwksEndpoint } from './jwks.js';
import type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  IdToken,
  OidcTestEnv,
  ResolveTrustChainInput,
  SetupOidcEnvOptions,
  SignIdTokenInput,
  TrustChainResult,
  VerifyIdTokenOptions,
  VerifyIdTokenResult,
} from './types.js';

/**
 * Reset every module-scope counter used by the OIDC adapter so consecutive
 * `setupOidcEnv` calls produce stable, deterministic ids.
 */
export function __resetOidcCounters(): void {
  __resetJwksCounter();
  __resetDcrCounter();
  __resetIdTokenCounter();
}

/**
 * Set up the OIDC test environment. Composes:
 *   - the OAuth 2.1 mock AS (OIDC layers on top of it),
 *   - the Discovery endpoint (`/.well-known/openid-configuration`),
 *   - the JWKS endpoint (RS256 / ES256 + kid rotation + retention),
 *   - the DCR endpoint (RFC 7591),
 *   - the id_token signer + verifier (OIDC Core §2 + §3.1.3.6-7),
 *   - the Federation trust-chain resolver (OIDF 1.0 §7).
 *
 * The env is hermetic — every mutation goes through the returned surface, and
 * a single `stop()` disposes the underlying OAuth 2.1 AS + resets the OIDC
 * state.
 */
export async function setupOidcEnv(
  options: SetupOidcEnvOptions = {},
): Promise<OidcTestEnv> {
  const issuer = (options.issuer ?? 'https://op.example.test').replace(/\/$/, '');

  const oauth21 = await setupOAuth21Env({
    issuer,
    ...(options.clients === undefined ? {} : { clients: options.clients }),
    ...(options.users === undefined ? {} : { users: options.users }),
    ...(options.accessTokenLifetimeSec === undefined
      ? {}
      : { accessTokenLifetimeSec: options.accessTokenLifetimeSec }),
    ...(options.refreshTokenLifetimeSec === undefined
      ? {}
      : { refreshTokenLifetimeSec: options.refreshTokenLifetimeSec }),
    ...(options.now === undefined ? {} : { now: options.now }),
  });

  const discovery = createDiscoveryEndpoint({ issuer });
  const jwksUrl = discovery.fetch().jwks_uri;
  const jwks = createJwksEndpoint({
    url: jwksUrl,
    ...(options.jwksRetentionSec === undefined
      ? {}
      : { retentionSec: options.jwksRetentionSec }),
    ...(options.now === undefined ? {} : { now: options.now }),
  });

  const signer = createIdTokenSigner({
    issuer,
    jwks,
    ...(options.idTokenLifetimeSec === undefined
      ? {}
      : { defaultLifetimeSec: options.idTokenLifetimeSec }),
    ...(options.now === undefined ? {} : { now: options.now }),
  });

  function registerClient(request: ClientRegistrationRequest): ClientRegistrationResponse {
    return dynamicClientRegistration(
      {
        server: oauth21.server,
        ...(options.softwareStatementIssuer === undefined
          ? {}
          : { softwareStatementTrustAnchor: options.softwareStatementIssuer }),
        ...(options.now === undefined ? {} : { now: options.now }),
      },
      request,
    );
  }

  function signIdToken(input: SignIdTokenInput): IdToken {
    return signer.sign(input);
  }

  function verifyIdToken(jwt: string, verifyOptions: VerifyIdTokenOptions): VerifyIdTokenResult {
    return signer.verify(jwt, verifyOptions);
  }

  function resolveTrustChainBinding(input: ResolveTrustChainInput): TrustChainResult {
    return resolveTrustChain(input);
  }

  const env: OidcTestEnv = {
    mode: 'mock',
    issuer,
    discovery,
    jwks,
    server: oauth21.server,
    oauth21,
    registerClient,
    signIdToken,
    verifyIdToken,
    resolveTrustChain: resolveTrustChainBinding,
    reset(): void {
      oauth21.reset();
    },
    async stop(): Promise<void> {
      await oauth21.stop();
    },
  };

  return env;
}
