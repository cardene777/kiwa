import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export type AesMode = 'aes-256-cbc' | 'aes-256-gcm' | 'aes-128-cbc' | 'aes-128-gcm';

export interface AesEncryptResult {
  ciphertext: Buffer;
  iv: Buffer;
  authTag?: Buffer;
}

function ivLengthFor(mode: AesMode): number {
  return mode.endsWith('gcm') ? 12 : 16;
}

function keyLengthFor(mode: AesMode): number {
  return mode.startsWith('aes-256') ? 32 : 16;
}

export function aesEncrypt(plaintext: string | Buffer, key: Buffer, mode: AesMode = 'aes-256-gcm'): AesEncryptResult {
  const expected = keyLengthFor(mode);
  if (key.length !== expected) {
    throw new Error(`invalid key length for ${mode}: expected ${expected} bytes, got ${key.length}`);
  }
  const iv = randomBytes(ivLengthFor(mode));
  const cipher = createCipheriv(mode, key, iv);
  const buf = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf8') : plaintext;
  const ciphertext = Buffer.concat([cipher.update(buf), cipher.final()]);
  if (mode.endsWith('gcm')) {
    const authTag = (cipher as unknown as { getAuthTag: () => Buffer }).getAuthTag();
    return { ciphertext, iv, authTag };
  }
  return { ciphertext, iv };
}

export function aesDecrypt(
  input: { ciphertext: Buffer; iv: Buffer; authTag?: Buffer },
  key: Buffer,
  mode: AesMode = 'aes-256-gcm',
): Buffer {
  const decipher = createDecipheriv(mode, key, input.iv);
  if (mode.endsWith('gcm')) {
    if (!input.authTag) throw new Error('authTag required for GCM decryption');
    (decipher as unknown as { setAuthTag: (t: Buffer) => void }).setAuthTag(input.authTag);
  }
  return Buffer.concat([decipher.update(input.ciphertext), decipher.final()]);
}
