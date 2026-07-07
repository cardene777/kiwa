import { describe, expect, it } from 'vitest';
import * as sec from '../src/index.js';

describe('index surface — @kiwa-test/security', () => {
  it('T-SEC-IDX-001 exposes 8 axis builder / evaluator functions', () => {
    // CSP.
    expect(typeof sec.buildCspHeader).toBe('function');
    // Rate limit.
    expect(typeof sec.TokenBucket).toBe('function');
    expect(typeof sec.LeakyBucket).toBe('function');
    expect(typeof sec.SlidingWindow).toBe('function');
    // Authorization.
    expect(typeof sec.rbacAllows).toBe('function');
    expect(typeof sec.evaluateAbac).toBe('function');
    // WAF.
    expect(typeof sec.evaluateWaf).toBe('function');
    // Threat model.
    expect(typeof sec.scoreStride).toBe('function');
    expect(typeof sec.scoreDread).toBe('function');
    // Secrets.
    expect(typeof sec.scanSecrets).toBe('function');
    // SBOM.
    expect(typeof sec.toCycloneDx).toBe('function');
    expect(typeof sec.lookupAdvisories).toBe('function');
    // Security headers.
    expect(typeof sec.buildSecurityHeaders).toBe('function');
  });

  it('T-SEC-IDX-002 exposes fidelity harness + 32-cell grid constant', () => {
    expect(typeof sec.runSecurityFidelityCheck).toBe('function');
    expect(Array.isArray(sec.SECURITY_FIDELITY_GRID)).toBe(true);
    expect(sec.SECURITY_FIDELITY_GRID.length).toBe(32);
  });

  it('T-SEC-IDX-003 exposes real-driver env-gate helpers', () => {
    expect(typeof sec.isKiwaModeReal).toBe('function');
    expect(typeof sec.resolveRealtimeDriver).toBe('function');
    expect(typeof sec.skipUnlessReal).toBe('function');
    expect(typeof sec.resolveEndpoint).toBe('function');
  });

  it('T-SEC-IDX-004 exposes event constructors for each axis', () => {
    expect(typeof sec.toCspEvent).toBe('function');
    expect(typeof sec.toRateLimitEvent).toBe('function');
    expect(typeof sec.toAuthorizationEvent).toBe('function');
    expect(typeof sec.toWafEvent).toBe('function');
    expect(typeof sec.toThreatModelEvent).toBe('function');
    expect(typeof sec.toSecretsEvent).toBe('function');
    expect(typeof sec.toSbomEvent).toBe('function');
    expect(typeof sec.toSecurityHeadersEvent).toBe('function');
  });
});
