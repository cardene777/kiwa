import { generateKeyPairSync, type KeyObject } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createIdTokenSigner,
  createJwksDocumentVerifier,
  createJwksEndpoint,
  __resetJwksCounter,
} from '../src/index.js';
import type {
  JwksDocument,
  JwksEndpoint,
  JwksKey,
  VerifyIdTokenOptions,
} from '../src/oidc/types.js';

/**
 * base64url without padding (RFC 7515 §2)。 署名検証の分岐だけを狙う test では
 * 実署名を作らずに JWT を組み立てたいので、 encode を手元に持つ。
 */
function b64url(input: string | Buffer): string {
  return (typeof input === 'string' ? Buffer.from(input, 'utf-8') : input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 指定 header / payload / signature をそのまま並べた JWT を作る。
 * `verifySignature` は header と payload の中身に依存せず JWKS entry の形だけで
 * 早期 return する分岐を複数持つため、 署名が正しいかどうかは問わない入力で
 * その分岐に到達させる。
 */
function craftJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  signature = 'c2ln',
): string {
  return `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}.${signature}`;
}

/**
 * `allKeys()` だけを本物らしく返す最小の JWKS endpoint。
 * `verify` 経路が触るのは `allKeys()` のみなので、 sign 側の member は
 * 呼ばれたら test が落ちるように throw させて「verify が sign 側の state を
 * 触っていない」 ことも同時に固定する。
 */
function verifyOnlyEndpoint(keys: readonly JwksKey[]): JwksEndpoint {
  return {
    url: 'https://op.example.test/jwks',
    fetch: () => ({ keys }),
    rotate: () => {
      throw new Error('verifyOnlyEndpoint: rotate must not be reached from verify');
    },
    activeKey: () => {
      throw new Error('verifyOnlyEndpoint: activeKey must not be reached from verify');
    },
    allKeys: () => keys,
    signingKeyFor: () => undefined,
  };
}

const VERIFY_OPTS: VerifyIdTokenOptions = {
  expectedIssuer: 'https://op.example.test',
  expectedAudience: 'rp-client',
};

describe('id_token verifySignature — JWKS entry の形が壊れている場合', () => {
  it('alg=RS256 なのに kty が RSA でない entry は署名検証前に落とす', () => {
    // alg は HTTP 越しに来るため kty との組合せが保証されない。
    // Node は鍵から署名方式を決めるので、 組合せが崩れた entry を
    // そのまま createPublicKey に渡すと別方式で検証してしまう。
    const key: JwksKey = {
      kid: 'k-mismatch',
      alg: 'RS256',
      kty: 'EC',
      crv: 'P-256',
      x: 'AA',
      y: 'AA',
      use: 'sig',
    };
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: verifyOnlyEndpoint([key]),
    });
    const jwt = craftJwt(
      { alg: 'RS256', typ: 'JWT', kid: 'k-mismatch' },
      { iss: 'https://op.example.test', sub: 'u1', aud: 'rp-client' },
    );

    const result = signer.verify(jwt, VERIFY_OPTS);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('id_token: signature verification failed');
  });

  it('alg=RS256 で n / e が欠けた entry も落とす', () => {
    const key: JwksKey = { kid: 'k-noN', alg: 'RS256', kty: 'RSA', e: 'AQAB', use: 'sig' };
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: verifyOnlyEndpoint([key]),
    });
    const jwt = craftJwt(
      { alg: 'RS256', typ: 'JWT', kid: 'k-noN' },
      { iss: 'https://op.example.test', sub: 'u1', aud: 'rp-client' },
    );

    expect(signer.verify(jwt, VERIFY_OPTS).reason).toBe(
      'id_token: signature verification failed',
    );
  });

  it('alg=ES256 で crv が P-256 でない entry は RFC 7518 §3.4 の外なので落とす', () => {
    const key = {
      kid: 'k-wrongcrv',
      alg: 'ES256',
      kty: 'EC',
      crv: 'P-384',
      x: 'AA',
      y: 'AA',
      use: 'sig',
    } as unknown as JwksKey;
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: verifyOnlyEndpoint([key]),
    });
    const jwt = craftJwt(
      { alg: 'ES256', typ: 'JWT', kid: 'k-wrongcrv' },
      { iss: 'https://op.example.test', sub: 'u1', aud: 'rp-client' },
    );

    expect(signer.verify(jwt, VERIFY_OPTS).reason).toBe(
      'id_token: signature verification failed',
    );
  });

  it('alg=ES256 で x / y が欠けた entry も落とす', () => {
    const key: JwksKey = {
      kid: 'k-noxy',
      alg: 'ES256',
      kty: 'EC',
      crv: 'P-256',
      use: 'sig',
    };
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: verifyOnlyEndpoint([key]),
    });
    const jwt = craftJwt(
      { alg: 'ES256', typ: 'JWT', kid: 'k-noxy' },
      { iss: 'https://op.example.test', sub: 'u1', aud: 'rp-client' },
    );

    expect(signer.verify(jwt, VERIFY_OPTS).reason).toBe(
      'id_token: signature verification failed',
    );
  });

  it('この signer が発行しない alg (PS256) は header と JWKS が一致していても拒否する', () => {
    // alg は TypeScript の union では守れない (HTTP 越しに任意の文字列が来る)。
    // header と entry の両方を PS256 にすると alg 一致 check を通過するため、
    // 閉じた集合に無い alg を弾く default 分岐だけが最後の砦になる。
    const key = {
      kid: 'k-ps256',
      alg: 'PS256',
      kty: 'RSA',
      n: 'AQAB',
      e: 'AQAB',
      use: 'sig',
    } as unknown as JwksKey;
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: verifyOnlyEndpoint([key]),
    });
    const jwt = craftJwt(
      { alg: 'PS256', typ: 'JWT', kid: 'k-ps256' },
      { iss: 'https://op.example.test', sub: 'u1', aud: 'rp-client' },
    );

    expect(signer.verify(jwt, VERIFY_OPTS).reason).toBe(
      'id_token: signature verification failed',
    );
  });

  it('形は揃っていても createPublicKey が受け付けない鍵素材は false を返す (throw させない)', () => {
    // x / y が曲線上の点にならない値。 member の有無 check は通過するので、
    // createPublicKey の失敗を握る try/catch が無いと verify が例外で抜ける。
    const key: JwksKey = {
      kid: 'k-badpoint',
      alg: 'ES256',
      kty: 'EC',
      crv: 'P-256',
      x: 'AA',
      y: 'AA',
      use: 'sig',
    };
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: verifyOnlyEndpoint([key]),
    });
    const jwt = craftJwt(
      { alg: 'ES256', typ: 'JWT', kid: 'k-badpoint' },
      { iss: 'https://op.example.test', sub: 'u1', aud: 'rp-client' },
    );

    expect(() => signer.verify(jwt, VERIFY_OPTS)).not.toThrow();
    expect(signer.verify(jwt, VERIFY_OPTS).reason).toBe(
      'id_token: signature verification failed',
    );
  });
});

describe('id_token ES256 — RFC 7518 §3.4 の R||S 署名', () => {
  it('ES256 の JWKS で署名した id_token が同じ JWKS で検証できる', () => {
    __resetJwksCounter();
    const jwks = createJwksEndpoint({
      url: 'https://op.example.test/jwks',
      initialAlg: 'ES256',
      now: () => 1_700_000_000_000,
    });
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks,
      now: () => 1_700_000_000_000,
    });

    const token = signer.sign({ sub: 'user-es', aud: 'rp-client' });

    // ES256 は DER ではなく固定幅 R||S なので、 署名部は 64 byte = 86 文字。
    // DER が混ざると RP 側の検証が通らないため長さも固定する。
    const parts = token.jwt.split('.');
    expect(parts).toHaveLength(3);
    expect(Buffer.from(parts[2] as string, 'base64url')).toHaveLength(64);
    expect(token.header.alg).toBe('ES256');

    const verified = signer.verify(token.jwt, VERIFY_OPTS);
    expect(verified.valid).toBe(true);
    expect(verified.claims?.sub).toBe('user-es');
  });

  it('ES256 の payload を書き換えると署名検証で落ちる', () => {
    const jwks = createJwksEndpoint({
      url: 'https://op.example.test/jwks',
      initialAlg: 'ES256',
      now: () => 1_700_000_000_000,
    });
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks,
      now: () => 1_700_000_000_000,
    });
    const token = signer.sign({ sub: 'user-es', aud: 'rp-client' });
    const [headerB64, , signature] = token.jwt.split('.');
    const tampered = `${headerB64}.${b64url(
      JSON.stringify({ ...token.claims, sub: 'attacker' }),
    )}.${signature}`;

    expect(signer.verify(tampered, VERIFY_OPTS).reason).toBe(
      'id_token: signature verification failed',
    );
  });
});

describe('id_token sign / verify の残り分岐', () => {
  it('activeKey の kid に対する私有鍵が無ければ署名せず throw する', () => {
    // activeKey() が返した kid を signingKeyFor() が知らない = 2 つの registry が
    // 割れている状態。 誰も検証できない token を出すより落ちる方が安全。
    const active: JwksKey = {
      kid: 'k-ghost',
      alg: 'RS256',
      kty: 'RSA',
      n: 'AQAB',
      e: 'AQAB',
      use: 'sig',
    };
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: {
        url: '',
        fetch: () => ({ keys: [active] }),
        rotate: () => active,
        activeKey: () => active,
        allKeys: () => [active],
        signingKeyFor: (): KeyObject | undefined => undefined,
      },
    });

    expect(() => signer.sign({ sub: 'u1', aud: 'rp-client' })).toThrow(
      'id_token: no signing key registered for kid "k-ghost"',
    );
  });

  it('payload が JSON でない JWT は payload parse failed として返す', () => {
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks: verifyOnlyEndpoint([]),
    });
    const jwt = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'k1' }))}.${b64url(
      'not-json',
    )}.c2ln`;

    const result = signer.verify(jwt, VERIFY_OPTS);

    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/^id_token: payload parse failed — /);
  });

  it('iat が skew を超えて未来にある token は拒否する', () => {
    __resetJwksCounter();
    const signAt = 1_700_000_600_000;
    const jwks = createJwksEndpoint({ url: 'https://op.example.test/jwks', now: () => signAt });
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks,
      now: () => signAt,
    });
    const token = signer.sign({ sub: 'u1', aud: 'rp-client' });

    // RP 側の時計が 10 分遅れている状況。 skew を 60 s に絞ると iat が未来に
    // 見えるので、 clock drift を使った replay として拒否されるべき。
    const result = signer.verify(token.jwt, {
      ...VERIFY_OPTS,
      now: () => signAt - 600_000,
      clockSkewSec: 60,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/^id_token: iat in the future — /);
  });
});

describe('createJwksDocumentVerifier — RP が download した JWKS 文書だけで検証する', () => {
  function opSide(nowMs: number): {
    signer: ReturnType<typeof createIdTokenSigner>;
    document: JwksDocument;
  } {
    __resetJwksCounter();
    const jwks = createJwksEndpoint({ url: 'https://op.example.test/jwks', now: () => nowMs });
    const signer = createIdTokenSigner({
      issuer: 'https://op.example.test',
      jwks,
      now: () => nowMs,
    });
    return { signer, document: jwks.fetch() };
  }

  it('OP が署名した id_token を公開鍵だけで検証できる', () => {
    const now = 1_700_000_000_000;
    const { signer, document } = opSide(now);
    const token = signer.sign({
      sub: 'user-rp',
      aud: 'rp-client',
      nonce: 'n-1',
      accessToken: 'at-1',
      code: 'code-1',
    });

    const verify = createJwksDocumentVerifier(document, () => now);
    const result = verify(token.jwt, {
      ...VERIFY_OPTS,
      expectedNonce: 'n-1',
      expectedAccessToken: 'at-1',
      expectedCode: 'code-1',
    });

    expect(result.valid).toBe(true);
    expect(result.claims?.sub).toBe('user-rp');
  });

  it('文書は複製されるので、 呼出側が返り値を書き換えても検証は影響を受けない', () => {
    const now = 1_700_000_000_000;
    const { signer, document } = opSide(now);
    const token = signer.sign({ sub: 'user-rp', aud: 'rp-client' });
    const verify = createJwksDocumentVerifier(document, () => now);

    // RP が受け取った文書の配列を後から潰しても、 verifier が握った snapshot は
    // 独立していなければならない (共有していると 1 回の事故で検証が全断する)。
    (document.keys as JwksKey[]).length = 0;

    expect(verify(token.jwt, VERIFY_OPTS).valid).toBe(true);
  });

  it('文書に無い kid の token は kid not found で落ちる', () => {
    const now = 1_700_000_000_000;
    const { signer } = opSide(now);
    const token = signer.sign({ sub: 'user-rp', aud: 'rp-client' });

    // 別の OP が出した JWKS 文書。 kid 空間が重ならないので照合できない。
    const foreign = generateKeyPairSync('rsa', { modulusLength: 2048 }).publicKey.export({
      format: 'jwk',
    });
    const verify = createJwksDocumentVerifier({
      keys: [
        {
          kid: 'foreign-1',
          alg: 'RS256',
          kty: 'RSA',
          n: foreign.n as string,
          e: foreign.e as string,
          use: 'sig',
        },
      ],
    });

    expect(verify(token.jwt, VERIFY_OPTS).reason).toMatch(/not found in JWKS$/);
  });

  it('clock を渡さない場合は実時計で動き、 期限切れ token を拒否する', () => {
    // now を省略した経路 (spread が空 object に落ちる側) を通す。
    const past = Date.now() - 7_200_000;
    const { signer, document } = opSide(past);
    const token = signer.sign({ sub: 'user-rp', aud: 'rp-client', lifetimeSec: 60 });

    const verify = createJwksDocumentVerifier(document);

    expect(verify(token.jwt, VERIFY_OPTS).reason).toMatch(/^id_token: exp expired — /);
  });
});
