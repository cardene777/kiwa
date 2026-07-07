import { describe, expect, it } from 'vitest';
import { buildCspHeader, toCspEvent, validateNonce } from '../src/index.js';

describe('CSP — buildCspHeader (nonce)', () => {
  it('T-SEC-CSP-001 emits Content-Security-Policy header by default', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
    });
    expect(out.headerName).toBe('Content-Security-Policy');
    expect(out.headerValue).toContain("default-src 'self'");
  });

  it('T-SEC-CSP-002 attaches nonce to script-src by default', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
    });
    expect(out.headerValue).toMatch(/script-src [^;]*'nonce-AAAAAAAAAAAAAAAAAAAAAA'/);
  });

  it('T-SEC-CSP-003 attaches nonce to explicit directives when specified', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"], 'style-src': ["'self'"] },
      nonces: [{ nonce: 'BBBBBBBBBBBBBBBBBBBBBB', directives: ['style-src'] }],
    });
    expect(out.headerValue).toMatch(/style-src [^;]*'nonce-BBBBBBBBBBBBBBBBBBBBBB'/);
    expect(out.headerValue).not.toMatch(/script-src [^;]*'nonce-BBB/);
  });

  it('T-SEC-CSP-004 dedupes duplicate sources in the same directive', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'", "'self'", 'https://cdn.example.com'] },
    });
    const scriptSrc = out.expandedDirectives['script-src'] ?? [];
    expect(scriptSrc.filter((s) => s === "'self'")).toHaveLength(1);
    expect(scriptSrc).toContain('https://cdn.example.com');
  });

  it('T-SEC-CSP-005 emits none for an empty source list', () => {
    const out = buildCspHeader({
      directives: { 'object-src': [] },
    });
    expect(out.expandedDirectives['object-src']).toEqual(["'none'"]);
    expect(out.headerValue).toContain("object-src 'none'");
  });
});

describe('CSP — hash', () => {
  it('T-SEC-CSP-006 emits sha256 hash source in script-src', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'YWJjZA==' }],
    });
    expect(out.headerValue).toMatch(/script-src [^;]*'sha256-YWJjZA=='/);
  });

  it('T-SEC-CSP-007 supports sha384 / sha512', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [
        { algorithm: 'sha384', digest: 'ZmFrZQ==' },
        { algorithm: 'sha512', digest: 'ZmFrZTI=' },
      ],
    });
    expect(out.headerValue).toContain("'sha384-ZmFrZQ=='");
    expect(out.headerValue).toContain("'sha512-ZmFrZTI='");
  });

  it('T-SEC-CSP-008 attaches hash to a caller-specified directive', () => {
    const out = buildCspHeader({
      directives: { 'style-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'aGFzaA==', directives: ['style-src'] }],
    });
    expect(out.headerValue).toContain("style-src 'self' 'sha256-aGFzaA=='");
  });
});

describe('CSP — strict-dynamic', () => {
  it('T-SEC-CSP-009 attaches strict-dynamic when a nonce is present', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'CCCCCCCCCCCCCCCCCCCCCC' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
  });

  it('T-SEC-CSP-010 throws when strict-dynamic is set without a nonce or hash', () => {
    expect(() =>
      buildCspHeader({
        directives: { 'script-src': ["'self'"] },
        strictDynamic: true,
      }),
    ).toThrow(/strict-dynamic requires/);
  });

  it('T-SEC-CSP-011 attaches strict-dynamic when only a hash is present', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'ZmFrZQ==' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
  });
});

describe('CSP — trusted-types', () => {
  it('T-SEC-CSP-012 emits trusted-types with the listed policies', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      trustedTypes: { policies: ['default', 'dompurify'] },
    });
    expect(out.headerValue).toContain('trusted-types default dompurify');
  });

  it('T-SEC-CSP-013 emits none when the policy list is empty', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      trustedTypes: { policies: [] },
    });
    expect(out.expandedDirectives['trusted-types']).toEqual(["'none'"]);
  });

  it('T-SEC-CSP-014 emits require-trusted-types-for when requested', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      trustedTypes: { policies: ['default'], requireForScript: true },
    });
    expect(out.headerValue).toContain("require-trusted-types-for 'script'");
  });
});

describe('CSP — report-only', () => {
  it('T-SEC-CSP-015 emits Report-Only header when reportOnly=true', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      reportOnly: true,
    });
    expect(out.headerName).toBe('Content-Security-Policy-Report-Only');
  });

  it('T-SEC-CSP-016 emits both report-uri and report-to when reportGroup is set', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      reportGroup: 'csp-endpoint',
    });
    expect(out.headerValue).toContain('report-to csp-endpoint');
    expect(out.headerValue).toContain('report-uri /csp-endpoint');
  });
});

describe('CSP — validateNonce', () => {
  it('T-SEC-CSP-017 rejects a nonce that is too short', () => {
    const result = validateNonce('short');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('too short');
  });

  it('T-SEC-CSP-018 rejects a nonce that is not base64url', () => {
    const result = validateNonce('!!!!!!!!!!!!!!!!!!!!!!!');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('base64url');
  });

  it('T-SEC-CSP-019 accepts a valid 22-char base64url nonce', () => {
    const result = validateNonce('AbCdEfGhIjKlMnOpQrStUv');
    expect(result.ok).toBe(true);
  });
});

describe('CSP — toCspEvent', () => {
  it('T-SEC-CSP-020 wraps a violation into a SecurityEvent shape', () => {
    const ev = toCspEvent({
      provider: 'helmet',
      verdict: 'deny',
      reason: 'inline-script blocked',
      payload: { directive: 'script-src' },
      timestamp: 1000,
    });
    expect(ev.axis).toBe('csp');
    expect(ev.provider).toBe('helmet');
    expect(ev.verdict).toBe('deny');
    expect(ev.timestamp).toBe(1000);
  });
});
