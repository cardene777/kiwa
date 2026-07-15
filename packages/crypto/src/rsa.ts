import {
  createSign,
  createVerify,
  publicEncrypt,
  privateDecrypt,
  generateKeyPairSync,
  type KeyLike,
} from 'node:crypto';

export interface RsaVerifyResult {
  valid: boolean;
  reason?: string;
}

export function rsaSign(data: string | Buffer, privateKey: KeyLike, algorithm: string = 'RSA-SHA256'): Buffer {
  const signer = createSign(algorithm);
  signer.update(data);
  return signer.sign(privateKey);
}

export function rsaVerify(
  data: string | Buffer,
  signature: Buffer,
  publicKey: KeyLike,
  algorithm: string = 'RSA-SHA256',
): RsaVerifyResult {
  try {
    const verifier = createVerify(algorithm);
    verifier.update(data);
    const valid = verifier.verify(publicKey, signature);
    if (valid) return { valid: true };
    return { valid: false, reason: 'signature mismatch' };
  } catch (e) {
    return { valid: false, reason: (e as Error).message };
  }
}

export function rsaEncrypt(data: string | Buffer, publicKey: KeyLike): Buffer {
  const buf = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  return publicEncrypt(publicKey, buf);
}

export function rsaDecrypt(cipher: Buffer, privateKey: KeyLike): Buffer {
  return privateDecrypt(privateKey, cipher);
}

export function generateRsaKeyPair(modulusLength: number = 2048): { publicKey: string; privateKey: string } {
  return generateKeyPairSync('rsa', {
    modulusLength,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}
