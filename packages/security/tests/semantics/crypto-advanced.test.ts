import { describe, expect, it } from 'vitest';
import {
  deriveKey,
  encapsulatePq,
  rotateKey,
  sealAead,
  signWithHsm,
  startCryptoSession,
  wrapEnvelope,
} from '../../src/semantics/index.js';

describe('startCryptoSession', () => {
  it('creates idle session', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(s.state).toBe('idle');
    expect(s.currentKeyId).toBeNull();
  });

  it('throws when sessionId is empty', () => {
    expect(() => startCryptoSession({ target: 'vault', sessionId: '' })).toThrow(
      'sessionId must not be empty',
    );
  });
});

describe('sealAead', () => {
  it('records AES-256-GCM', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    const step = sealAead(s, { algo: 'AES-256-GCM', plaintextLen: 1024, aadLen: 32 });
    expect(step.metadata['algo']).toBe('AES-256-GCM');
    expect(step.metadata['ciphertextLen']).toBe(1024 + 16);
    expect(s.state).toBe('aead-sealed');
  });

  it('records ChaCha20-Poly1305', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    sealAead(s, { algo: 'ChaCha20-Poly1305', plaintextLen: 512, aadLen: 0 });
    expect(s.state).toBe('aead-sealed');
  });

  it('rejects negative plaintext', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      sealAead(s, { algo: 'AES-256-GCM', plaintextLen: -1, aadLen: 0 }),
    ).toThrow('non-negative');
  });

  it('rejects overlarge plaintext', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      sealAead(s, { algo: 'AES-256-GCM', plaintextLen: 1024 * 1024 * 128, aadLen: 0 }),
    ).toThrow('64MB not supported');
  });
});

describe('deriveKey', () => {
  it('derives HKDF-SHA256', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    const step = deriveKey(s, {
      algo: 'HKDF-SHA256',
      saltLen: 32,
      info: 'test',
      iterations: 1,
    });
    expect(step.metadata['algo']).toBe('HKDF-SHA256');
    expect(s.state).toBe('kdf-derived');
  });

  it('rejects short salt', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      deriveKey(s, {
        algo: 'HKDF-SHA256',
        saltLen: 4,
        info: '',
        iterations: 1,
      }),
    ).toThrow('salt must be >= 8');
  });

  it('rejects PBKDF2 with low iterations', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      deriveKey(s, {
        algo: 'PBKDF2',
        saltLen: 16,
        info: '',
        iterations: 1000,
      }),
    ).toThrow('>= 10000 iterations');
  });

  it('accepts PBKDF2 with sufficient iterations', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    deriveKey(s, {
      algo: 'PBKDF2',
      saltLen: 16,
      info: '',
      iterations: 100_000,
    });
    expect(s.state).toBe('kdf-derived');
  });

  it('rejects zero iterations', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      deriveKey(s, {
        algo: 'HKDF-SHA256',
        saltLen: 32,
        info: '',
        iterations: 0,
      }),
    ).toThrow('iterations must be >= 1');
  });
});

describe('wrapEnvelope', () => {
  it('wraps CEK with KEK via vault', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    const step = wrapEnvelope(s, {
      cek: 'cek-material',
      kek: 'kek-material',
      masterKeyProvider: 'vault',
    });
    expect(step.metadata['provider']).toBe('vault');
    expect(s.state).toBe('envelope-wrapped');
  });

  it('supports KMS and HSM providers', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    wrapEnvelope(s, { cek: 'a', kek: 'b', masterKeyProvider: 'kms' });
    expect(s.state).toBe('envelope-wrapped');
  });

  it('rejects empty CEK/KEK', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      wrapEnvelope(s, { cek: '', kek: 'x', masterKeyProvider: 'kms' }),
    ).toThrow('must not be empty');
  });
});

describe('rotateKey', () => {
  it('updates currentKeyId', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    rotateKey(s, { oldKeyId: 'k1', newKeyId: 'k2', reason: 'scheduled' });
    expect(s.currentKeyId).toBe('k2');
    expect(s.state).toBe('key-rotated');
  });

  it('supports compromised reason', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    const step = rotateKey(s, {
      oldKeyId: 'k1',
      newKeyId: 'k2',
      reason: 'compromised',
    });
    expect(step.metadata['reason']).toBe('compromised');
  });

  it('rejects same old/new key', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      rotateKey(s, { oldKeyId: 'k', newKeyId: 'k', reason: 'scheduled' }),
    ).toThrow('must differ');
  });

  it('rejects empty key ids', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      rotateKey(s, { oldKeyId: '', newKeyId: 'k2', reason: 'scheduled' }),
    ).toThrow('must not be empty');
  });
});

describe('signWithHsm', () => {
  it('records ECDSA-P256 signature', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    const step = signWithHsm(s, {
      keyId: 'hsm-key-1',
      digest: 'abc123',
      algorithm: 'ECDSA-P256',
    });
    expect(step.metadata['algorithm']).toBe('ECDSA-P256');
    expect(s.state).toBe('hsm-signed');
  });

  it('supports Ed25519', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    signWithHsm(s, {
      keyId: 'ed-1',
      digest: 'x',
      algorithm: 'Ed25519',
    });
    expect(s.state).toBe('hsm-signed');
  });

  it('rejects empty digest', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      signWithHsm(s, { keyId: 'k', digest: '', algorithm: 'ECDSA-P256' }),
    ).toThrow('digest must not be empty');
  });
});

describe('encapsulatePq', () => {
  it('encapsulates ML-KEM-768', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    const step = encapsulatePq(s, { algo: 'ML-KEM-768', publicKeyLen: 1184 });
    expect(step.metadata['algo']).toBe('ML-KEM-768');
    expect(step.metadata['ciphertextLen']).toBe(1088);
    expect(s.state).toBe('pq-encapsulated');
  });

  it('encapsulates ML-KEM-1024', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    const step = encapsulatePq(s, { algo: 'ML-KEM-1024', publicKeyLen: 1568 });
    expect(step.metadata['ciphertextLen']).toBe(1568);
  });

  it('rejects short public key', () => {
    const s = startCryptoSession({ target: 'vault', sessionId: 's' });
    expect(() =>
      encapsulatePq(s, { algo: 'ML-KEM-768', publicKeyLen: 100 }),
    ).toThrow('>= 800 bytes');
  });
});
