/**
 * `scopes` の 3 状態を確かめる (Issue #2169)。
 *
 * mock AS は `scopes` を任意 field にしているが、 以前は `?? []` で `undefined` と
 * `[]` を同じ値に潰していた。 その結果、
 *
 * - 宣言していない user / client に対して **任意の scope が通る**
 * - 「1 つも許可しない」 を表現する手段が無い
 *
 * の 2 つが同時に起きていた。 前者は generator-verifier が finding #15 として検出し、
 * 「未登録 scope の無制限認可」 と呼んだ。
 *
 * 直し方は 3 案あった。
 *
 * | # | 案 | 採否 |
 * |---|---|---|
 * | 1 | doc を実装に合わせる (未登録は常に無制限) | 「1 つも許可しない」 を表現できないままになる |
 * | 2 | 実装を doc に合わせる (未登録は空集合として全拒否) | 既存の検査が scope を省く形を「制約なし」 として使っている |
 * | 3 | **未指定と空配列を区別する** | 採用 |
 *
 * 案 3 を採ったのは、 既存の使い方を壊さずに欠けていた表現を足せるため。
 * 実測で `scopes: []` を渡す code は repo に 1 件も無かった。
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

describe('AuthorizationUser.scopes — 未指定 / 空配列 / 集合 の 3 状態 (#2169)', () => {
  it('T-SCOPE-001 未指定の user は制約を受けない', () => {
    // 集合を宣言していない = 絞る根拠が無い。 test が scope に関心を持たない時の既定。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1' }],
    });

    expect(grantedScope(server, 'openid email'), '要求がそのまま通る').toBe('openid email');
  });

  it('T-SCOPE-002 空配列の user は要求した scope を拒否する', () => {
    // **未指定との違いがここに出る**。 潰していた頃は同じ結果 (無制限) だった。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1', scopes: [] }],
    });

    expect(() => grantedScope(server, 'openid')).toThrow(
      /user "user-1" not entitled to scope "openid"/,
    );
  });

  it('T-SCOPE-003 集合を宣言した user は集合の外を拒否する', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });

    expect(grantedScope(server, 'openid'), '集合の内側は通る').toBe('openid');
    expect(() => grantedScope(server, 'admin')).toThrow(
      /user "user-1" not entitled to scope "admin"/,
    );
  });

  it('T-SCOPE-004 空配列の user は要求なしでも空 scope になる', () => {
    // 要求なしの経路は user の集合をそのまま返す。 空配列なら空文字。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1', scopes: [] }],
    });

    expect(grantedScope(server)).toBe('');
  });
});

describe('ClientRegistration.scopes — 同じ 3 状態 (#2169)', () => {
  it('T-SCOPE-011 未指定の client は user 側の集合を絞らない', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'profile'] }],
    });

    expect(grantedScope(server), '要求なしなら user の集合がそのまま出る').toBe('openid profile');
    expect(grantedScope(server, 'openid'), '要求ありなら user 側だけが効く').toBe('openid');
  });

  it('T-SCOPE-012 空配列の client は要求した scope を拒否する', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: [] }],
      users: [{ subject: 'user-1', scopes: ['openid'] }],
    });

    expect(() => grantedScope(server, 'openid')).toThrow(
      /client "client-A" not registered for scope "openid"/,
    );
  });

  it('T-SCOPE-013 空配列の client は要求なしでも交差が空になる', () => {
    // **未指定との違いがここに出る**。 未指定なら user の集合がそのまま出る
    // (T-SCOPE-011) が、 空配列は交差を取って空になる。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: [] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'profile'] }],
    });

    expect(grantedScope(server)).toBe('');
  });

  it('T-SCOPE-014 集合を宣言した client は交差だけを出す', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT], scopes: ['openid'] }],
      users: [{ subject: 'user-1', scopes: ['openid', 'profile'] }],
    });

    expect(grantedScope(server), '要求なしなら交差').toBe('openid');
    expect(() => grantedScope(server, 'profile')).toThrow(
      /client "client-A" not registered for scope "profile"/,
    );
  });
});

describe('双方が未指定の形 (#2169)', () => {
  it('T-SCOPE-021 双方未指定なら要求がそのまま通る', () => {
    // 誰も制約を宣言していない = 拒否の根拠が無い。 これが本 Issue で
    // 「無制限認可」 と呼ばれた挙動で、 **意図した既定として残す**。
    // 拒否したい test は `scopes: []` を渡す (T-SCOPE-002 / T-SCOPE-012)。
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1' }],
    });

    expect(grantedScope(server, 'openid email admin')).toBe('openid email admin');
  });

  it('T-SCOPE-022 双方未指定 + 要求なしなら空 scope', () => {
    const server = makeServer({
      clients: [{ clientId: 'client-A', redirectUris: [REDIRECT] }],
      users: [{ subject: 'user-1' }],
    });

    expect(grantedScope(server)).toBe('');
  });
});
