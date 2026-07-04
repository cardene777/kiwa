import { randomBytes } from 'node:crypto';
import type { AccessToken, RefreshToken } from './types.js';

/**
 * Module-scoped monotonic counters so consecutive `setupOAuth21Env` calls
 * produce reproducible token strings when the caller reads them back.
 */
let accessTokenCounter = 0;
let refreshTokenCounter = 0;

export function __resetTokenCounters(): void {
  accessTokenCounter = 0;
  refreshTokenCounter = 0;
}

function base64Url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Mint a fresh access token. Access tokens carry state (`clientId`, `subject`,
 * `scope`, expiration) so the introspection endpoint can echo them without a
 * separate lookup. Real deployments encode this as a signed JWT; the mock
 * hands the state back to the caller who stores it in the AS registry.
 */
export function mintAccessToken(params: {
  clientId: string;
  subject: string;
  scope: string;
  lifetimeSec: number;
  now: () => number;
  dpopJkt?: string;
  resource?: string;
}): AccessToken {
  accessTokenCounter += 1;
  const suffix = base64Url(randomBytes(12));
  const token = `at-${accessTokenCounter.toString().padStart(4, '0')}.${suffix}`;
  return {
    token,
    tokenType: params.dpopJkt ? 'DPoP' : 'Bearer',
    expiresAt: Math.floor(params.now() / 1000) + params.lifetimeSec,
    scope: params.scope,
    clientId: params.clientId,
    subject: params.subject,
    ...(params.dpopJkt === undefined ? {} : { dpopJkt: params.dpopJkt }),
    ...(params.resource === undefined ? {} : { resource: params.resource }),
  };
}

/**
 * Mint a fresh refresh token. Refresh tokens are opaque strings the AS binds
 * to a client + subject + scope. The mock keeps them separate from access
 * tokens so the rotation registry is easy to inspect.
 */
export function mintRefreshToken(params: {
  clientId: string;
  subject: string;
  scope: string;
  lifetimeSec: number;
  now: () => number;
  rotationCount?: number;
  dpopJkt?: string;
  resource?: string;
}): RefreshToken {
  refreshTokenCounter += 1;
  const suffix = base64Url(randomBytes(12));
  const token = `rt-${refreshTokenCounter.toString().padStart(4, '0')}.${suffix}`;
  return {
    token,
    clientId: params.clientId,
    subject: params.subject,
    scope: params.scope,
    rotationCount: params.rotationCount ?? 0,
    expiresAt: Math.floor(params.now() / 1000) + params.lifetimeSec,
    revoked: false,
    ...(params.dpopJkt === undefined ? {} : { dpopJkt: params.dpopJkt }),
    ...(params.resource === undefined ? {} : { resource: params.resource }),
  };
}

/**
 * Rotate a refresh token — invalidate the previous token and mint a fresh
 * one that inherits the client + subject + scope. RFC 9700 §2.2 mandates
 * this on every `/token` refresh call to defeat replay of an exfiltrated
 * refresh token.
 *
 * Returns the newly-minted refresh token; the caller replaces the old token
 * in the AS registry with the returned value.
 */
export function rotateRefreshToken(
  previous: RefreshToken,
  lifetimeSec: number,
  now: () => number,
  overrides?: { scope?: string; dpopJkt?: string; resource?: string },
): RefreshToken {
  if (previous.revoked) {
    throw new Error(
      `rotateRefreshToken: refresh token "${previous.token}" is already revoked — rotation not permitted (RFC 9700 §2.2 replay defence)`,
    );
  }
  const nextRotationCount = previous.rotationCount + 1;
  const next = mintRefreshToken({
    clientId: previous.clientId,
    subject: previous.subject,
    scope: overrides?.scope ?? previous.scope,
    lifetimeSec,
    now,
    rotationCount: nextRotationCount,
    ...(overrides?.dpopJkt === undefined
      ? previous.dpopJkt === undefined
        ? {}
        : { dpopJkt: previous.dpopJkt }
      : { dpopJkt: overrides.dpopJkt }),
    ...(overrides?.resource === undefined
      ? previous.resource === undefined
        ? {}
        : { resource: previous.resource }
      : { resource: overrides.resource }),
  });
  return next;
}
