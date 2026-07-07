import { describe, expect, it } from 'vitest';
import { buildSecurityHeaders } from '../src/index.js';

describe('Security headers — full modern composition', () => {
  it('T-SEC-SH-C-001 emits a full modern header bundle', () => {
    const out = buildSecurityHeaders({
      hsts: { maxAgeSec: 31_536_000, includeSubDomains: true, preload: true },
      xFrame: { mode: 'DENY' },
      xContentTypeOptions: true,
      referrerPolicy: 'strict-origin-when-cross-origin',
      permissionsPolicy: {
        camera: 'none',
        microphone: 'none',
        geolocation: 'none',
        payment: 'self',
        fullscreen: '*',
      },
    });
    expect(out.headers['Strict-Transport-Security']).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
    expect(out.headers['X-Frame-Options']).toBe('DENY');
    expect(out.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(out.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(out.headers['Permissions-Policy']).toContain('camera=()');
    expect(out.headers['Permissions-Policy']).toContain('payment=(self)');
    expect(out.headers['Permissions-Policy']).toContain('fullscreen=*');
  });

  it('T-SEC-SH-C-002 emits only requested headers', () => {
    const out = buildSecurityHeaders({
      xFrame: { mode: 'SAMEORIGIN' },
    });
    expect(out.headers['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(Object.keys(out.headers)).toHaveLength(1);
  });

  it('T-SEC-SH-C-003 empty input emits empty headers', () => {
    const out = buildSecurityHeaders({});
    expect(Object.keys(out.headers)).toHaveLength(0);
  });

  it('T-SEC-SH-C-004 minimum HSTS is just max-age', () => {
    const out = buildSecurityHeaders({
      hsts: { maxAgeSec: 0 },
    });
    expect(out.headers['Strict-Transport-Security']).toBe('max-age=0');
  });

  it('T-SEC-SH-C-005 permissions-policy with mixed sources', () => {
    const out = buildSecurityHeaders({
      permissionsPolicy: {
        camera: { origins: ['https://a.example.com'] },
        microphone: 'self',
        geolocation: 'none',
        autoplay: '*',
      },
    });
    const value = out.headers['Permissions-Policy'] ?? '';
    expect(value).toContain('camera=("https://a.example.com")');
    expect(value).toContain('microphone=(self)');
    expect(value).toContain('geolocation=()');
    expect(value).toContain('autoplay=*');
  });
});
