import { createHmac, createSign, createVerify, type KeyLike } from 'node:crypto';

export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256';

export type JWTPayload = Record<string, unknown>;

export interface JWTVerifyResult {
  valid: boolean;
  payload?: JWTPayload;
  algorithm: JWTAlgorithm;
  reason?: string;
}

const HMAC_ALG_MAP: Record<string, string> = {
  HS256: 'sha256',
  HS384: 'sha384',
  HS512: 'sha512',
};

const RSA_ALG_MAP: Record<string, string> = {
  RS256: 'RSA-SHA256',
  RS384: 'RSA-SHA384',
  RS512: 'RSA-SHA512',
  ES256: 'sha256',
};

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

export function signJWT(payload: JWTPayload, secret: string | KeyLike, algorithm: JWTAlgorithm = 'HS256'): string {
  const header = { alg: algorithm, typ: 'JWT' };
  const headerEnc = base64url(JSON.stringify(header));
  const payloadEnc = base64url(JSON.stringify(payload));
  const signingInput = `${headerEnc}.${payloadEnc}`;

  let signature: string;
  if (algorithm.startsWith('HS')) {
    const hmacAlg = HMAC_ALG_MAP[algorithm]!;
    signature = base64url(createHmac(hmacAlg, secret as string).update(signingInput).digest());
  } else if (algorithm.startsWith('RS') || algorithm === 'ES256') {
    const rsaAlg = RSA_ALG_MAP[algorithm]!;
    const signer = createSign(rsaAlg);
    signer.update(signingInput);
    signature = base64url(signer.sign(secret as KeyLike));
  } else {
    throw new Error(`unsupported algorithm: ${algorithm}`);
  }
  return `${signingInput}.${signature}`;
}

export function verifyJWT(token: string, secret: string | KeyLike, algorithm: JWTAlgorithm = 'HS256'): JWTVerifyResult {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, algorithm, reason: 'invalid token format' };
  }
  const [headerEnc, payloadEnc, signatureEnc] = parts as [string, string, string];
  const signingInput = `${headerEnc}.${payloadEnc}`;

  try {
    if (algorithm.startsWith('HS')) {
      const hmacAlg = HMAC_ALG_MAP[algorithm]!;
      const expected = base64url(createHmac(hmacAlg, secret as string).update(signingInput).digest());
      if (expected !== signatureEnc) {
        return { valid: false, algorithm, reason: 'signature mismatch' };
      }
    } else if (algorithm.startsWith('RS') || algorithm === 'ES256') {
      const rsaAlg = RSA_ALG_MAP[algorithm]!;
      const verifier = createVerify(rsaAlg);
      verifier.update(signingInput);
      const ok = verifier.verify(secret as KeyLike, base64urlDecode(signatureEnc));
      if (!ok) {
        return { valid: false, algorithm, reason: 'signature mismatch' };
      }
    } else {
      return { valid: false, algorithm, reason: `unsupported algorithm: ${algorithm}` };
    }
    const payload = JSON.parse(base64urlDecode(payloadEnc).toString('utf8')) as JWTPayload;
    return { valid: true, payload, algorithm };
  } catch (e) {
    return { valid: false, algorithm, reason: (e as Error).message };
  }
}
