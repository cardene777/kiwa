import { describe, expect, it } from 'vitest';
import {
  addCustomRule,
  createWafPolicy,
  evaluateWaf,
  OWASP_CRS_DEFAULT,
  suppressFalsePositive,
  toWafEvent,
} from '../src/index.js';

describe('WAF — createWafPolicy + OWASP CRS defaults', () => {
  it('T-SEC-WAF-001 createWafPolicy defaults to OWASP CRS rules', () => {
    const policy = createWafPolicy();
    const ids = policy.rules.map((r) => r.id);
    expect(ids).toContain('CRS-941100');
    expect(ids).toContain('CRS-942100');
  });

  it('T-SEC-WAF-002 rules sort by priority (highest first)', () => {
    const policy = createWafPolicy();
    for (let i = 0; i < policy.rules.length - 1; i += 1) {
      const a = policy.rules[i]?.priority ?? 100;
      const b = policy.rules[i + 1]?.priority ?? 100;
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it('T-SEC-WAF-003 exposes at least 4 default rules', () => {
    expect(OWASP_CRS_DEFAULT.length).toBeGreaterThanOrEqual(4);
  });
});

describe('WAF — evaluateWaf (XSS)', () => {
  it('T-SEC-WAF-004 blocks a request with an inline script tag', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/comments',
      headers: {},
      body: 'text=<script>alert(1)</script>',
    });
    expect(d.action).toBe('block');
    expect(d.matchedRuleId).toBe('CRS-941100');
    expect(d.matchedCategory).toBe('WAF_XSS');
  });

  it('T-SEC-WAF-005 blocks a javascript: URI in the body', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/comments',
      headers: {},
      body: 'link=javascript:alert(1)',
    });
    expect(d.action).toBe('block');
    expect(d.matchedCategory).toBe('WAF_XSS');
  });

  it('T-SEC-WAF-006 allows a safe request', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'GET',
      path: '/health',
      headers: {},
    });
    expect(d.action).toBe('allow');
    expect(d.matchedRuleId).toBeNull();
  });
});

describe('WAF — evaluateWaf (SQL injection)', () => {
  it('T-SEC-WAF-007 blocks a UNION SELECT payload', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'GET',
      path: '/search',
      headers: {},
      query: { q: 'foo UNION SELECT * FROM users' },
    });
    expect(d.action).toBe('block');
    expect(d.matchedCategory).toBe('WAF_SQLI');
  });

  it('T-SEC-WAF-008 blocks an OR-tautology payload', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'GET',
      path: '/login',
      headers: {},
      body: "user=' or 1=1--",
    });
    expect(d.action).toBe('block');
    expect(d.matchedCategory).toBe('WAF_SQLI');
  });

  it('T-SEC-WAF-009 blocks a DROP TABLE payload', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/api',
      headers: {},
      body: 'name=bob;DROP TABLE users',
    });
    expect(d.action).toBe('block');
  });
});

describe('WAF — evaluateWaf (LFI / RFI)', () => {
  it('T-SEC-WAF-010 blocks a directory traversal payload', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'GET',
      path: '/file?name=../../etc/passwd',
      headers: {},
    });
    expect(d.action).toBe('block');
    expect(d.matchedCategory).toBe('WAF_LFI');
  });

  it('T-SEC-WAF-011 warns on a remote URI payload', () => {
    const policy = createWafPolicy();
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/import',
      headers: {},
      body: 'src=https://evil.example.com/exploit',
    });
    expect(d.action).toBe('warn');
    expect(d.matchedCategory).toBe('WAF_RFI');
  });
});

describe('WAF — custom rules', () => {
  it('T-SEC-WAF-012 addCustomRule inserts a rule at the right priority', () => {
    const base = createWafPolicy();
    const policy = addCustomRule(base, {
      id: 'CUSTOM-1',
      category: 'CUSTOM',
      pattern: /badword/i,
      action: 'block',
      priority: 999,
    });
    expect(policy.rules[0]?.id).toBe('CUSTOM-1');
  });

  it('T-SEC-WAF-013 custom rules match', () => {
    const base = createWafPolicy();
    const policy = addCustomRule(base, {
      id: 'CUSTOM-2',
      category: 'CUSTOM',
      pattern: /forbidden-string/,
      action: 'block',
      priority: 999,
    });
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/x',
      headers: {},
      body: 'has forbidden-string',
    });
    expect(d.action).toBe('block');
    expect(d.matchedRuleId).toBe('CUSTOM-2');
  });
});

describe('WAF — suppressFalsePositive', () => {
  it('T-SEC-WAF-014 suppresses a specific rule on an allowlisted path', () => {
    const base = createWafPolicy();
    const policy = suppressFalsePositive(base, 'CRS-931100', '/import/allowed');
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/import/allowed',
      headers: {},
      body: 'src=https://internal.example.com/data',
    });
    expect(d.action).toBe('allow');
  });

  it('T-SEC-WAF-015 does not affect other paths', () => {
    const base = createWafPolicy();
    const policy = suppressFalsePositive(base, 'CRS-931100', '/import/allowed');
    const d = evaluateWaf(policy, {
      method: 'POST',
      path: '/other',
      headers: {},
      body: 'src=https://internal.example.com/data',
    });
    expect(d.action).toBe('warn');
  });
});

describe('WAF — toWafEvent', () => {
  it('T-SEC-WAF-016 emits a deny event for a block action', () => {
    const ev = toWafEvent({
      provider: 'coraza',
      decision: {
        action: 'block',
        matchedRuleId: 'CRS-941100',
        matchedCategory: 'WAF_XSS',
        reason: 'xss',
      },
      request: { method: 'GET', path: '/x', headers: {} },
      timestamp: 1,
    });
    expect(ev.axis).toBe('waf');
    expect(ev.verdict).toBe('deny');
  });

  it('T-SEC-WAF-017 emits a warn event for a warn action', () => {
    const ev = toWafEvent({
      provider: 'coraza',
      decision: { action: 'warn', matchedRuleId: 'R', matchedCategory: 'C', reason: 'w' },
      request: { method: 'GET', path: '/x', headers: {} },
      timestamp: 2,
    });
    expect(ev.verdict).toBe('warn');
  });

  it('T-SEC-WAF-018 emits an allow event for an allow action', () => {
    const ev = toWafEvent({
      provider: 'coraza',
      decision: { action: 'allow', matchedRuleId: null, matchedCategory: null, reason: 'ok' },
      request: { method: 'GET', path: '/x', headers: {} },
      timestamp: 3,
    });
    expect(ev.verdict).toBe('allow');
  });
});
