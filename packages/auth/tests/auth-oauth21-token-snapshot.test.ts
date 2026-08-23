/**
 * `listAccessTokens()` / `listRefreshTokens()` が返す要素を書き換えても内部に伝播しない
 * (Issue #2179)。
 *
 * 両 method は「snapshot」 と doc に書かれているが、以前は
 * `Array.from(map.values())` で **配列だけが新しく、要素は Map 内の実体と同一参照**だった。
 * 戻り値の型 `readonly AccessToken[]` が凍らせるのは配列であって要素ではない。
 *
 * refresh 側は `let nextScope = existing.scope` と保存済みの値を信頼するため、
 * 列挙した token の `scope` を書き換えると **一度も宣言されていない scope の access token を
 * 発行できた**。 `listAccessTokens()` の要素を書き換えれば `introspect()` の応答にも現れた。
 *
 * #2169 が authorize / token 経路で「要求した scope は双方の宣言が要る」 を守るようにしたが、
 * **この経路はその保証を迂回していた**。 PR #2176 の generator-verifier が候補 1 として検出し、
 * 判定は out-of-scope (実装は `main` と同一で #2169 由来ではない) だったため本 Issue に
 * 切り出された。
 */
import { describe, expect, it } from 'vitest';

import {
  __resetOAuth21Counters,
  createAuthorizationServer,
  createPkceChallenge,
  type AuthorizationServer,
} from '../src/index.js';

const REDIRECT = 'https://app.example.test/cb';

function makeServer(): AuthorizationServer {
  __resetOAuth21Counters();
  return createAuthorizationServer({
    issuer: 'https://as.example.test',
    clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
    users: [{ subject: 'user-1', scopes: ['openid'] }],
  });
}

/** authorize → token を通し、発行された token 一式を返す。 */
function issue(server: AuthorizationServer, scope = 'openid'): {
  accessToken: string;
  refreshToken: string;
} {
  const { codeVerifier, codeChallenge } = createPkceChallenge();
  const res = server.authorize(
    {
      responseType: 'code',
      clientId: 'client-A',
      redirectUri: REDIRECT,
      state: 'state-1',
      codeChallenge,
      codeChallengeMethod: 'S256',
      scope,
    },
    'user-1',
  );
  const issued = server.token({
    grantType: 'authorization_code',
    code: res.code,
    redirectUri: REDIRECT,
    clientId: 'client-A',
    codeVerifier,
  });
  return { accessToken: issued.accessToken, refreshToken: issued.refreshToken ?? '' };
}

describe('listAccessTokens は要素も copy して返す (#2179)', () => {
  it('T-SNAP-001 返した要素を書き換えても introspect の応答は変わらない', () => {
    const server = makeServer();
    const { accessToken } = issue(server);

    const listed = server.listAccessTokens();
    expect(listed, '発行した token が列挙される').toHaveLength(1);
    listed[0]!.scope = 'admin';

    expect(server.introspect(accessToken).scope, '内部の値は変わらない').toBe('openid');
  });

  it('T-SNAP-002 2 度呼ぶと別のオブジェクトが返る', () => {
    // 同一参照を返していないことを、識別子ではなく **参照の非同一性**で見る。
    // 内容は等しいので `toEqual` は通り、`toBe` だけが落ちる。
    const server = makeServer();
    issue(server);

    const first = server.listAccessTokens()[0]!;
    const second = server.listAccessTokens()[0]!;

    expect(second, '内容は等しい').toEqual(first);
    expect(second, '実体は別').not.toBe(first);
  });
});

describe('listRefreshTokens は要素も copy して返す (#2179)', () => {
  it('T-SNAP-011 返した要素の scope を書き換えても refresh は宣言済の scope しか出さない', () => {
    // **これが本 Issue の核心**。 `scope` を `admin` に書き換えてから refresh すると、
    // 以前は `admin` の access token が発行された。 どこにも `admin` を許した宣言が無い。
    const server = makeServer();
    issue(server);

    const listed = server.listRefreshTokens();
    expect(listed, '発行した refresh token が列挙される').toHaveLength(1);
    const token = listed[0]!.token;
    listed[0]!.scope = 'admin';

    const refreshed = server.token({
      grantType: 'refresh_token',
      refreshToken: token,
      clientId: 'client-A',
    });

    expect(refreshed.scope, '書き換えは内部に届かない').toBe('openid');
  });

  it('T-SNAP-012 返した要素の revoked を戻しても失効は解けない', () => {
    // 失効の取り消しも同じ経路で起こりうる。 `revoked` を false に戻して再利用できないこと。
    const server = makeServer();
    issue(server);

    const token = server.listRefreshTokens()[0]!.token;
    server.revoke(token, 'client-A');

    const listed = server.listRefreshTokens();
    const revokedEntry = listed.find((entry) => entry.token === token);
    expect(revokedEntry?.revoked, '失効している').toBe(true);
    revokedEntry!.revoked = false;

    expect(() =>
      server.token({ grantType: 'refresh_token', refreshToken: token, clientId: 'client-A' }),
    ).toThrow();
  });

  it('T-SNAP-013 rotate 済の要素も copy されている', () => {
    // 戻り値は active と rotated の 2 群を連結する。 **両方に copy が要る**ので、
    // 片方だけ copy した形をここで落とす。
    const server = makeServer();
    issue(server);

    const original = server.listRefreshTokens()[0]!.token;
    server.token({ grantType: 'refresh_token', refreshToken: original, clientId: 'client-A' });

    const listed = server.listRefreshTokens();
    expect(listed.length, 'rotate 前と後の 2 件が並ぶ').toBeGreaterThan(1);

    for (const entry of listed) entry.scope = 'admin';

    const again = server.listRefreshTokens();
    expect(
      again.map((entry) => entry.scope),
      '書き換えは 1 件も残らない',
    ).toEqual(again.map(() => 'openid'));
  });
});
