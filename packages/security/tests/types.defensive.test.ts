import { describe, expect, it } from 'vitest';
import { SECURITY_PROVIDERS, isSecurityProvider } from '../src/types.js';

describe('security/types runtime const defensive', () => {
  it('SECURITY_PROVIDERS exports 4-element provider tuple', () => {
    expect(SECURITY_PROVIDERS).toEqual(['helmet', 'express-rate-limit', 'casbin', 'coraza']);
  });

  it('isSecurityProvider returns true for helmet / express-rate-limit / casbin / coraza', () => {
    expect(isSecurityProvider('helmet')).toBe(true);
    expect(isSecurityProvider('express-rate-limit')).toBe(true);
    expect(isSecurityProvider('casbin')).toBe(true);
    expect(isSecurityProvider('coraza')).toBe(true);
  });

  it('isSecurityProvider returns false for unknown value', () => {
    expect(isSecurityProvider('unknown')).toBe(false);
    expect(isSecurityProvider('')).toBe(false);
    expect(isSecurityProvider('nginx')).toBe(false);
  });
});
