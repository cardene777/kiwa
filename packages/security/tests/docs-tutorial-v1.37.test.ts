/**
 * v1.37-5 docs 補強 (Issue #1092 / CAR-829) — tutorial 76-78 code snippet validation
 * for `@kiwa/security` v0.1 8 axis (CSP + Rate limit + Authorization + WAF +
 * Threat model + Secrets scan + SBOM + Security headers advanced).
 *
 * `docs/tutorials/76-csp-strict-dynamic.md` / `docs/tutorials/77-rbac-abac-policy.md` /
 * `docs/tutorials/78-sbom-license-scanning.md` に載っている snippet が実際に動作する
 * ことを担保する。
 *
 * v1.23 → v1.37 で 15 milestone 連続 snippet validation streak を延伸。
 */
import { describe, expect, it } from 'vitest';
import type {
  AbacPolicy,
  AbacRule,
  AdvisoryFeed,
  RotationTracker,
  SbomComponent,
} from '../src/index.js';
import {
  buildCspHeader,
  createRbacPolicy,
  DEFAULT_LICENSE_POLICY,
  DEFAULT_SIGNATURES,
  evaluateAbac,
  evaluateCombined,
  evaluateLicense,
  expandRoles,
  isRotationOverdue,
  lookupAdvisories,
  markRotated,
  rbacAllows,
  scanSecrets,
  shannonEntropy,
  toAuthorizationEvent,
  toCspEvent,
  toCycloneDx,
  toSpdx,
  validateNonce,
  validateSbom,
  versionInRange,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 76 — CSP (nonce + hash + strict-dynamic + trusted-types + report-only)
// ---------------------------------------------------------------------------

describe('tutorial 76 — buildCspHeader minimal policy', () => {
  it('emits Content-Security-Policy header by default (tutorial: minimal snippet)', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
    });
    expect(out.headerName).toBe('Content-Security-Policy');
    expect(out.headerValue).toContain("default-src 'self'");
  });

  it("emits 'none' for an empty source list (tutorial: empty-list snippet)", () => {
    const out = buildCspHeader({
      directives: { 'object-src': [] },
    });
    expect(out.expandedDirectives['object-src']).toEqual(["'none'"]);
    expect(out.headerValue).toContain("object-src 'none'");
  });

  it('dedupes duplicate sources inside the same directive (tutorial: dedup snippet)', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'", "'self'", 'https://cdn.example.com'] },
    });
    const scriptSrc = out.expandedDirectives['script-src'] ?? [];
    expect(scriptSrc.filter((s) => s === "'self'")).toHaveLength(1);
    expect(scriptSrc).toContain('https://cdn.example.com');
  });
});

describe('tutorial 76 — validateNonce + nonce attachment', () => {
  it('accepts a 22-char base64url nonce (tutorial: accept snippet)', () => {
    const check = validateNonce('AAAAAAAAAAAAAAAAAAAAAA');
    expect(check.ok).toBe(true);
  });

  it('rejects a short nonce (tutorial: too-short snippet)', () => {
    const check = validateNonce('short');
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/too short/);
  });

  it('rejects a non-base64url nonce (tutorial: non-base64url snippet)', () => {
    const check = validateNonce('AAAA/AAAA+AAAAAAAAAAA=');
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/base64url/);
  });

  it('attaches nonce to script-src by default (tutorial: script-src nonce snippet)', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
    });
    expect(out.headerValue).toMatch(
      /script-src [^;]*'nonce-AAAAAAAAAAAAAAAAAAAAAA'/,
    );
  });

  it('attaches nonce to explicit directives when specified (tutorial: style-src override snippet)', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"], 'style-src': ["'self'"] },
      nonces: [
        { nonce: 'BBBBBBBBBBBBBBBBBBBBBB', directives: ['style-src'] },
      ],
    });
    expect(out.headerValue).toMatch(
      /style-src [^;]*'nonce-BBBBBBBBBBBBBBBBBBBBBB'/,
    );
    expect(out.headerValue).not.toMatch(/script-src [^;]*'nonce-BBB/);
  });
});

describe('tutorial 76 — hash sources', () => {
  it('emits sha256 hash source in script-src by default (tutorial: sha256 snippet)', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'YWJjZA==' }],
    });
    expect(out.headerValue).toMatch(/script-src [^;]*'sha256-YWJjZA=='/);
  });

  it('supports sha384 and sha512 alongside sha256 (tutorial: multi-algo snippet)', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [
        { algorithm: 'sha384', digest: 'AAA=' },
        { algorithm: 'sha512', digest: 'BBB=' },
      ],
    });
    expect(out.headerValue).toContain("'sha384-AAA='");
    expect(out.headerValue).toContain("'sha512-BBB='");
  });

  it('routes hashes to explicit directives when specified (tutorial: style-src hash snippet)', () => {
    const out = buildCspHeader({
      directives: {
        'script-src': ["'self'"],
        'style-src': ["'self'"],
      },
      hashes: [
        { algorithm: 'sha256', digest: 'STYLE', directives: ['style-src'] },
      ],
    });
    expect(out.headerValue).toMatch(/style-src [^;]*'sha256-STYLE'/);
    expect(out.headerValue).not.toMatch(/script-src [^;]*'sha256-STYLE'/);
  });
});

describe('tutorial 76 — strict-dynamic', () => {
  it('emits strict-dynamic + nonce in script-src (tutorial: strict-dynamic + nonce snippet)', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
    expect(out.headerValue).toMatch(
      /script-src [^;]*'nonce-AAAAAAAAAAAAAAAAAAAAAA'/,
    );
  });

  it('throws when strict-dynamic is set without a nonce or hash (tutorial: strict-dynamic guard snippet)', () => {
    expect(() =>
      buildCspHeader({
        directives: { 'script-src': ["'self'"] },
        strictDynamic: true,
      }),
    ).toThrow(/strict-dynamic requires at least one nonce or hash/);
  });

  it('accepts strict-dynamic when only a hash is present (tutorial: strict-dynamic + hash snippet)', () => {
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'BASE64' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
    expect(out.headerValue).toContain("'sha256-BASE64'");
  });
});

describe('tutorial 76 — trusted-types', () => {
  it('emits trusted-types directive with named policies (tutorial: trusted-types snippet)', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      trustedTypes: { policies: ['default', 'my-policy'], requireForScript: true },
    });
    expect(out.headerValue).toContain('trusted-types default my-policy');
    expect(out.headerValue).toContain("require-trusted-types-for 'script'");
  });

  it("emits trusted-types 'none' when the policy list is empty (tutorial: trusted-types empty snippet)", () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      trustedTypes: { policies: [], requireForScript: false },
    });
    expect(out.expandedDirectives['trusted-types']).toEqual(["'none'"]);
    expect(out.headerValue).not.toContain('require-trusted-types-for');
  });
});

describe('tutorial 76 — report-only', () => {
  it('flips the header name when reportOnly is true (tutorial: report-only snippet)', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      reportOnly: true,
    });
    expect(out.headerName).toBe('Content-Security-Policy-Report-Only');
  });

  it('emits report-to and report-uri when reportGroup is set (tutorial: reportGroup snippet)', () => {
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      reportGroup: 'csp-endpoint',
    });
    expect(out.headerValue).toContain('report-to csp-endpoint');
    expect(out.headerValue).toContain('report-uri /csp-endpoint');
  });
});

describe('tutorial 76 — toCspEvent adapter', () => {
  it('normalizes a helmet-side deny into the neutral SecurityEvent shape (tutorial: adapter snippet)', () => {
    const event = toCspEvent({
      provider: 'helmet',
      verdict: 'deny',
      reason: 'inline script blocked (no nonce)',
      payload: { directive: 'script-src', blocked: 'inline' },
      timestamp: 100,
    });
    expect(event.axis).toBe('csp');
    expect(event.provider).toBe('helmet');
    expect(event.verdict).toBe('deny');
    expect(event.timestamp).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 77 — Authorization (RBAC + role hierarchy + ABAC + combined)
// ---------------------------------------------------------------------------

describe('tutorial 77 — rbac flat policy', () => {
  it('grants a permission that the subject role holds (tutorial: flat snippet)', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
      { name: 'editor', permissions: ['read:articles', 'write:articles'] },
    ]);
    const subject = { id: 'alice', roles: ['viewer'] };
    expect(rbacAllows(policy, subject, 'read:articles')).toBe(true);
    expect(rbacAllows(policy, subject, 'write:articles')).toBe(false);
  });

  it('denies a permission when the subject has no role (tutorial: empty-role snippet)', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
    ]);
    expect(
      rbacAllows(policy, { id: 'unknown', roles: [] }, 'read:articles'),
    ).toBe(false);
  });

  it('denies a permission when the subject holds an unknown role (tutorial: ghost-role snippet)', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
    ]);
    expect(
      rbacAllows(
        policy,
        { id: 'bob', roles: ['ghost'] },
        'read:articles',
      ),
    ).toBe(false);
  });
});

describe('tutorial 77 — rbac role hierarchy', () => {
  it('expands parent permissions transitively (tutorial: expandRoles snippet)', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
      { name: 'editor', permissions: ['write:articles'], parents: ['viewer'] },
      { name: 'admin', permissions: ['delete:articles'], parents: ['editor'] },
    ]);
    const subject = { id: 'root', roles: ['admin'] };
    const perms = expandRoles(policy, subject);
    expect(perms.has('read:articles')).toBe(true);
    expect(perms.has('write:articles')).toBe(true);
    expect(perms.has('delete:articles')).toBe(true);
  });

  it('rbacAllows honors inherited permissions (tutorial: hierarchy allow snippet)', () => {
    const policy = createRbacPolicy([
      { name: 'viewer', permissions: ['read:articles'] },
      { name: 'editor', permissions: ['write:articles'], parents: ['viewer'] },
    ]);
    expect(
      rbacAllows(
        policy,
        { id: 'e', roles: ['editor'] },
        'read:articles',
      ),
    ).toBe(true);
  });

  it('detects a cycle at policy creation time (tutorial: cycle guard snippet)', () => {
    expect(() =>
      createRbacPolicy([
        { name: 'a', permissions: [], parents: ['b'] },
        { name: 'b', permissions: [], parents: ['a'] },
      ]),
    ).toThrow(/cycle detected/);
  });
});

describe('tutorial 77 — abac first-applicable', () => {
  const policy: AbacPolicy = {
    algorithm: 'first-applicable',
    rules: [
      {
        id: 'r-owner-edit',
        effect: 'permit',
        condition: (attrs) =>
          attrs.action === 'edit' &&
          attrs.subject.id === attrs.resource.ownerId,
      },
      {
        id: 'r-guest-read',
        effect: 'permit',
        condition: (attrs) =>
          attrs.action === 'read' && attrs.subject.role === 'guest',
      },
    ],
  };

  it('permits the owner edit when the subject id matches the resource ownerId (tutorial: owner-edit snippet)', () => {
    const decision = evaluateAbac(policy, {
      subject: { id: 'alice', role: 'member' },
      resource: { ownerId: 'alice' },
      action: 'edit',
      environment: {},
    });
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('r-owner-edit');
  });

  it('defaults to deny when no rule matches (tutorial: default-deny snippet)', () => {
    const decision = evaluateAbac(policy, {
      subject: { id: 'bob', role: 'member' },
      resource: { ownerId: 'alice' },
      action: 'delete',
      environment: {},
    });
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBeNull();
    expect(decision.reason).toMatch(/default deny/);
  });
});

describe('tutorial 77 — abac combining algorithms', () => {
  const rules: AbacRule[] = [
    { id: 'r-permit', effect: 'permit', condition: () => true },
    { id: 'r-deny', effect: 'deny', condition: () => true },
  ];
  const attrs = {
    subject: { id: 'x' },
    resource: {},
    action: 'read',
    environment: {},
  };

  it('deny-overrides — any deny wins (tutorial: deny-overrides snippet)', () => {
    const decision = evaluateAbac({ algorithm: 'deny-overrides', rules }, attrs);
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBe('r-deny');
  });

  it('permit-overrides — any permit wins (tutorial: permit-overrides snippet)', () => {
    const decision = evaluateAbac({ algorithm: 'permit-overrides', rules }, attrs);
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('r-permit');
  });

  it('first-applicable — the first matching rule wins (tutorial: first-applicable snippet)', () => {
    const decision = evaluateAbac({ algorithm: 'first-applicable', rules }, attrs);
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('r-permit');
  });
});

describe('tutorial 77 — combined rbac + abac', () => {
  const rbacPolicy = createRbacPolicy([
    { name: 'editor', permissions: ['write:articles'] },
  ]);

  it('denies when rbac denies (tutorial: rbac-deny short-circuit snippet)', () => {
    const decision = evaluateCombined({
      rbac: {
        policy: rbacPolicy,
        subject: { id: 'guest', roles: [] },
        permission: 'write:articles',
      },
    });
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBe('rbac');
  });

  it('permits when rbac permits and no abac is given (tutorial: rbac-permit-only snippet)', () => {
    const decision = evaluateCombined({
      rbac: {
        policy: rbacPolicy,
        subject: { id: 'alice', roles: ['editor'] },
        permission: 'write:articles',
      },
    });
    expect(decision.effect).toBe('permit');
    expect(decision.matchedRule).toBe('rbac');
  });

  it('lets abac deny narrow a rbac permit (tutorial: abac-narrow snippet)', () => {
    const decision = evaluateCombined({
      rbac: {
        policy: rbacPolicy,
        subject: { id: 'alice', roles: ['editor'] },
        permission: 'write:articles',
      },
      abac: {
        policy: {
          algorithm: 'deny-overrides',
          rules: [
            {
              id: 'r-out-of-hours',
              effect: 'deny',
              condition: (a) => a.environment.hour === 3,
            },
          ],
        },
        attrs: {
          subject: { id: 'alice' },
          resource: { id: 'article-1' },
          action: 'edit',
          environment: { hour: 3 },
        },
      },
    });
    expect(decision.effect).toBe('deny');
    expect(decision.matchedRule).toBe('r-out-of-hours');
  });
});

describe('tutorial 77 — toAuthorizationEvent adapter', () => {
  it('normalizes a permit decision into the neutral SecurityEvent shape (tutorial: adapter permit snippet)', () => {
    const event = toAuthorizationEvent({
      provider: 'casbin',
      subject: 'alice',
      action: 'edit',
      timestamp: 200,
      decision: {
        effect: 'permit',
        matchedRule: 'r-owner-edit',
        reason: 'abac: first-applicable r-owner-edit',
      },
    });
    expect(event.axis).toBe('authorization');
    expect(event.provider).toBe('casbin');
    expect(event.verdict).toBe('allow');
    expect(event.timestamp).toBe(200);
    expect(event.reason).toContain('r-owner-edit');
  });

  it('maps deny effect to deny verdict (tutorial: adapter deny snippet)', () => {
    const event = toAuthorizationEvent({
      provider: 'coraza',
      subject: 'bob',
      action: 'delete',
      timestamp: 300,
      decision: {
        effect: 'deny',
        matchedRule: null,
        reason: 'abac: no rule matched (default deny)',
      },
    });
    expect(event.verdict).toBe('deny');
    expect(event.provider).toBe('coraza');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 78 — SBOM + license + secrets scanning
// ---------------------------------------------------------------------------

const sampleComponents: SbomComponent[] = [
  { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0', license: 'MIT' },
  { name: 'left-pad', version: '1.3.0', purl: 'pkg:npm/left-pad@1.3.0', license: 'MIT' },
];

describe('tutorial 78 — dual-format SBOM', () => {
  it('emits CycloneDX 1.5 with components intact (tutorial: cyclonedx snippet)', () => {
    const doc = toCycloneDx(sampleComponents, '2026-07-07T00:00:00.000Z');
    expect(doc.format).toBe('cyclonedx');
    expect(doc.formatVersion).toBe('1.5');
    expect(doc.components).toHaveLength(2);
    expect(doc.generatedAtIso).toBe('2026-07-07T00:00:00.000Z');
  });

  it('emits SPDX 2.3 with components intact (tutorial: spdx snippet)', () => {
    const doc = toSpdx(sampleComponents, '2026-07-07T00:00:00.000Z');
    expect(doc.format).toBe('spdx');
    expect(doc.formatVersion).toBe('2.3');
    expect(doc.components).toHaveLength(2);
  });
});

describe('tutorial 78 — validateSbom', () => {
  it('accepts a well-formed SBOM (tutorial: validate ok snippet)', () => {
    const doc = toCycloneDx([
      { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0' },
    ]);
    const result = validateSbom(doc);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a component missing name (tutorial: missing-name snippet)', () => {
    const doc = toCycloneDx([
      { name: '', version: '1.0.0', purl: 'pkg:npm/foo@1.0.0' },
    ]);
    const result = validateSbom(doc);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  it('rejects a malformed purl (tutorial: bad-purl snippet)', () => {
    const doc = toCycloneDx([
      { name: 'react', version: '18.2.0', purl: 'npm/react@18.2.0' },
    ]);
    const result = validateSbom(doc);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('purl'))).toBe(true);
  });
});

describe('tutorial 78 — versionInRange', () => {
  it('matches an exact version (tutorial: exact snippet)', () => {
    expect(versionInRange('1.2.3', '= 1.2.3')).toBe(true);
    expect(versionInRange('1.2.4', '= 1.2.3')).toBe(false);
  });

  it('matches a >= range (tutorial: gte snippet)', () => {
    expect(versionInRange('1.5.0', '>= 1.2.3')).toBe(true);
    expect(versionInRange('1.2.2', '>= 1.2.3')).toBe(false);
  });

  it('supports OR-clause ranges (tutorial: or-clause snippet)', () => {
    expect(versionInRange('0.9.0', '< 1.0.0 || >= 2.0.0')).toBe(true);
    expect(versionInRange('2.5.0', '< 1.0.0 || >= 2.0.0')).toBe(true);
    expect(versionInRange('1.5.0', '< 1.0.0 || >= 2.0.0')).toBe(false);
  });
});

describe('tutorial 78 — lookupAdvisories', () => {
  const feed: AdvisoryFeed = {
    advisories: [
      {
        id: 'GHSA-XXXX',
        affects: [{ purl: 'pkg:npm/left-pad', versionRange: '< 2.0.0' }],
        severity: 'high',
        summary: 'left-pad prototype pollution',
        source: 'osv',
      },
    ],
  };

  it('returns matched advisories for vulnerable components (tutorial: match snippet)', () => {
    const doc = toCycloneDx([
      { name: 'left-pad', version: '1.3.0', purl: 'pkg:npm/left-pad@1.3.0' },
      { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0' },
    ]);
    const results = lookupAdvisories(doc, feed);
    expect(results).toHaveLength(1);
    expect(results[0]?.component.name).toBe('left-pad');
    expect(results[0]?.advisories[0]?.id).toBe('GHSA-XXXX');
  });

  it('returns no advisories when no component matches (tutorial: no-match snippet)', () => {
    const doc = toCycloneDx([
      { name: 'react', version: '18.2.0', purl: 'pkg:npm/react@18.2.0' },
    ]);
    const results = lookupAdvisories(doc, feed);
    expect(results).toHaveLength(0);
  });
});

describe('tutorial 78 — evaluateLicense', () => {
  it('allows MIT and Apache-2.0 (tutorial: allow snippet)', () => {
    expect(evaluateLicense('MIT')).toBe('allow');
    expect(evaluateLicense('Apache-2.0')).toBe('allow');
  });

  it('warns on MPL-2.0 and LGPL-3.0 (tutorial: warn snippet)', () => {
    expect(evaluateLicense('MPL-2.0')).toBe('warn');
    expect(evaluateLicense('LGPL-3.0')).toBe('warn');
  });

  it('denies GPL-3.0 and AGPL-3.0 (tutorial: deny snippet)', () => {
    expect(evaluateLicense('GPL-3.0')).toBe('deny');
    expect(evaluateLicense('AGPL-3.0')).toBe('deny');
  });

  it('picks the most permissive alternative in an OR expression (tutorial: OR-clause snippet)', () => {
    expect(evaluateLicense('MIT OR GPL-3.0')).toBe('allow');
    expect(evaluateLicense('MPL-2.0 OR GPL-3.0')).toBe('warn');
  });

  it('warns on an undefined license (tutorial: unknown-license snippet)', () => {
    expect(evaluateLicense(undefined)).toBe('warn');
    expect(evaluateLicense('Custom-Unknown-1.0')).toBe('warn');
  });

  it('honors a custom policy override (tutorial: custom-policy snippet)', () => {
    const custom = {
      allow: [...DEFAULT_LICENSE_POLICY.allow, 'MPL-2.0'],
      warn: DEFAULT_LICENSE_POLICY.warn.filter((l) => l !== 'MPL-2.0'),
      deny: DEFAULT_LICENSE_POLICY.deny,
    };
    expect(evaluateLicense('MPL-2.0', custom)).toBe('allow');
  });
});

describe('tutorial 78 — scanSecrets', () => {
  it('flags an AWS access key by prefix (tutorial: aws-key snippet)', () => {
    const findings = scanSecrets('const key = "AKIAIOSFODNN7EXAMPLE";');
    expect(findings).toHaveLength(1);
    expect(findings[0]?.kind).toBe('aws-access-key');
    expect(findings[0]?.line).toBe(1);
  });

  it('flags a GitHub personal access token (tutorial: github-token snippet)', () => {
    const findings = scanSecrets(
      'const t = "ghp_EXAMPLEexampleEXAMPLEexampleEXAMPLE1";',
    );
    expect(findings.some((f) => f.kind === 'github-token')).toBe(true);
  });

  it('flags a Stripe secret key (tutorial: stripe-key snippet)', () => {
    const findings = scanSecrets(
      'const s = "sk_live_EXAMPLEexampleEXAMPL";',
    );
    expect(findings.some((f) => f.kind === 'stripe-key')).toBe(true);
  });

  it('does not flag a low-entropy 40-char string when the entropy gate is on (tutorial: entropy gate snippet)', () => {
    const lowEntropy = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    expect(shannonEntropy(lowEntropy)).toBeLessThan(3.5);
    const findings = scanSecrets(
      `const s = "${lowEntropy}";`,
      DEFAULT_SIGNATURES.filter((s) => s.kind === 'aws-secret-key'),
    );
    expect(findings).toEqual([]);
  });

  it('reports 1-indexed line and column for each finding (tutorial: coordinates snippet)', () => {
    const src = ['// header', 'const k = "AKIAIOSFODNN7EXAMPLE";'].join('\n');
    const findings = scanSecrets(src);
    expect(findings[0]?.line).toBe(2);
    expect(findings[0]?.column).toBeGreaterThan(1);
  });
});

describe('tutorial 78 — rotation SLA', () => {
  const dayMs = 24 * 60 * 60 * 1000;
  const finding = {
    kind: 'github-token' as const,
    matched: 'ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    line: 10,
    column: 5,
    entropy: 4.2,
    ruleDescription: 'github token',
  };
  const tracker: RotationTracker = {
    finding,
    discoveredAtMs: 1_000_000,
    rotatedAtMs: null,
    policy: { rotateWithinDays: 7 },
  };

  it('returns false while the deadline has not yet passed (tutorial: rotation not-overdue snippet)', () => {
    expect(isRotationOverdue(tracker, 1_000_000 + 6 * dayMs)).toBe(false);
  });

  it('returns true once the deadline has passed (tutorial: rotation overdue snippet)', () => {
    expect(isRotationOverdue(tracker, 1_000_000 + 8 * dayMs)).toBe(true);
  });

  it('returns false once markRotated is applied regardless of the wall clock (tutorial: markRotated snippet)', () => {
    const rotated = markRotated(tracker, 1_000_000 + 5 * dayMs);
    expect(rotated.rotatedAtMs).toBe(1_000_000 + 5 * dayMs);
    expect(isRotationOverdue(rotated, 1_000_000 + 30 * dayMs)).toBe(false);
  });
});
