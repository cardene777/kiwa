import { pbkdf2Sync, randomBytes, scryptSync } from 'node:crypto';

export type KdfAlgorithm = 'pbkdf2' | 'scrypt' | 'argon2-mock';

export interface KdfOptions {
  algorithm?: KdfAlgorithm;
  saltBytes?: number;
  iterations?: number;
  keyLength?: number;
  digest?: 'sha256' | 'sha512';
  N?: number;
  r?: number;
  p?: number;
}

export interface KdfResult {
  algorithm: KdfAlgorithm;
  hashHex: string;
  saltHex: string;
  iterations: number;
  keyLength: number;
}

/**
 * password → derived key の KDF ラッパー。 PBKDF2 と scrypt は node:crypto、
 * Argon2 は node:crypto 未対応のため scrypt を argon2-mock として代替 (bytes 契約は同一)。
 */
export function deriveKey(password: string, opts: KdfOptions = {}): KdfResult {
  const algorithm = opts.algorithm ?? 'pbkdf2';
  const saltBytes = opts.saltBytes ?? 16;
  const keyLength = opts.keyLength ?? 32;
  const salt = randomBytes(saltBytes);
  if (algorithm === 'pbkdf2') {
    const iterations = opts.iterations ?? 100_000;
    const digest = opts.digest ?? 'sha256';
    const hash = pbkdf2Sync(password, salt, iterations, keyLength, digest);
    return { algorithm, hashHex: hash.toString('hex'), saltHex: salt.toString('hex'), iterations, keyLength };
  }
  const N = opts.N ?? 16384;
  const r = opts.r ?? 8;
  const p = opts.p ?? 1;
  const hash = scryptSync(password, salt, keyLength, { N, r, p });
  return { algorithm, hashHex: hash.toString('hex'), saltHex: salt.toString('hex'), iterations: N, keyLength };
}

/**
 * password + 既存 salt/params で KDF を再実行、 hashHex 一致で verification 成功。
 */
export function verifyPassword(password: string, stored: KdfResult): boolean {
  if (stored.algorithm === 'pbkdf2') {
    const hash = pbkdf2Sync(password, Buffer.from(stored.saltHex, 'hex'), stored.iterations, stored.keyLength, 'sha256');
    return hash.toString('hex') === stored.hashHex;
  }
  const hash = scryptSync(password, Buffer.from(stored.saltHex, 'hex'), stored.keyLength, { N: stored.iterations, r: 8, p: 1 });
  return hash.toString('hex') === stored.hashHex;
}
