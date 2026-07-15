import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type StreamCipherAlgorithm = 'aes-256-ctr' | 'chacha20-poly1305';

export interface StreamEncryptResult {
  ciphertext: string;
  iv: string;
  authTag?: string;
  algorithm: StreamCipherAlgorithm;
}

/**
 * stream cipher (AES-CTR / ChaCha20-Poly1305) で byte 流を encrypt。 real
 * TLS record layer / Signal Protocol の対称暗号 stream mode 相当。
 */
export function streamEncrypt(plaintext: string, key: Buffer, algorithm: StreamCipherAlgorithm = 'aes-256-ctr'): StreamEncryptResult {
  const iv = randomBytes(algorithm === 'chacha20-poly1305' ? 12 : 16);
  if (algorithm === 'chacha20-poly1305') {
    const cipher = createCipheriv('chacha20-poly1305', key, iv, { authTagLength: 16 });
    const enc = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
    const authTag = cipher.getAuthTag().toString('hex');
    return { ciphertext: enc.toString('base64'), iv: iv.toString('hex'), authTag, algorithm };
  }
  const cipher = createCipheriv('aes-256-ctr', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  return { ciphertext: enc.toString('base64'), iv: iv.toString('hex'), algorithm };
}

export function streamDecrypt(result: StreamEncryptResult, key: Buffer): string {
  const iv = Buffer.from(result.iv, 'hex');
  if (result.algorithm === 'chacha20-poly1305') {
    const decipher = createDecipheriv('chacha20-poly1305', key, iv, { authTagLength: 16 });
    decipher.setAuthTag(Buffer.from(result.authTag!, 'hex'));
    const dec = Buffer.concat([decipher.update(Buffer.from(result.ciphertext, 'base64')), decipher.final()]);
    return dec.toString('utf-8');
  }
  const decipher = createDecipheriv('aes-256-ctr', key, iv);
  const dec = Buffer.concat([decipher.update(Buffer.from(result.ciphertext, 'base64')), decipher.final()]);
  return dec.toString('utf-8');
}
