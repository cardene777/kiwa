import { describe, expect, it } from 'vitest';
import { buildCspHeader, validateNonce } from '../src/index.js';

describe('CSP — full policy composition', () => {
  it('T-SEC-CSP-INT-001 emits a full modern policy', () => {
    const out = buildCspHeader({
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'font-src': ["'self'"],
        'frame-src': ["'none'"],
        'frame-ancestors': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'object-src': ["'none'"],
      },
      nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
      strictDynamic: true,
      trustedTypes: { policies: ['default'], requireForScript: true },
      reportGroup: 'csp-endpoint',
    });
    expect(out.headerName).toBe('Content-Security-Policy');
    expect(out.headerValue).toContain("default-src 'self'");
    expect(out.headerValue).toContain("frame-ancestors 'none'");
    expect(out.headerValue).toContain("'strict-dynamic'");
    expect(out.headerValue).toContain('trusted-types default');
    expect(out.headerValue).toContain('report-to csp-endpoint');
  });

  it('T-SEC-CSP-INT-002 emits a report-only policy for staged deployment', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      reportOnly: true,
      reportGroup: 'staged',
    });
    expect(out.headerName).toBe('Content-Security-Policy-Report-Only');
    expect(out.headerValue).toContain('report-to staged');
  });

  it('T-SEC-CSP-INT-003 multiple nonces do not collide in the same directive', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [
        { nonce: 'AAAAAAAAAAAAAAAAAAAAAA' },
        { nonce: 'BBBBBBBBBBBBBBBBBBBBBB' },
      ],
    });
    expect(out.headerValue).toContain("'nonce-AAAAAAAAAAAAAAAAAAAAAA'");
    expect(out.headerValue).toContain("'nonce-BBBBBBBBBBBBBBBBBBBBBB'");
  });

  it('T-SEC-CSP-INT-004 nonce + hash + strict-dynamic co-exist', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'CCCCCCCCCCCCCCCCCCCCCC' }],
      hashes: [{ algorithm: 'sha256', digest: 'ZmFrZQ==' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'nonce-CCCCCCCCCCCCCCCCCCCCCC'");
    expect(out.headerValue).toContain("'sha256-ZmFrZQ=='");
    expect(out.headerValue).toContain("'strict-dynamic'");
  });

  it('T-SEC-CSP-INT-005 quoted keywords stay unchanged when re-normalized', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'unsafe-inline'"] },
    });
    expect(out.expandedDirectives['script-src']).toContain("'unsafe-inline'");
  });

  it('T-SEC-CSP-INT-006 unquoted magic keywords are auto-quoted', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ['unsafe-eval'] },
    });
    expect(out.expandedDirectives['script-src']).toContain("'unsafe-eval'");
  });

  it('T-SEC-CSP-INT-007 URLs stay unquoted', () => {
    const out = buildCspHeader({
      directives: { 'connect-src': ['https://api.example.com'] },
    });
    expect(out.expandedDirectives['connect-src']).toContain('https://api.example.com');
  });

  it('T-SEC-CSP-INT-008 validateNonce rejects whitespace', () => {
    expect(validateNonce('AbCdE fGhIjKlMnOpQrStUv').ok).toBe(false);
  });
});
