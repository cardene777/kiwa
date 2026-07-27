import { expect, it } from 'vitest';
import {
  buildCspHeader,
  createRbacPolicy,
  createWafPolicy,
  evaluateWaf,
  rbacAllows,
  suppressFalsePositive,
  TokenBucket,
} from '../src/index.js';

it('validates the Quickstart CSP policy', () => {
  const policy = buildCspHeader({
    directives: { 'default-src': ["'self'"], 'script-src': ["'self'"] },
    nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
    strictDynamic: true,
  });

  expect(policy.headerName).toBe('Content-Security-Policy');
  expect(policy.headerValue).toContain("'nonce-AAAAAAAAAAAAAAAAAAAAAA'");
  expect(policy.headerValue).toContain("'strict-dynamic'");
  expect(policy.expandedDirectives['script-src']).toContain("'self'");
});

it('validates the CSP, RBAC, rate-limit, and WAF how-to flow', () => {
  const csp = buildCspHeader({
    directives: { 'script-src': ["'self'"] },
    nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
    strictDynamic: true,
  });
  expect(csp.headerValue).toContain("'strict-dynamic'");

  const rbac = createRbacPolicy([
    { name: 'writer', permissions: ['write'], parents: ['reader'] },
    { name: 'reader', permissions: ['read'] },
  ]);
  expect(rbacAllows(rbac, { id: 'user-42', roles: ['writer'] }, 'read')).toBe(true);
  expect(rbacAllows(rbac, { id: 'user-42', roles: ['writer'] }, 'delete')).toBe(false);

  const limiter = new TokenBucket({ capacity: 2, refillPerMs: 0.1 }, 0);
  expect(limiter.consume(1, 0)).toMatchObject({ allowed: true, remaining: 1 });
  expect(limiter.consume(1, 0)).toMatchObject({ allowed: true, remaining: 0 });
  expect(limiter.consume(1, 0)).toMatchObject({ allowed: false, remaining: 0 });

  const policy = createWafPolicy();
  expect(evaluateWaf(policy, {
    method: 'POST', path: '/comments', headers: {}, body: 'text=<script>alert(1)</script>',
  })).toMatchObject({ action: 'block', matchedCategory: 'WAF_XSS' });
  const relaxed = suppressFalsePositive(policy, 'CRS-931100', '/import/allowed');
  expect(evaluateWaf(relaxed, {
    method: 'POST', path: '/import/allowed', headers: {}, body: 'src=https://internal.example.com/data',
  })).toMatchObject({ action: 'allow', matchedRuleId: null });
});
