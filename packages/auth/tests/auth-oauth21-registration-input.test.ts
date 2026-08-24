/**
 * 登録入力の形が copy 経路と噛み合うことを固定する (#2190)。
 *
 * `createAuthorizationServer()` の登録経路は受け取った object を spread で copy する。
 * spread と `Object.entries()` は **own enumerable string key しか見ない**ので、 型に沿った
 * 正当な入力でも次の 4 形は copy を通ると壊れる。 4 形とも `tsc --noEmit` を通ることを実測済。
 *
 * | # | 形 | copy を通ると |
 * |---|---|---|
 * | 1 | `class C implements ClientRegistration` (field が prototype 側) | 全 field が消える |
 * | 2 | `Object.defineProperty(o, 'scopes', { enumerable: false })` | その field が消える |
 * | 3 | getter を持つ object literal | key と保存値で **2 回評価** される |
 * | 4 | `unique symbol` の配列 field | 走査されず copy が同一参照になる |
 *
 * **落ちる場所が悪かった**。 1 / 2 / 4 は登録時に何も起きず、 `authorize()` が
 * `redirectUris.includes` で `TypeError` を投げるまで気付けない。 message も原因を指さない。
 *
 * 1 / 2 / 4 は登録の入口で拒否し、 3 は snapshot から key を採ることで多重評価そのものを消した。
 */
import { describe, expect, it } from 'vitest';

import {
  __resetOAuth21Counters,
  createAuthorizationServer,
  type AuthorizationUser,
  type ClientRegistration,
} from '../src/index.js';

const REDIRECT = 'https://app.example.test/cb';

function makeServer(): ReturnType<typeof createAuthorizationServer> {
  __resetOAuth21Counters();
  return createAuthorizationServer({ issuer: 'https://as.example.test' });
}

describe('登録入力の形が copy 経路と噛み合う (#2190)', () => {
  it('T-REG-001 prototype 側に field を持つ class を拒否する', () => {
    // `Object.keys(new C())` は空。 spread は 1 件も拾わないので、 登録は素通りして
    // `authorize()` が `redirectUris.includes` で落ちていた。
    class Client implements ClientRegistration {
      get clientId(): string {
        return 'client-class';
      }
      get redirectUris(): readonly string[] {
        return [REDIRECT];
      }
    }
    const server = makeServer();
    expect(() => server.registerClient(new Client()), 'class を受け入れている').toThrow(
      /not own enumerable properties/,
    );
  });

  it('T-REG-002 enumerable: false の field を持つ入力を拒否する', () => {
    // spread はこの field を落とす。 型の上では在るのに保存側から消えるので、 scope 判定が
    // 「宣言されていない」 側へ倒れる。
    const client = { clientId: 'client-B', redirectUris: [REDIRECT] } as ClientRegistration & {
      scopes?: readonly string[];
    };
    Object.defineProperty(client, 'scopes', {
      value: ['openid'],
      enumerable: false,
      writable: true,
      configurable: true,
    });

    const server = makeServer();
    expect(() => server.registerClient(client), 'enumerable: false を受け入れている').toThrow(
      /would be lost when copying/,
    );
  });

  it('T-REG-003 symbol key を持つ入力を拒否する', () => {
    // `Object.entries()` は symbol を走査しないので、 その field の配列は copy されず
    // 呼出側と参照を共有する = 登録後の `push` が内部に届く。
    const marker = Symbol('extra');
    const client = {
      clientId: 'client-C',
      redirectUris: [REDIRECT],
      [marker]: ['openid'],
    } as ClientRegistration;

    const server = makeServer();
    expect(() => server.registerClient(client), 'symbol key を受け入れている').toThrow(
      /would be lost when copying/,
    );
  });

  it('T-REG-004 getter を 2 回評価しない', () => {
    // key を `client.clientId` から別に読むと getter が 2 回走る。 1 回目と 2 回目で違う値を
    // 返す入力では **Map の key と保存値が食い違い**、 その client を引けなくなる。
    let reads = 0;
    const client = {
      get clientId(): string {
        reads += 1;
        return `key-${reads}`;
      },
      redirectUris: [REDIRECT],
    } as ClientRegistration;

    const server = makeServer();
    server.registerClient(client);

    expect(reads, 'getter を 2 回以上評価している').toBe(1);
    // key と保存値が一致する = 登録した id でそのまま引ける。
    expect(() =>
      server.authorize(
        {
          responseType: 'code',
          clientId: 'key-1',
          redirectUri: REDIRECT,
          state: 's',
          codeChallenge: 'x'.repeat(43),
          codeChallengeMethod: 'S256',
        },
        'user-1',
      ),
    ).not.toThrow(/unknown client_id/);
  });

  it('T-REG-005 素の object literal は通る', () => {
    // 陰性対照。 拒否の判定を「常に落とす」 形にすると、 正当な登録が全て落ちる。
    const server = makeServer();
    expect(() =>
      server.registerClient({ clientId: 'client-D', redirectUris: [REDIRECT], scopes: ['openid'] }),
    ).not.toThrow();
    expect(() =>
      server.registerUser({ subject: 'user-D', scopes: ['openid'] } as AuthorizationUser),
    ).not.toThrow();
  });

  it('T-REG-006 user 側も同じ形で拒否する', () => {
    // 登録経路は client と user の 2 つある。 片方だけ塞ぐと、 もう片方から同じ形が入る。
    class User implements AuthorizationUser {
      get subject(): string {
        return 'user-class';
      }
    }
    const server = makeServer();
    expect(() => server.registerUser(new User()), 'user 側の class を受け入れている').toThrow(
      /not own enumerable properties/,
    );
  });
});
