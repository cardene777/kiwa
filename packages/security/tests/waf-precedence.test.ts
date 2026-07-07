import { describe, expect, it } from 'vitest';
import { createWafPolicy, evaluateWaf, addCustomRule, suppressFalsePositive } from '../src/index.js';

describe('WAF — rule precedence + composition', () => {
  it('T-SEC-WAF-P-001 high priority custom block trumps CRS warn', () => {
    const base = createWafPolicy();
    const withCustom = addCustomRule(base, {
      id: 'CUSTOM-URL',
      category: 'CUSTOM',
      pattern: /(https?):\/\//i,
      action: 'block',
      priority: 1000, // Higher than CRS-931100 (RFI warn).
    });
    const d = evaluateWaf(withCustom, {
      method: 'POST',
      path: '/import',
      headers: {},
      body: 'src=https://evil.example.com',
    });
    expect(d.action).toBe('block');
    expect(d.matchedRuleId).toBe('CUSTOM-URL');
  });

  it('T-SEC-WAF-P-002 low priority rule is not reached when high priority matches', () => {
    const base = createWafPolicy();
    const withCustom = addCustomRule(base, {
      id: 'CUSTOM-LOW',
      category: 'CUSTOM',
      pattern: /alert/i,
      action: 'block',
      priority: 1,
    });
    const d = evaluateWaf(withCustom, {
      method: 'POST',
      path: '/x',
      headers: {},
      body: '<script>alert(1)</script>',
    });
    // CRS-941100 (priority 900) matches first.
    expect(d.matchedRuleId).toBe('CRS-941100');
  });

  it('T-SEC-WAF-P-003 exception path skips a rule for downstream traffic', () => {
    const base = createWafPolicy();
    const policy = suppressFalsePositive(base, 'CRS-941100', '/preview');
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/preview/user-content',
      headers: {},
      body: '<script>renderPreview()</script>',
    });
    // /preview matches the suppression prefix — XSS rule is skipped.
    expect(d.matchedRuleId).not.toBe('CRS-941100');
  });

  it('T-SEC-WAF-P-004 exception path is per-rule (not global)', () => {
    const base = createWafPolicy();
    const policy = suppressFalsePositive(base, 'CRS-941100', '/preview');
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/preview/exploit',
      headers: {},
      body: 'UNION SELECT * FROM users',
    });
    // SQLi rule still applies.
    expect(d.matchedRuleId).toBe('CRS-942100');
  });

  it('T-SEC-WAF-P-005 empty rule set allows everything', () => {
    const policy = createWafPolicy([]);
    const d = evaluateWaf(policy, {
      method: 'GET',
      path: '/anything',
      headers: {},
      body: '<script>alert(1)</script>',
    });
    expect(d.action).toBe('allow');
  });

  it('T-SEC-WAF-P-006 evaluates query params in addition to body', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'GET',
      path: '/x',
      headers: {},
      query: { q: '<script>bad()</script>' },
    });
    expect(d.action).toBe('block');
  });
});
