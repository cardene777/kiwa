import { describe, expect, it } from 'vitest';
import { createAuthorizationServer } from '../src/oauth21/authorization-server.js';

function baseClient(clientId = 'c1') {
  return {
    clientId,
    redirectUris: ['https://rp.example/cb'] as readonly string[],
  };
}

function baseUser(subject = 'u1') {
  return { subject };
}

const CHALLENGE = 'x'.repeat(43); // valid base64url-ish placeholder

describe('oauth21/authorization-server defensive branches', () => {
  it('accepts custom issuer + lifetimes', () => {
    const as = createAuthorizationServer({
      issuer: 'https://custom.as',
      accessTokenLifetimeSec: 900,
      refreshTokenLifetimeSec: 3600,
      dpopIatSkewSec: 30,
    });
    expect(as.issuer).toBe('https://custom.as');
  });

  it('accepts preseeded clients + users', () => {
    const as = createAuthorizationServer({
      clients: [baseClient('c1')],
      users: [baseUser('u1')],
    });
    expect(as.issuer).toBeDefined();
  });

  it('registerClient throws when clientId already registered', () => {
    const as = createAuthorizationServer();
    as.registerClient(baseClient('c1'));
    expect(() => as.registerClient(baseClient('c1'))).toThrow(/already registered/);
  });

  it('registerUser throws when subject already registered', () => {
    const as = createAuthorizationServer();
    as.registerUser(baseUser('u1'));
    expect(() => as.registerUser(baseUser('u1'))).toThrow(/already registered/);
  });

  it('authorize refuses response_type != code (implicit dropped)', () => {
    const as = createAuthorizationServer({
      clients: [baseClient()],
      users: [baseUser()],
    });
    expect(() =>
      as.authorize(
        {
          clientId: 'c1',
          redirectUri: 'https://rp.example/cb',
          responseType: 'token' as never,
          scope: 'openid',
          state: 'st',
          codeChallenge: CHALLENGE,
          codeChallengeMethod: 'S256',
        },
        'u1',
      ),
    ).toThrow(/response_type .* refused/);
  });

  it('authorize refuses code_challenge_method=plain', () => {
    const as = createAuthorizationServer({
      clients: [baseClient()],
      users: [baseUser()],
    });
    expect(() =>
      as.authorize(
        {
          clientId: 'c1',
          redirectUri: 'https://rp.example/cb',
          responseType: 'code',
          scope: 'openid',
          state: 'st',
          codeChallenge: CHALLENGE,
          codeChallengeMethod: 'plain' as never,
        },
        'u1',
      ),
    ).toThrow(/code_challenge_method "plain" refused/);
  });

  it('authorize refuses missing code_challenge (PKCE mandatory)', () => {
    const as = createAuthorizationServer({
      clients: [baseClient()],
      users: [baseUser()],
    });
    expect(() =>
      as.authorize(
        {
          clientId: 'c1',
          redirectUri: 'https://rp.example/cb',
          responseType: 'code',
          scope: 'openid',
          state: 'st',
          codeChallenge: '',
          codeChallengeMethod: 'S256',
        },
        'u1',
      ),
    ).toThrow(/code_challenge missing/);
  });

  it('authorize refuses missing state (CSRF defence)', () => {
    const as = createAuthorizationServer({
      clients: [baseClient()],
      users: [baseUser()],
    });
    expect(() =>
      as.authorize(
        {
          clientId: 'c1',
          redirectUri: 'https://rp.example/cb',
          responseType: 'code',
          scope: 'openid',
          state: '',
          codeChallenge: CHALLENGE,
          codeChallengeMethod: 'S256',
        },
        'u1',
      ),
    ).toThrow(/state parameter missing/);
  });

  it('authorize refuses unknown client_id', () => {
    const as = createAuthorizationServer({ users: [baseUser()] });
    expect(() =>
      as.authorize(
        {
          clientId: 'unknown-client',
          redirectUri: 'https://rp.example/cb',
          responseType: 'code',
          scope: 'openid',
          state: 'st',
          codeChallenge: CHALLENGE,
          codeChallengeMethod: 'S256',
        },
        'u1',
      ),
    ).toThrow(/unknown client_id/);
  });

  it('authorize refuses unknown subject', () => {
    const as = createAuthorizationServer({ clients: [baseClient()] });
    expect(() =>
      as.authorize(
        {
          clientId: 'c1',
          redirectUri: 'https://rp.example/cb',
          responseType: 'code',
          scope: 'openid',
          state: 'st',
          codeChallenge: CHALLENGE,
          codeChallengeMethod: 'S256',
        },
        'unknown-user',
      ),
    ).toThrow(/unknown subject/);
  });
});
