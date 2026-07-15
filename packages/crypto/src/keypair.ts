import { generateKeyPairSync } from 'node:crypto';

export type KeyPairType = 'rsa' | 'ec' | 'ed25519';

export interface KeyPairResult {
  publicKey: string;
  privateKey: string;
  type: KeyPairType;
}

export function generateKeyPair(type: KeyPairType = 'rsa', options?: { modulusLength?: number; namedCurve?: string }): KeyPairResult {
  if (type === 'rsa') {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: options?.modulusLength ?? 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey, type };
  }
  if (type === 'ec') {
    const { publicKey, privateKey } = generateKeyPairSync('ec', {
      namedCurve: options?.namedCurve ?? 'P-256',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey, type };
  }
  if (type === 'ed25519') {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKey, privateKey, type };
  }
  throw new Error(`unsupported key type: ${type}`);
}
