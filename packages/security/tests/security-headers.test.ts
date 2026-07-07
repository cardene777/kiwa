import { describe, expect, it } from 'vitest';
import {
  buildSecurityHeaders,
  toSecurityHeadersEvent,
  validateSecurityHeaders,
} from '../src/index.js';

describe('Security headers — HSTS', () => {
  it('T-SEC-SH-001 emits max-age directive', () => {
    const out = buildSecurityHeaders({
      hsts: { maxAgeSec: 60 },
    });
    expect(out.headers['Strict-Transport-Security']).toBe('max-age=60');
  });

  it('T-SEC-SH-002 emits includeSubDomains when set', () => {
    const out = buildSecurityHeaders({
      hsts: { maxAgeSec: 31_536_000, includeSubDomains: true },
    });
    expect(out.headers['Strict-Transport-Security']).toContain('includeSubDomains');
  });

  it('T-SEC-SH-003 emits preload when the Chrome policy prereqs are met', () => {
    const out = buildSecurityHeaders({
      hsts: { maxAgeSec: 31_536_000, includeSubDomains: true, preload: true },
    });
    expect(out.headers['Strict-Transport-Security']).toContain('preload');
  });

  it('T-SEC-SH-004 throws when preload lacks includeSubDomains', () => {
    expect(() =>
      buildSecurityHeaders({
        hsts: { maxAgeSec: 31_536_000, preload: true },
      }),
    ).toThrow(/preload/);
  });

  it('T-SEC-SH-005 throws when preload has too-short max-age', () => {
    expect(() =>
      buildSecurityHeaders({
        hsts: { maxAgeSec: 60, includeSubDomains: true, preload: true },
      }),
    ).toThrow(/31536000/);
  });

  it('T-SEC-SH-006 throws when max-age is negative', () => {
    expect(() =>
      buildSecurityHeaders({
        hsts: { maxAgeSec: -1 },
      }),
    ).toThrow(/maxAgeSec/);
  });
});

describe('Security headers — X-Frame-Options', () => {
  it('T-SEC-SH-007 emits DENY', () => {
    const out = buildSecurityHeaders({ xFrame: { mode: 'DENY' } });
    expect(out.headers['X-Frame-Options']).toBe('DENY');
  });

  it('T-SEC-SH-008 emits SAMEORIGIN', () => {
    const out = buildSecurityHeaders({ xFrame: { mode: 'SAMEORIGIN' } });
    expect(out.headers['X-Frame-Options']).toBe('SAMEORIGIN');
  });

  it('T-SEC-SH-009 emits ALLOW-FROM with a URI', () => {
    const out = buildSecurityHeaders({
      xFrame: { mode: 'ALLOW-FROM', uri: 'https://trusted.example.com' },
    });
    expect(out.headers['X-Frame-Options']).toBe('ALLOW-FROM https://trusted.example.com');
  });
});

describe('Security headers — X-Content-Type-Options', () => {
  it('T-SEC-SH-010 emits nosniff when enabled', () => {
    const out = buildSecurityHeaders({ xContentTypeOptions: true });
    expect(out.headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('T-SEC-SH-011 omits header when disabled', () => {
    const out = buildSecurityHeaders({ xContentTypeOptions: false });
    expect(out.headers['X-Content-Type-Options']).toBeUndefined();
  });
});

describe('Security headers — Referrer-Policy', () => {
  it('T-SEC-SH-012 emits strict-origin-when-cross-origin', () => {
    const out = buildSecurityHeaders({
      referrerPolicy: 'strict-origin-when-cross-origin',
    });
    expect(out.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('T-SEC-SH-013 emits no-referrer', () => {
    const out = buildSecurityHeaders({ referrerPolicy: 'no-referrer' });
    expect(out.headers['Referrer-Policy']).toBe('no-referrer');
  });

  it('T-SEC-SH-014 validateSecurityHeaders flags an unknown referrer value', () => {
    const v = validateSecurityHeaders({
      referrerPolicy: 'not-a-real-policy' as never,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.join('\n')).toContain('referrer-policy');
  });
});

describe('Security headers — Permissions-Policy', () => {
  it('T-SEC-SH-015 emits a disabled camera + geolocation', () => {
    const out = buildSecurityHeaders({
      permissionsPolicy: {
        camera: 'none',
        geolocation: 'none',
      },
    });
    expect(out.headers['Permissions-Policy']).toBe('camera=(), geolocation=()');
  });

  it('T-SEC-SH-016 emits self for a feature', () => {
    const out = buildSecurityHeaders({
      permissionsPolicy: { microphone: 'self' },
    });
    expect(out.headers['Permissions-Policy']).toBe('microphone=(self)');
  });

  it('T-SEC-SH-017 emits an origin allowlist', () => {
    const out = buildSecurityHeaders({
      permissionsPolicy: {
        camera: { origins: ['https://a.example.com', 'https://b.example.com'] },
      },
    });
    expect(out.headers['Permissions-Policy']).toBe(
      'camera=("https://a.example.com" "https://b.example.com")',
    );
  });

  it('T-SEC-SH-018 emits star for a wildcard-allowed feature', () => {
    const out = buildSecurityHeaders({
      permissionsPolicy: { fullscreen: '*' },
    });
    expect(out.headers['Permissions-Policy']).toBe('fullscreen=*');
  });
});

describe('Security headers — validate', () => {
  it('T-SEC-SH-019 flags preload without includeSubDomains', () => {
    const v = validateSecurityHeaders({
      hsts: { maxAgeSec: 31_536_000, preload: true },
    });
    expect(v.ok).toBe(false);
  });

  it('T-SEC-SH-020 accepts a clean config', () => {
    const v = validateSecurityHeaders({
      hsts: { maxAgeSec: 60 },
      xFrame: { mode: 'DENY' },
      xContentTypeOptions: true,
      referrerPolicy: 'no-referrer',
    });
    expect(v.ok).toBe(true);
  });
});

describe('Security headers — toSecurityHeadersEvent', () => {
  it('T-SEC-SH-021 emits an allow event on healthy config', () => {
    const ev = toSecurityHeadersEvent({
      provider: 'helmet',
      verdict: 'allow',
      reason: 'ok',
      payload: {},
      timestamp: 1,
    });
    expect(ev.axis).toBe('security-headers');
    expect(ev.verdict).toBe('allow');
  });
});
