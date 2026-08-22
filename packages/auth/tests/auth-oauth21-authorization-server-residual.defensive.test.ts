import { describe, expect, it } from 'vitest';
import {
  __resetOAuth21Counters,
  createAuthorizationServer,
  createDpopProof,
  createMockDpopJwk,
  createPkceChallenge,
  type AuthorizationServer,
  type TokenRequest,
} from '../src/index.js';

/**
 * scope 解決の既定値 (client / user のどちらかが scope 未申告) を確かめたいので、
 * scope を渡さない client / user を持つ AS を個別に組む。
 */
function makeServer(
  overrides?: Parameters<typeof createAuthorizationServer>[0],
): AuthorizationServer {
  __resetOAuth21Counters();
  return createAuthorizationServer({
    issuer: 'https://as.example.test',
    ...(overrides ?? {}),
  });
}

function authorize(
  server: AuthorizationServer,
  opts: {
    clientId?: string;
    scope?: string;
    resource?: string;
    subject?: string;
  } = {},
): { code: string; codeVerifier: string } {
  const { codeVerifier, codeChallenge } = createPkceChallenge();
  const res = server.authorize(
    {
      responseType: 'code',
      clientId: opts.clientId ?? 'client-A',
      redirectUri: 'https://app.example.test/cb',
      state: 'state-1',
      codeChallenge,
      codeChallengeMethod: 'S256',
      ...(opts.scope === undefined ? {} : { scope: opts.scope }),
      ...(opts.resource === undefined ? {} : { resource: opts.resource }),
    },
    opts.subject ?? 'user-1',
  );
  return { code: res.code, codeVerifier };
}

describe('resolveGrantedScope — scope 未申告の組合せ', () => {
  it('scope 要求なし + client が scope 未登録なら user 側の scope をそのまま許す', () => {
    // client が scope を宣言していない = 絞り込む集合が無いので intersection を
    // 取らずに user 側を返す経路。 交差を取ると空文字になってしまう。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'profile'] }],
    });
    const { code, codeVerifier } = authorize(server);

    const res = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    expect(res.scope).toBe('openid profile');
  });

  it('scope 要求なし + user も client も scope 未登録なら空 scope で発行する', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1' }],
    });
    const { code, codeVerifier } = authorize(server);

    const res = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    expect(res.scope).toBe('');
  });

  it('scope 要求あり + 双方が scope 未登録なら要求をそのまま通す', () => {
    // 誰も制約を宣言していない = 拒否の根拠が無い。 ここを絞ると
    // preseed を持たない test が全部 scope 空になる。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1' }],
    });
    const { code, codeVerifier } = authorize(server, { scope: 'openid email' });

    const res = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    expect(res.scope).toBe('openid email');
  });

  it('client が登録していない scope の要求は client 側の理由で拒否する', () => {
    // user 側の制約が無い状態で拒否させることで、 client 側の判定だけが
    // 効いていることを分離して確かめる。
    const server = makeServer({
      clients: [
        {
          clientId: 'client-A',
          redirectUris: ['https://app.example.test/cb'],
          scopes: ['openid'],
        },
      ],
      users: [{ subject: 'user-1' }],
    });

    expect(() => authorize(server, { scope: 'openid admin' })).toThrow(
      'authorization-server: client "client-A" not registered for scope "admin"',
    );
  });
});

describe('authorize / token の入口 validation', () => {
  it('S256 でも plain でもない code_challenge_method は unknown として拒否する', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1' }],
    });

    expect(() =>
      server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://app.example.test/cb',
          state: 'state-1',
          codeChallenge: 'challenge',
          codeChallengeMethod: 'S512' as unknown as 'S256',
        },
        'user-1',
      ),
    ).toThrow('authorize: unknown code_challenge_method "S512" — expected S256');
  });

  it('OAuth 2.1 が明示的に落とした grant 以外の未知 grant_type も拒否する', () => {
    // `password` 等は専用 message を持つ。 それ以外の綴りが素通りすると
    // 型では守れない入口が空く。
    const server = makeServer();

    expect(() =>
      server.token({ grantType: 'device_code' } as unknown as TokenRequest),
    ).toThrow('token: unknown grant_type "device_code"');
  });

  it('存在しない authorization code の交換は拒否する', () => {
    const server = makeServer();

    expect(() =>
      server.token({
        grantType: 'authorization_code',
        code: 'code-never-issued',
        redirectUri: 'https://app.example.test/cb',
        clientId: 'client-A',
        codeVerifier: 'verifier',
      }),
    ).toThrow('token: unknown authorization code "code-never-issued"');
  });

  it('rotate 履歴にも無い refresh_token は unknown として拒否する', () => {
    // rotation 由来の reuse とは message を分ける。 同じ message にすると
    // 「盗まれた token の再利用」 と「単なる打ち間違い」 が区別できない。
    const server = makeServer();

    expect(() =>
      server.token({
        grantType: 'refresh_token',
        refreshToken: 'rt-never-issued',
        clientId: 'client-A',
      }),
    ).toThrow('token: unknown refresh_token "rt-never-issued"');
  });

  it('有効期限を過ぎた refresh_token は expired として拒否する', () => {
    let nowMs = 1_700_000_000_000;
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1' }],
      refreshTokenLifetimeSec: 60,
      now: () => nowMs,
    });
    const { code, codeVerifier } = authorize(server);
    const issued = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    nowMs += 120_000;

    expect(() =>
      server.token({
        grantType: 'refresh_token',
        refreshToken: issued.refreshToken,
        clientId: 'client-A',
      }),
    ).toThrow(`token: refresh_token "${issued.refreshToken}" is expired`);
  });

  it('別 client からの refresh_token 失効要求は拒否する', () => {
    const server = makeServer({
      clients: [
        { clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] },
        { clientId: 'client-B', redirectUris: ['https://other.example.test/cb'] },
      ],
      users: [{ subject: 'user-1' }],
    });
    const { code, codeVerifier } = authorize(server);
    const issued = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    expect(() => server.revoke(issued.refreshToken, 'client-B')).toThrow(
      'revoke: refresh_token belongs to client "client-A", revocation attempted by "client-B"',
    );
    // 拒否した以上、 対象の token は生きたままでなければならない。
    expect(server.introspect(issued.refreshToken).active).toBe(true);
  });
});

describe('resource indicator (RFC 8707) の伝播', () => {
  it('authorize で渡した resource が access / refresh / introspect まで届く', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });
    const { code, codeVerifier } = authorize(server, {
      scope: 'openid',
      resource: 'https://api.example.test',
    });

    const issued = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    // access / refresh の双方に載っていないと、 refresh 後の access token が
    // resource を落とす (下の refresh でそれを確かめる)。
    expect(server.introspect(issued.accessToken)).toMatchObject({
      active: true,
      resource: 'https://api.example.test',
    });
    expect(server.introspect(issued.refreshToken)).toMatchObject({
      active: true,
      resource: 'https://api.example.test',
      clientId: 'client-A',
      sub: 'user-1',
    });

    const refreshed = server.token({
      grantType: 'refresh_token',
      refreshToken: issued.refreshToken,
      clientId: 'client-A',
    });

    expect(server.introspect(refreshed.accessToken)).toMatchObject({
      active: true,
      resource: 'https://api.example.test',
    });
  });

  it('resource を渡さなければ introspect の応答にも現れない', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1' }],
    });
    const { code, codeVerifier } = authorize(server);
    const issued = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    expect(server.introspect(issued.accessToken)).not.toHaveProperty('resource');
    expect(server.introspect(issued.refreshToken)).not.toHaveProperty('resource');
  });
});

describe('introspect の refresh_token 経路', () => {
  it('失効した refresh_token は active false になる', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1' }],
    });
    const { code, codeVerifier } = authorize(server);
    const issued = server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
    });

    expect(server.introspect(issued.refreshToken).active).toBe(true);
    server.revoke(issued.refreshToken, 'client-A');
    expect(server.introspect(issued.refreshToken)).toEqual({ active: false });
  });
});

describe('listSeenJtis — DPoP proof の replay 台帳', () => {
  it('DPoP 付きの /token を通すと jti が台帳に載る', () => {
    const nowMs = 1_700_000_000_000;
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: ['https://app.example.test/cb'] }],
      users: [{ subject: 'user-1' }],
      now: () => nowMs,
    });
    const { code, codeVerifier } = authorize(server);
    const jwk = createMockDpopJwk();
    const proof = createDpopProof({
      jwk,
      htm: 'POST',
      htu: 'https://as.example.test/token',
      iat: Math.floor(nowMs / 1000),
    });

    expect(server.listSeenJtis()).toEqual([]);

    server.token({
      grantType: 'authorization_code',
      code,
      redirectUri: 'https://app.example.test/cb',
      clientId: 'client-A',
      codeVerifier,
      dpop: proof,
    });

    // 台帳に載ること自体が replay 検知の前提。 空のままだと同じ proof を
    // 何度でも使えてしまう。
    expect(server.listSeenJtis()).toEqual([proof.payload.jti]);

    server.reset();
    expect(server.listSeenJtis()).toEqual([]);
  });
});
