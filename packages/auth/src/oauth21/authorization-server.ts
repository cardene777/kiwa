import { randomBytes } from 'node:crypto';
import { computeJkt, parseDpopProof, verifyDpopProof } from './dpop.js';
import { verifyCodeChallenge } from './pkce.js';
import {
  mintAccessToken,
  mintRefreshToken,
  rotateRefreshToken,
} from './refresh-rotation.js';
import type {
  AccessToken,
  AuthorizationRequest,
  AuthorizationResponse,
  AuthorizationServer,
  AuthorizationServerOptions,
  AuthorizationUser,
  ClientRegistration,
  IntrospectionResponse,
  RefreshToken,
  TokenRequest,
  TokenResponse,
} from './types.js';

/**
 * Mock Authorization Server implementing the RFC 9700 (OAuth 2.1) endpoint
 * surface: `/authorize`, `/token`, `/revoke`, `/introspect`. The mock keeps
 * every piece of state in-memory so a test can drive the AS through method
 * calls without HTTP plumbing.
 *
 * Notable enforcement (matches OAuth 2.1 hardening):
 *   - `response_type=code` only. `token` (implicit) is refused.
 *   - PKCE always mandatory. `code_challenge_method=plain` refused.
 *   - `grant_type=password` and `grant_type=client_credentials` refused.
 *   - Refresh tokens rotate on every use per RFC 9700 §2.2.
 *   - Revoked / expired / re-used refresh tokens are rejected.
 *   - DPoP-bound tokens verify the JWK thumbprint on `/token`.
 *   - `jti` replay defence guards the DPoP proof registry.
 */
export function createAuthorizationServer(
  options: AuthorizationServerOptions = {},
): AuthorizationServer {
  const issuer = options.issuer ?? 'https://as.example.test';
  const now = options.now ?? (() => Date.now());
  const accessLifetime = options.accessTokenLifetimeSec ?? 3600;
  const refreshLifetime = options.refreshTokenLifetimeSec ?? 86400;
  const iatSkewSec = options.dpopIatSkewSec ?? 60;

  const clients = new Map<string, ClientRegistration>();
  const users = new Map<string, AuthorizationUser>();
  const codes = new Map<string, IssuedCode>();
  const accessTokens = new Map<string, AccessToken>();
  const refreshTokens = new Map<string, RefreshToken>();
  // Track invalidated refresh tokens so the AS can reject re-use after
  // rotation (RFC 9700 §2.2). Distinct from a plain revoke to signal that
  // reuse should tear down the family.
  const rotatedRefreshTokens = new Map<string, RefreshToken>();
  const seenJtis = new Set<string>();

  for (const client of options.clients ?? []) {
    clients.set(client.clientId, client);
  }
  for (const user of options.users ?? []) {
    users.set(user.subject, user);
  }

  function registerClient(client: ClientRegistration): void {
    if (clients.has(client.clientId)) {
      throw new Error(
        `registerClient: client "${client.clientId}" already registered`,
      );
    }
    clients.set(client.clientId, client);
  }

  function registerUser(user: AuthorizationUser): void {
    if (users.has(user.subject)) {
      throw new Error(
        `registerUser: user "${user.subject}" already registered`,
      );
    }
    users.set(user.subject, user);
  }

  function requireClient(clientId: string): ClientRegistration {
    const client = clients.get(clientId);
    if (!client) {
      throw new Error(
        `authorization-server: unknown client_id "${clientId}"`,
      );
    }
    return client;
  }

  function requireUser(subject: string): AuthorizationUser {
    const user = users.get(subject);
    if (!user) {
      throw new Error(
        `authorization-server: unknown subject "${subject}" — preseed via options.users or call registerUser`,
      );
    }
    return user;
  }

  function assertRedirectUri(client: ClientRegistration, redirectUri: string): void {
    if (!client.redirectUris.includes(redirectUri)) {
      throw new Error(
        `authorization-server: redirect_uri "${redirectUri}" not registered for client "${client.clientId}"`,
      );
    }
  }

  function resolveGrantedScope(
    client: ClientRegistration,
    user: AuthorizationUser,
    requested: string | undefined,
  ): string {
    if (!requested || requested.length === 0) {
      // Default scope = intersection of client allowed and user granted, or
      // just user granted, or empty.
      const userScopes = user.scopes ?? [];
      const clientScopes = client.scopes ?? [];
      if (clientScopes.length === 0) return userScopes.join(' ');
      return userScopes
        .filter((scope) => clientScopes.includes(scope))
        .join(' ');
    }
    const requestedScopes = requested.split(' ').filter(Boolean);
    const userScopes = user.scopes ?? [];
    const clientScopes = client.scopes ?? [];
    for (const scope of requestedScopes) {
      if (userScopes.length > 0 && !userScopes.includes(scope)) {
        throw new Error(
          `authorization-server: user "${user.subject}" not entitled to scope "${scope}"`,
        );
      }
      if (clientScopes.length > 0 && !clientScopes.includes(scope)) {
        throw new Error(
          `authorization-server: client "${client.clientId}" not registered for scope "${scope}"`,
        );
      }
    }
    return requestedScopes.join(' ');
  }

  function authorize(
    request: AuthorizationRequest,
    subject: string,
  ): AuthorizationResponse {
    if ((request.responseType as string) !== 'code') {
      throw new Error(
        `authorize: response_type "${request.responseType}" refused — OAuth 2.1 requires "code" (implicit + hybrid dropped by RFC 9700)`,
      );
    }
    if ((request.codeChallengeMethod as string) === 'plain') {
      throw new Error(
        'authorize: code_challenge_method "plain" refused — RFC 9700 §2.1.1 requires S256',
      );
    }
    if (request.codeChallengeMethod !== 'S256') {
      throw new Error(
        `authorize: unknown code_challenge_method "${request.codeChallengeMethod}" — expected S256`,
      );
    }
    if (!request.codeChallenge || request.codeChallenge.length === 0) {
      throw new Error(
        'authorize: code_challenge missing — PKCE always mandatory in OAuth 2.1',
      );
    }
    if (!request.state || request.state.length === 0) {
      throw new Error(
        'authorize: state parameter missing — required for CSRF defence',
      );
    }
    const client = requireClient(request.clientId);
    assertRedirectUri(client, request.redirectUri);
    const user = requireUser(subject);
    const grantedScope = resolveGrantedScope(client, user, request.scope);
    const code = `code-${base64Url(randomBytes(16))}`;
    codes.set(code, {
      code,
      clientId: request.clientId,
      subject,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod,
      scope: grantedScope,
      issuedAt: Math.floor(now() / 1000),
      consumed: false,
      ...(request.resource === undefined ? {} : { resource: request.resource }),
    });
    return {
      code,
      state: request.state,
      redirectUri: request.redirectUri,
    };
  }

  function token(request: TokenRequest): TokenResponse {
    // OAuth 2.1 drops implicit + password grants — the type system already
    // narrows to authorization_code | refresh_token, so passing a legacy
    // grant at runtime falls through to a hard rejection.
    const grantType = (request as { grantType: string }).grantType;
    if (grantType === 'password' || grantType === 'client_credentials' || grantType === 'implicit') {
      throw new Error(
        `token: grant_type "${grantType}" refused — dropped by OAuth 2.1 / RFC 9700`,
      );
    }
    if (grantType !== 'authorization_code' && grantType !== 'refresh_token') {
      throw new Error(`token: unknown grant_type "${grantType}"`);
    }

    if (request.grantType === 'authorization_code') {
      return handleAuthorizationCode(request);
    }
    return handleRefreshToken(request);
  }

  function handleAuthorizationCode(
    request: Extract<TokenRequest, { grantType: 'authorization_code' }>,
  ): TokenResponse {
    const record = codes.get(request.code);
    if (!record) {
      throw new Error(`token: unknown authorization code "${request.code}"`);
    }
    if (record.consumed) {
      throw new Error(
        `token: authorization code "${request.code}" already exchanged — replay refused`,
      );
    }
    if (record.clientId !== request.clientId) {
      throw new Error(
        `token: client_id mismatch — code issued to "${record.clientId}", exchanged by "${request.clientId}"`,
      );
    }
    if (record.redirectUri !== request.redirectUri) {
      throw new Error(
        `token: redirect_uri mismatch — code recorded "${record.redirectUri}", exchanged with "${request.redirectUri}"`,
      );
    }
    if (
      !verifyCodeChallenge(
        request.codeVerifier,
        record.codeChallenge,
        record.codeChallengeMethod,
      )
    ) {
      throw new Error(
        'token: PKCE code_verifier does not match recorded code_challenge',
      );
    }
    // Prevent replay by consuming the code before we mint any token.
    record.consumed = true;

    const dpopJkt = verifyAndExtractDpopJkt(request.dpop, '/token');
    const access = mintAccessToken({
      clientId: record.clientId,
      subject: record.subject,
      scope: record.scope,
      lifetimeSec: accessLifetime,
      now,
      ...(dpopJkt === undefined ? {} : { dpopJkt }),
      ...(record.resource === undefined ? {} : { resource: record.resource }),
    });
    const refresh = mintRefreshToken({
      clientId: record.clientId,
      subject: record.subject,
      scope: record.scope,
      lifetimeSec: refreshLifetime,
      now,
      ...(dpopJkt === undefined ? {} : { dpopJkt }),
      ...(record.resource === undefined ? {} : { resource: record.resource }),
    });
    accessTokens.set(access.token, access);
    refreshTokens.set(refresh.token, refresh);
    return buildTokenResponse(access, refresh);
  }

  function handleRefreshToken(
    request: Extract<TokenRequest, { grantType: 'refresh_token' }>,
  ): TokenResponse {
    const existing = refreshTokens.get(request.refreshToken);
    if (!existing) {
      // Re-use of a rotated refresh token — the family should be torn down.
      const rotated = rotatedRefreshTokens.get(request.refreshToken);
      if (rotated) {
        throw new Error(
          `token: refresh_token "${request.refreshToken}" has been rotated — reuse refused (RFC 9700 §2.2 rotation family compromise)`,
        );
      }
      throw new Error(`token: unknown refresh_token "${request.refreshToken}"`);
    }
    if (existing.revoked) {
      throw new Error(
        `token: refresh_token "${request.refreshToken}" is revoked — refresh refused`,
      );
    }
    if (existing.clientId !== request.clientId) {
      throw new Error(
        `token: client_id mismatch — refresh_token issued to "${existing.clientId}", used by "${request.clientId}"`,
      );
    }
    if (existing.expiresAt < Math.floor(now() / 1000)) {
      throw new Error(
        `token: refresh_token "${request.refreshToken}" is expired`,
      );
    }
    const dpopJkt = verifyAndExtractDpopJkt(request.dpop, '/token');
    if (existing.dpopJkt) {
      if (!dpopJkt) {
        throw new Error(
          'token: refresh_token is DPoP-bound but no DPoP proof was supplied',
        );
      }
      if (existing.dpopJkt !== dpopJkt) {
        throw new Error(
          'token: DPoP JWK thumbprint mismatch — refresh_token bound to a different key',
        );
      }
    }
    // Scope narrowing per RFC 6749 §6 — the requester may drop scope but not
    // add scope.
    const requestedScope = request.scope?.trim();
    let nextScope = existing.scope;
    if (requestedScope && requestedScope.length > 0) {
      const requestedList = requestedScope.split(' ').filter(Boolean);
      const originalList = existing.scope.split(' ').filter(Boolean);
      for (const scope of requestedList) {
        if (!originalList.includes(scope)) {
          throw new Error(
            `token: refresh scope "${scope}" not in original grant "${existing.scope}"`,
          );
        }
      }
      nextScope = requestedList.join(' ');
    }
    // Rotate — invalidate the previous refresh and issue a new one.
    refreshTokens.delete(existing.token);
    rotatedRefreshTokens.set(existing.token, { ...existing, revoked: true });
    const rotated = rotateRefreshToken(existing, refreshLifetime, now, {
      scope: nextScope,
      ...(dpopJkt === undefined ? {} : { dpopJkt }),
    });
    refreshTokens.set(rotated.token, rotated);
    const access = mintAccessToken({
      clientId: existing.clientId,
      subject: existing.subject,
      scope: nextScope,
      lifetimeSec: accessLifetime,
      now,
      ...(dpopJkt === undefined ? {} : { dpopJkt }),
      ...(existing.resource === undefined ? {} : { resource: existing.resource }),
    });
    accessTokens.set(access.token, access);
    return buildTokenResponse(access, rotated);
  }

  function verifyAndExtractDpopJkt(
    dpop: { jwt: string } | undefined,
    htuPath: string,
  ): string | undefined {
    if (!dpop) return undefined;
    // The AS accepts the wire-format `jwt` string. The verifier re-parses
    // the string so a caller passing a mangled JWT sees the same rejection
    // path the RS-facing verifier uses.
    const parsedFromWire = parseDpopProof(dpop.jwt);
    const verified = verifyDpopProof(parsedFromWire, {
      expectedHtm: 'POST',
      expectedHtu: `${issuer}${htuPath}`,
      seenJtis,
      now,
      iatSkewSec,
    });
    return computeJkt(verified.header.jwk);
  }

  function buildTokenResponse(
    access: AccessToken,
    refresh: RefreshToken,
  ): TokenResponse {
    return {
      accessToken: access.token,
      tokenType: access.tokenType,
      expiresIn: access.expiresAt - Math.floor(now() / 1000),
      refreshToken: refresh.token,
      scope: access.scope,
    };
  }

  function revoke(token: string, clientId: string): void {
    // Try access token first — silent no-op if unknown per RFC 7009 §2.2.
    const access = accessTokens.get(token);
    if (access) {
      if (access.clientId !== clientId) {
        throw new Error(
          `revoke: token belongs to client "${access.clientId}", revocation attempted by "${clientId}"`,
        );
      }
      accessTokens.delete(token);
      return;
    }
    const refresh = refreshTokens.get(token);
    if (refresh) {
      if (refresh.clientId !== clientId) {
        throw new Error(
          `revoke: refresh_token belongs to client "${refresh.clientId}", revocation attempted by "${clientId}"`,
        );
      }
      refreshTokens.set(token, { ...refresh, revoked: true });
      return;
    }
    // Silent success on unknown token — RFC 7009 §2.2 explicitly allows it.
  }

  function introspect(token: string): IntrospectionResponse {
    const access = accessTokens.get(token);
    if (access) {
      const active = access.expiresAt >= Math.floor(now() / 1000);
      if (!active) {
        return { active: false };
      }
      return {
        active: true,
        scope: access.scope,
        clientId: access.clientId,
        sub: access.subject,
        exp: access.expiresAt,
        tokenType: access.tokenType,
        ...(access.resource === undefined ? {} : { resource: access.resource }),
      };
    }
    const refresh = refreshTokens.get(token);
    if (refresh) {
      if (refresh.revoked || refresh.expiresAt < Math.floor(now() / 1000)) {
        return { active: false };
      }
      return {
        active: true,
        scope: refresh.scope,
        clientId: refresh.clientId,
        sub: refresh.subject,
        exp: refresh.expiresAt,
        ...(refresh.resource === undefined ? {} : { resource: refresh.resource }),
      };
    }
    return { active: false };
  }

  return {
    issuer,
    registerClient,
    registerUser,
    authorize,
    token,
    revoke,
    introspect,
    listAccessTokens(): readonly AccessToken[] {
      return Array.from(accessTokens.values());
    },
    listRefreshTokens(): readonly RefreshToken[] {
      // Includes the rotated + revoked tokens so tests can assert the full
      // family history.
      return [
        ...Array.from(refreshTokens.values()),
        ...Array.from(rotatedRefreshTokens.values()),
      ];
    },
    listSeenJtis(): readonly string[] {
      return Array.from(seenJtis);
    },
    reset(): void {
      codes.clear();
      accessTokens.clear();
      refreshTokens.clear();
      rotatedRefreshTokens.clear();
      seenJtis.clear();
    },
  };
}

interface IssuedCode {
  code: string;
  clientId: string;
  subject: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  issuedAt: number;
  consumed: boolean;
  resource?: string;
}

function base64Url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
