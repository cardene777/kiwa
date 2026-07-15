import { sign as nodeSign, verify as nodeVerify, createPrivateKey, createPublicKey, KeyObject } from 'node:crypto';

export interface Ed25519SignResult {
  signature: string;
  algorithm: 'ed25519';
}

/**
 * Ed25519 で data に署名。 PEM 形式の privateKey (generateKeyPair('ed25519') の出力) を受取り、
 * base64 signature を返す。 real Ed25519 実装は node:crypto 経路。
 */
export function ed25519Sign(data: string, privateKeyPem: string): Ed25519SignResult {
  const key = createPrivateKey({ key: privateKeyPem, format: 'pem' });
  const sig = nodeSign(null, Buffer.from(data, 'utf-8'), key);
  return { signature: sig.toString('base64'), algorithm: 'ed25519' };
}

export interface Ed25519VerifyResult {
  valid: boolean;
  algorithm: 'ed25519';
}

export function ed25519Verify(data: string, signatureBase64: string, publicKeyPem: string): Ed25519VerifyResult {
  const key = createPublicKey({ key: publicKeyPem, format: 'pem' });
  const valid = nodeVerify(null, Buffer.from(data, 'utf-8'), key, Buffer.from(signatureBase64, 'base64'));
  return { valid, algorithm: 'ed25519' };
}

export interface EcdhResult {
  sharedSecretHex: string;
  algorithm: 'x25519';
}

/**
 * X25519 ECDH で共有秘密を導出。 real Signal Protocol / DTLS 相当の一時鍵交換を mock。
 */
export function x25519Ecdh(privateKeyPem: string, remotePublicKeyPem: string): EcdhResult {
  const priv = createPrivateKey({ key: privateKeyPem, format: 'pem' });
  const pub = createPublicKey({ key: remotePublicKeyPem, format: 'pem' });
  const { diffieHellman } = require('node:crypto') as { diffieHellman: (opts: { privateKey: KeyObject; publicKey: KeyObject }) => Buffer };
  const shared = diffieHellman({ privateKey: priv, publicKey: pub });
  return { sharedSecretHex: shared.toString('hex'), algorithm: 'x25519' };
}
