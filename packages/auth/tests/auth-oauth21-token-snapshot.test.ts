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

describe('登録した参照を後から書き換えても認可判定に届かない (#2179)', () => {
  // **入口側**の検査。 出口 (`list*` の返り値) を copy しても、 登録時に呼出側の参照を
  // そのまま保持していると、 `scopes.push('admin')` するだけで
  // 「宣言されていない scope は発行しない」 が破れる (#2180 r1-f1)。
  //
  // `readonly string[]` は止められない = 呼出側が非 readonly の参照を持っていればよい。

  const REDIRECT_LOCAL = 'https://app.example.test/cb';

  function authorizeWith(server: AuthorizationServer, scope: string): void {
    const { codeChallenge } = createPkceChallenge();
    server.authorize(
      {
        responseType: 'code',
        clientId: 'client-A',
        redirectUri: REDIRECT_LOCAL,
        state: 'state-1',
        codeChallenge,
        codeChallengeMethod: 'S256',
        scope,
      },
      'user-1',
    );
  }

  it('T-SNAP-021 options で渡した scopes を後から足しても発行されない', () => {
    const clientScopes = ['openid'];
    const userScopes = ['openid'];
    __resetOAuth21Counters();
    const server = createAuthorizationServer({
      issuer: 'https://as.example.test',
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT_LOCAL], scopes: clientScopes }],
      users: [{ subject: 'user-1', scopes: userScopes }],
    });

    clientScopes.push('admin');
    userScopes.push('admin');

    expect(() => authorizeWith(server, 'admin')).toThrow(/not entitled to scope "admin"/);
  });

  it('T-SNAP-022 registerClient / registerUser で渡した scopes も同じ', () => {
    const clientScopes = ['openid'];
    const userScopes = ['openid'];
    __resetOAuth21Counters();
    const server = createAuthorizationServer({ issuer: 'https://as.example.test' });
    server.registerClient({
      clientId: 'client-A',
      redirectUris: [REDIRECT_LOCAL],
      scopes: clientScopes,
    });
    server.registerUser({ subject: 'user-1', scopes: userScopes });

    clientScopes.push('admin');
    userScopes.push('admin');

    expect(() => authorizeWith(server, 'admin')).toThrow(/not entitled to scope "admin"/);
  });

  it('T-SNAP-021b client 側だけを足した形も止まる', () => {
    // **user 側と分けて当てる**。 両方を同時に足すと user 側の判定が先に落ちるため、
    // client 側の copy を外す変異で 1 件も落ちなかった (実測)。
    // 「他の検査が覆っている」 形なので、client 側だけを突く入力を用意する。
    const clientScopes = ['openid'];
    __resetOAuth21Counters();
    const server = createAuthorizationServer({
      issuer: 'https://as.example.test',
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT_LOCAL], scopes: clientScopes }],
      // user 側は最初から admin を持つので、user 側の判定では落ちない。
      users: [{ subject: 'user-1', scopes: ['openid', 'admin'] }],
    });

    clientScopes.push('admin');

    expect(() => authorizeWith(server, 'admin')).toThrow(/not registered for scope "admin"/);
  });

  it('T-SNAP-022b user 側だけを足した形も止まる', () => {
    const userScopes = ['openid'];
    __resetOAuth21Counters();
    const server = createAuthorizationServer({
      issuer: 'https://as.example.test',
      // client 側は最初から admin を持つので、client 側の判定では落ちない。
      clients: [
        { clientId: 'client-A', redirectUris: [REDIRECT_LOCAL], scopes: ['openid', 'admin'] },
      ],
      users: [{ subject: 'user-1', scopes: userScopes }],
    });

    userScopes.push('admin');

    expect(() => authorizeWith(server, 'admin')).toThrow(/not entitled to scope "admin"/);
  });

  it('T-SNAP-024 登録後に property を再代入しても届かない (client / user 両側)', () => {
    // **`push` だけでは足りない** (#2179 gv-10)。 配列 field だけを copy して元 object を
    // 保持する実装は、`push` の検査を通る一方 `client.scopes = [...]` の再代入が内部へ届く。
    // 実測で「元 object を保持し配列 property だけ clone へ差し替える」 変異を当てると、
    // 既存の 5 件はいずれも落ちなかった。
    //
    // client 側と user 側を分けて当てる = 片側の判定が先に落ちてもう片側を隠すため。
    const client = { clientId: 'client-A', redirectUris: [REDIRECT_LOCAL], scopes: ['openid'] };
    __resetOAuth21Counters();
    const clientSide = createAuthorizationServer({
      issuer: 'https://as.example.test',
      clients: [client],
      // user 側は最初から admin を持つので、user 側の判定では落ちない。
      users: [{ subject: 'user-1', scopes: ['openid', 'admin'] }],
    });

    client.scopes = ['openid', 'admin'];

    expect(() => authorizeWith(clientSide, 'admin')).toThrow(/not registered for scope "admin"/);

    const user = { subject: 'user-1', scopes: ['openid'] };
    __resetOAuth21Counters();
    const userSide = createAuthorizationServer({
      issuer: 'https://as.example.test',
      clients: [
        { clientId: 'client-A', redirectUris: [REDIRECT_LOCAL], scopes: ['openid', 'admin'] },
      ],
      users: [user],
    });

    user.scopes = ['openid', 'admin'];

    expect(() => authorizeWith(userSide, 'admin')).toThrow(/not entitled to scope "admin"/);
  });

  it('T-SNAP-024b registerClient 経路の scopes 再代入が届かない', () => {
    // **1 検査 = 1 不変条件** (#2179 r3-f1)。 scopes と redirectUris を同じ検査に置くと、
    // 前の `expect` が落ちた時点で throw して**後ろの assertion が 1 度も走らない**。
    // scopes だけ漏れる regression が redirect の穴を隠す。
    //
    // 再代入するのも `scopes` だけにする = 変異と assertion を 1 対 1 にする。
    // user は inline literal で最初から admin にし、user 側の判定に落ちる前に到達させる。
    const client = { clientId: 'client-A', redirectUris: [REDIRECT_LOCAL], scopes: ['openid'] };
    __resetOAuth21Counters();
    const server = createAuthorizationServer({ issuer: 'https://as.example.test' });
    server.registerClient(client);
    server.registerUser({ subject: 'user-1', scopes: ['openid', 'admin'] });

    client.scopes = ['openid', 'admin'];

    expect(() => authorizeWith(server, 'admin')).toThrow(/not registered for scope "admin"/);
  });

  it('T-SNAP-024d registerClient 経路の redirectUris 再代入が届かない', () => {
    // T-SNAP-024b と対。 client は最初から admin を持たせ、scope の判定で落ちる前に
    // redirect_uri の判定へ到達させる。
    const client = {
      clientId: 'client-A',
      redirectUris: [REDIRECT_LOCAL],
      scopes: ['openid', 'admin'],
    };
    __resetOAuth21Counters();
    const server = createAuthorizationServer({ issuer: 'https://as.example.test' });
    server.registerClient(client);
    server.registerUser({ subject: 'user-1', scopes: ['openid', 'admin'] });

    client.redirectUris = [REDIRECT_LOCAL, 'https://evil.example.test/cb'];

    const { codeChallenge } = createPkceChallenge();
    expect(() =>
      server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://evil.example.test/cb',
          state: 'state-1',
          codeChallenge,
          codeChallengeMethod: 'S256',
          scope: 'admin',
        },
        'user-1',
      ),
    ).toThrow(/redirect_uri/);
  });

  it('T-SNAP-024c registerUser 経路の再代入も届かない', () => {
    // **`registerUser` 経路だけを突く** (#2179 r2-f1)。 T-SNAP-024 の user 側は
    // `options.users` 経路で、T-SNAP-024b は client 側しか突いていない。
    //
    // 実測 = `registerUser` の呼出側だけを「元 object を保持し配列だけ差し替える」 形に
    // 変異させると、1260 件が 1 件も落ちなかった。
    //
    // client は最初から admin を持たせる = client 側の判定で落ちる前に user 側へ到達させる。
    const user = { subject: 'user-1', scopes: ['openid'] };
    __resetOAuth21Counters();
    const server = createAuthorizationServer({ issuer: 'https://as.example.test' });
    server.registerClient({
      clientId: 'client-A',
      redirectUris: [REDIRECT_LOCAL],
      scopes: ['openid', 'admin'],
    });
    server.registerUser(user);

    user.scopes = ['openid', 'admin'];

    expect(() => authorizeWith(server, 'admin')).toThrow(/not entitled to scope "admin"/);
  });

  it('T-SNAP-023 redirectUris を後から足しても受け付けない', () => {
    // `scopes` と同じ形が `redirectUris` にもある。 後から足した宛先へ code を
    // 送れると、 認可された宛先の宣言が意味を持たなくなる。
    const redirectUris = [REDIRECT_LOCAL];
    __resetOAuth21Counters();
    const server = createAuthorizationServer({
      issuer: 'https://as.example.test',
      clients: [{ clientId: 'client-A', redirectUris, scopes: ['openid'] }],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });

    redirectUris.push('https://evil.example.test/cb');

    const { codeChallenge } = createPkceChallenge();
    expect(() =>
      server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://evil.example.test/cb',
          state: 'state-1',
          codeChallenge,
          codeChallengeMethod: 'S256',
          scope: 'openid',
        },
        'user-1',
      ),
    ).toThrow(/redirect_uri/);
  });

  it('T-SNAP-022c registerClient 経路の client 側だけを足した形も止まる', () => {
    // **`options.clients` 経路と `registerClient` 経路は別の入口**。 T-SNAP-021b は
    // 前者しか突いておらず、`registerClient` の中の copy を外す変異で 1 件も落ちなかった
    // (実測 = 全 1256 件 pass)。 T-SNAP-022 は後者を通るが両側を同時に足すので、
    // user 側の判定が先に落ちて client 側に到達しない。
    const clientScopes = ['openid'];
    __resetOAuth21Counters();
    const server = createAuthorizationServer({ issuer: 'https://as.example.test' });
    server.registerClient({
      clientId: 'client-A',
      redirectUris: [REDIRECT_LOCAL],
      scopes: clientScopes,
    });
    // user 側は最初から admin を持つので、user 側の判定では落ちない。
    server.registerUser({ subject: 'user-1', scopes: ['openid', 'admin'] });

    clientScopes.push('admin');

    expect(() => authorizeWith(server, 'admin')).toThrow(/not registered for scope "admin"/);
  });

  it('T-SNAP-023b registerClient 経路の redirectUris も後から足せない', () => {
    const redirectUris = [REDIRECT_LOCAL];
    __resetOAuth21Counters();
    const server = createAuthorizationServer({ issuer: 'https://as.example.test' });
    server.registerClient({ clientId: 'client-A', redirectUris, scopes: ['openid'] });
    server.registerUser({ subject: 'user-1', scopes: ['openid'] });

    redirectUris.push('https://evil.example.test/cb');

    const { codeChallenge } = createPkceChallenge();
    expect(() =>
      server.authorize(
        {
          responseType: 'code',
          clientId: 'client-A',
          redirectUri: 'https://evil.example.test/cb',
          state: 'state-1',
          codeChallenge,
          codeChallengeMethod: 'S256',
          scope: 'openid',
        },
        'user-1',
      ),
    ).toThrow(/redirect_uri/);
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

  it('T-SNAP-014 revoke した access token は一覧から消える', () => {
    // access と refresh で失効の残り方が違う (#2180 で JSDoc に明記済)。 access は registry から
    // 消し、 refresh は `revoked: true` で残す。
    //
    // **この非対称を確かめる検査が無かった** (#2192)。 既存は `introspect().active === false` まで
    // で、 access token が一覧から消えることは見ていない = access も `revoked: true` で残す実装に
    // 変えても検査は通る。
    //
    // 将来 access も残す設計へ変えるなら、 この検査は意図して落ちる。 その時は非対称を解いた
    // 判断ごと JSDoc と併せて直す。
    const server = makeServer();
    const { accessToken } = issue(server);

    expect(
      server.listAccessTokens().map((entry) => entry.token),
      'revoke 前に一覧へ出ていない',
    ).toContain(accessToken);

    server.revoke(accessToken, 'client-A');

    expect(
      server.listAccessTokens().map((entry) => entry.token),
      'revoke した access token が一覧に残っている',
    ).not.toContain(accessToken);
    expect(server.introspect(accessToken).active, '失効していない').toBe(false);
  });

  it('T-SNAP-013 rotate 済の要素も copy されている', () => {
    // 戻り値は active と rotated の 2 群を連結する。 **両方に copy が要る**ので、
    // 片方だけ copy した形をここで落とす。
    const server = makeServer();
    issue(server);

    const original = server.listRefreshTokens()[0]!.token;
    server.token({ grantType: 'refresh_token', refreshToken: original, clientId: 'client-A' });

    const listed = server.listRefreshTokens();
    // **件数では識別できない** (#2192)。 rotated 側を active の重複に置き換える実装でも
    // `length > 1` は通り、 全要素 copy の assertion も通る = 「rotated が居る」 ことを
    // 1 度も確かめていない状態になる (実測で変異が生存した)。
    //
    // rotated と active は同じ形で返るため、 区別できるのは `revoked` field だけ。 元 token が
    // rotated 側として残っていることと、 新 token が active 側に居ることを別々に見る。
    const rotated = listed.filter((entry) => entry.revoked);
    const active = listed.filter((entry) => !entry.revoked);
    expect(rotated.map((entry) => entry.token), 'rotate 前の token が失効側に残っていない').toEqual([
      original,
    ]);
    expect(active.length, 'rotate 後の token が有効側に居ない').toBe(1);
    expect(active[0]!.token, '有効側が rotate 前の token のまま').not.toBe(original);

    for (const entry of listed) entry.scope = 'admin';

    const again = server.listRefreshTokens();
    expect(
      again.map((entry) => entry.scope),
      '書き換えは 1 件も残らない',
    ).toEqual(again.map(() => 'openid'));
  });
});
