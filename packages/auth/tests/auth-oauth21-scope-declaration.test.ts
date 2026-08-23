/**
 * `scopes` を宣言しない相手には scope を発行しない (Issue #2169)。
 *
 * mock AS は `user.scopes ?? []` としてから `length > 0` で検査を gate していたため、
 * **何も宣言していない user / client に対して任意の scope が通っていた**。
 * `users: [{ subject: 'user-1' }]` を preseed して `scope: 'openid email admin'` を
 * 要求すると、 どこにも `admin` を許した宣言が無いのに発行される状態だった。
 * generator-verifier が finding #15 として検出し「未登録 scope の無制限認可」 と呼んだ。
 *
 * 直し方は 3 案あった。
 *
 * | # | 案 | 採否 |
 * |---|---|---|
 * | 1 | doc を実装に合わせる (未登録は常に無制限) | 穴をそのまま仕様にする |
 * | 2 | **省略を空集合として扱う** | 採用 |
 * | 3 | 未指定と空配列を区別する (未指定は無制限のまま) | 未指定側が素通しなので穴が残る |
 *
 * 一度は案 3 を採ったが、 review が axis `security` で「区別しても未指定側が素通しなら
 * 元の穴は残る」 と指摘した。 実測すると案 2 で壊れる既存の検査は 3 件だけで、
 * いずれも「宣言せずに要求する」 形だった = **塞ぐべき形そのもの**。
 *
 * 採った規則は 1 つ。 **要求した scope は user と client の双方が宣言していなければ通らない**。
 * 要求しない経路は双方の交差を返すので、 scope に関心の無い検査は今までどおり省略できる。
 */
import { describe, expect, it } from 'vitest';

import {
  __resetOAuth21Counters,
  createAuthorizationServer,
  createPkceChallenge,
  type AuthorizationServer,
} from '../src/index.js';

const REDIRECT = 'https://app.example.test/cb';

function makeServer(
  overrides: Parameters<typeof createAuthorizationServer>[0],
): AuthorizationServer {
  __resetOAuth21Counters();
  return createAuthorizationServer({ issuer: 'https://as.example.test', ...overrides });
}

/** authorize → token を通し、 発行された scope を返す。 */
function grantedScope(server: AuthorizationServer, scope?: string): string | undefined {
  const { codeVerifier, codeChallenge } = createPkceChallenge();
  const res = server.authorize(
    {
      responseType: 'code',
      clientId: 'client-A',
      redirectUri: REDIRECT,
      state: 'state-1',
      codeChallenge,
      codeChallengeMethod: 'S256',
      ...(scope === undefined ? {} : { scope }),
    },
    'user-1',
  );
  return server.token({
    grantType: 'authorization_code',
    code: res.code,
    redirectUri: REDIRECT,
    clientId: 'client-A',
    codeVerifier,
  }).scope;
}

describe('要求した scope は宣言が要る (#2169)', () => {
  it('T-SCOPE-001 双方が宣言していれば通る', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid', 'email'] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'email'] }],
    });

    expect(grantedScope(server, 'openid email')).toBe('openid email');
  });

  it('T-SCOPE-002 宣言集合の外側は user 側の理由で拒否する', () => {
    // **非空の宣言集合の外側**を拒否する形。 これは旧実装でも通る (旧実装が飛ばしたのは
    // 集合が空の時だけ)。 finding #15 そのものの再現は T-SCOPE-011 が持つ。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid', 'admin'] }],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });

    expect(() => grantedScope(server, 'admin')).toThrow(
      /user "user-1" not entitled to scope "admin"/,
    );
  });

  it('T-SCOPE-003 client が宣言していない scope は client 側の理由で拒否する', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'admin'] }],
    });

    expect(() => grantedScope(server, 'admin')).toThrow(
      /client "client-A" not registered for scope "admin"/,
    );
  });

  it('T-SCOPE-004 双方とも宣言していなければ拒否する', () => {
    // **どちらの理由が先に出るかは固定しない**。 本 PR の契約は「双方の宣言が要る」 までで、
    // 報告の優先順位は定めていない。 固定すると client-first や両者を列挙する等価な実装を
    // 落としてしまう (#2176 gv-06)。
    // 主体ごとの message は T-SCOPE-002 / T-SCOPE-003 が引き続き見る。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1' }],
    });

    expect(() => grantedScope(server, 'admin'), '拒否されること自体は固定する').toThrow(
      /not entitled to scope "admin"|not registered for scope "admin"/,
    );
  });
});

describe('宣言しない相手には発行しない (#2169)', () => {
  it('T-SCOPE-011 user が宣言していなければ要求した scope は通らない', () => {
    // 以前は「制約なし」 として素通ししていた形。 案 3 を退けた理由がここ。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
      users: [{ subject: 'user-1' }],
    });

    expect(() => grantedScope(server, 'openid')).toThrow(
      /user "user-1" not entitled to scope "openid"/,
    );
  });

  it('T-SCOPE-012 client が宣言していなければ要求した scope は通らない', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });

    expect(() => grantedScope(server, 'openid')).toThrow(
      /client "client-A" not registered for scope "openid"/,
    );
  });

  it('T-SCOPE-013 空配列は省略と同じ扱いになる', () => {
    // 2 つを区別しない。 区別する案 (案 3) は未指定側が素通しになるため退けた。
    const omitted = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
      users: [{ subject: 'user-1' }],
    });
    const empty = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
      users: [{ subject: 'user-1', scopes: [] }],
    });

    const messageOf = (server: AuthorizationServer): string => {
      try {
        grantedScope(server, 'openid');
        return '';
      } catch (caught) {
        return (caught as Error).message;
      }
    };

    expect(messageOf(omitted), '省略でも拒否される').toMatch(/not entitled to scope "openid"/);
    expect(messageOf(empty), '空配列でも同じ理由で拒否される').toBe(messageOf(omitted));
  });
});

describe('要求しない経路は交差を返す (#2169)', () => {
  it('T-SCOPE-021 双方が宣言していれば交差が出る', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'profile'] }],
    });

    expect(grantedScope(server), 'client が許す側だけが残る').toBe('openid');
  });

  it('T-SCOPE-022 client が宣言していなければ交差は空になる', () => {
    // **要求あり経路と揃えた**。 以前は client が空なら交差を取らずに user の集合を
    // そのまま返しており、 宣言していない client に scope が載っていた。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'profile'] }],
    });

    expect(grantedScope(server)).toBe('');
  });

  it('T-SCOPE-023 user が宣言していなければ交差は空になる', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
      users: [{ subject: 'user-1' }],
    });

    expect(grantedScope(server)).toBe('');
  });

  it('T-SCOPE-024 scope に関心の無い検査は今までどおり省略できる', () => {
    // 要求しなければ throw しない。 省略を空集合にしても、 scope を使わない検査は
    // 書き換え不要という保証。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1' }],
    });

    expect(grantedScope(server)).toBe('');
  });
});
