import { createHash, createHmac } from 'node:crypto';

export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512' | 'blake2b512' | 'blake2s256' | 'sha1' | 'md5';

export type HmacAlgorithm = HashAlgorithm;

export function hashData(
  data: string | Buffer,
  algorithm: HashAlgorithm = 'sha256',
  encoding: 'hex' | 'base64' | 'binary' = 'hex',
): string {
  const hash = createHash(algorithm);
  hash.update(data);
  return hash.digest(encoding);
}

export function hmacDigest(
  data: string | Buffer,
  secret: string | Buffer,
  algorithm: HmacAlgorithm = 'sha256',
  encoding: 'hex' | 'base64' | 'binary' = 'hex',
): string {
  const hmac = createHmac(algorithm, secret);
  hmac.update(data);
  return hmac.digest(encoding);
}
