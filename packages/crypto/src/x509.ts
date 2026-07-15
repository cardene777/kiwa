import { X509Certificate } from 'node:crypto';

export interface X509CertInfo {
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber: string;
  fingerprint: string;
  fingerprint256: string;
  keyUsage?: readonly string[];
  isValidNow: boolean;
}

export function parseX509(pem: string): X509CertInfo {
  const cert = new X509Certificate(pem);
  const now = Date.parse(new Date().toISOString());
  const fromMs = Date.parse(cert.validFrom);
  const toMs = Date.parse(cert.validTo);
  const isValidNow = fromMs <= now && now <= toMs;
  const result: X509CertInfo = {
    subject: cert.subject,
    issuer: cert.issuer,
    validFrom: cert.validFrom,
    validTo: cert.validTo,
    serialNumber: cert.serialNumber,
    fingerprint: cert.fingerprint,
    fingerprint256: cert.fingerprint256,
    isValidNow,
  };
  const keyUsage = cert.keyUsage;
  if (keyUsage !== undefined) result.keyUsage = keyUsage;
  return result;
}
