import { describe, expect, it } from 'vitest';
import {
  buildCspHeader,
  buildSecurityHeaders,
  createWafPolicy,
  detectBoundaryCrossings,
  evaluateWaf,
  resolveEndpoint,
  resolveRealtimeDriver,
  toRateLimitEvent,
  validateSecurityHeaders,
  versionInRange,
} from '../src/index.js';
import type { DataFlow, TrustZone } from '../src/index.js';
import { sealEvents } from '../src/semantics/index.js';
import type {
  SiemAuditSession,
  StructuredEvent,
} from '../src/semantics/index.js';

/**
 * Close reachable defensive-branch gaps left after the semantics guard sweep.
 *
 * Grouped by pattern per the audit playbook:
 *   1. state preservation  — force state=X with backing data missing
 *   2. argument validation — reachable input-shape edge cases
 *   3. fallback guard      — `?? default` fallbacks tied to public API options
 *
 * Unreachable defensive `?? fallback` branches (see `## defensive documented`
 * in the PR description) are intentionally left uncovered — closing them
 * would require monkey-patching Array.prototype or similar contortions that
 * add no verification value.
 */

// =============================================================================
// waf — priority fallback (`?? 100`) when rule omits priority
// =============================================================================

describe('WAF — createWafPolicy priority fallback', () => {
  it('T-SEC-WAF-DEF-001 sorts rules with omitted priority using default 100', () => {
    // Two rules without an explicit priority — both fall back to 100 via
    // the `?? 100` guard, exercising both sides of the `??` in sort().
    const policy = createWafPolicy([
      {
        id: 'CUSTOM-NO-PRIORITY-A',
        category: 'CUSTOM',
        pattern: /pattern-a/i,
        action: 'block',
      },
      {
        id: 'CUSTOM-NO-PRIORITY-B',
        category: 'CUSTOM',
        pattern: /pattern-b/i,
        action: 'block',
      },
    ]);
    expect(policy.rules).toHaveLength(2);
    // Both rules keep their relative order after a stable equal-priority sort.
    expect(policy.rules.map((r) => r.id)).toEqual([
      'CUSTOM-NO-PRIORITY-A',
      'CUSTOM-NO-PRIORITY-B',
    ]);

    // Mixed — one with priority, one without. Explicit high priority wins.
    const mixed = createWafPolicy([
      {
        id: 'NO-PRI',
        category: 'CUSTOM',
        pattern: /noop/,
        action: 'warn',
      },
      {
        id: 'HIGH-PRI',
        category: 'CUSTOM',
        pattern: /hit/,
        action: 'block',
        priority: 999,
      },
    ]);
    expect(mixed.rules[0]?.id).toBe('HIGH-PRI');

    // And the sorted policy still evaluates correctly for a matching request.
    const d = evaluateWaf(policy, {
      method: 'GET',
      path: '/pattern-a-endpoint',
      headers: {},
    });
    expect(d.matchedRuleId).toBe('CUSTOM-NO-PRIORITY-A');
  });
});

// =============================================================================
// csp — strictDynamic + hashes-only exercises `input.nonces?.length ?? 0`
// =============================================================================

describe('CSP — strictDynamic with hashes only', () => {
  it('T-SEC-CSP-DEF-001 accepts strict-dynamic when nonces is undefined but hashes exists', () => {
    // input.nonces is undefined so `input.nonces?.length` returns undefined
    // and `?? 0` triggers — the fallback branch that "no explicit nonces
    // array supplied" was previously uncovered. The `merged['script-src'] ?? []`
    // fallback on the strict-dynamic append line is covered separately by
    // T-SEC-CSP-DEF-006 (routing hashes to style-src instead of script-src).
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      hashes: [{ algorithm: 'sha256', digest: 'YWJjZA==' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
    expect(out.headerValue).toContain("'sha256-YWJjZA=='");
  });

  it('T-SEC-CSP-DEF-002 accepts strict-dynamic when hashes is undefined but nonces exists', () => {
    // Mirror case — `input.hashes?.length ?? 0` fallback.
    const out = buildCspHeader({
      directives: { 'script-src': ["'self'"] },
      nonces: [{ nonce: 'AAAAAAAAAAAAAAAAAAAAAA' }],
      strictDynamic: true,
    });
    expect(out.headerValue).toContain("'strict-dynamic'");
    expect(out.headerValue).toContain("'nonce-AAAAAAAAAAAAAAAAAAAAAA'");
  });

  it('T-SEC-CSP-DEF-003 normalizeSource returns empty string unchanged (whitespace input)', () => {
    // A source of only whitespace trims to length 0 — exercises the early
    // `if (trimmed.length === 0) return trimmed;` short-circuit inside
    // normalizeSource, reachable only through the buildCspHeader entry point.
    const out = buildCspHeader({
      directives: { 'default-src': ['   ', "'self'"] },
    });
    // The empty source is preserved as-is (empty string), then Set dedups
    // it alongside 'self'. The output must still contain 'self'.
    expect(out.expandedDirectives['default-src']).toContain("'self'");
    // Empty string appears in the merged set as a distinct source.
    expect(out.expandedDirectives['default-src']).toContain('');
  });

  it('T-SEC-CSP-DEF-004 attaches nonce to script-src when input directives omit it', () => {
    // input.directives lacks 'script-src', but the nonce falls back to the
    // default target ['script-src']. That means `merged['script-src']` is
    // undefined when the `merged[dir] ?? []` guard runs — the previously
    // uncovered side of the nullish coalesce inside the nonces loop.
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      nonces: [{ nonce: 'CCCCCCCCCCCCCCCCCCCCCC' }],
    });
    expect(out.expandedDirectives['script-src']).toEqual([
      "'nonce-CCCCCCCCCCCCCCCCCCCCCC'",
    ]);
  });

  it('T-SEC-CSP-DEF-005 attaches hash to script-src when input directives omit it', () => {
    // Mirror of DEF-004 for the hashes loop — same `merged[dir] ?? []`
    // fallback lives in the hashes branch too.
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"] },
      hashes: [{ algorithm: 'sha384', digest: 'ZGVmZ2g=' }],
    });
    expect(out.expandedDirectives['script-src']).toEqual([
      "'sha384-ZGVmZ2g='",
    ]);
  });

  it('T-SEC-CSP-DEF-006 strict-dynamic seeds script-src when nonce/hash targeted a different directive', () => {
    // When nonces / hashes are routed to a non-script directive via the
    // explicit `directives` field, merged['script-src'] is still undefined
    // when the strict-dynamic append runs — exercising the
    // `merged['script-src'] ?? []` fallback on that specific append line.
    const out = buildCspHeader({
      directives: { 'default-src': ["'self'"], 'style-src': ["'self'"] },
      hashes: [
        { algorithm: 'sha512', digest: 'ZmluYWw=', directives: ['style-src'] },
      ],
      strictDynamic: true,
    });
    expect(out.expandedDirectives['script-src']).toEqual([
      "'strict-dynamic'",
    ]);
    expect(out.expandedDirectives['style-src']).toContain(
      "'sha512-ZmluYWw='",
    );
  });
});

// =============================================================================
// security-headers — validateSecurityHeaders preload + short maxAgeSec
// =============================================================================

describe('security-headers — validateSecurityHeaders maxAgeSec guard', () => {
  it('T-SEC-SH-DEF-001 flags preload with too-short maxAgeSec even when includeSubDomains is set', () => {
    const v = validateSecurityHeaders({
      hsts: {
        maxAgeSec: 60,
        includeSubDomains: true,
        preload: true,
      },
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /31536000/.test(e))).toBe(true);
  });
});

describe('security-headers — buildPermissionsPolicy skips undefined sources', () => {
  it('T-SEC-SH-DEF-002 drops features whose source is explicitly undefined', () => {
    // `Partial<Record<PermissionsFeature, PermissionsSource>>` allows an
    // explicit undefined entry (e.g., produced by feature-flag merging).
    // The builder's `if (source === undefined) continue` guard skips such
    // entries so they never land in the header string. exactOptionalPropertyTypes
    // rejects the inline literal, so we compose the map dynamically.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const policy: any = { camera: 'none', geolocation: 'self' };
    policy.microphone = undefined; // explicit undefined entry to exercise the guard
    const out = buildSecurityHeaders({ permissionsPolicy: policy });
    expect(out.headers['Permissions-Policy']).toBe(
      'camera=(), geolocation=(self)',
    );
    expect(out.headers['Permissions-Policy']).not.toContain('microphone');
  });
});

// =============================================================================
// threat-model — detectBoundaryCrossings unknown zoneId fallback
// =============================================================================

describe('threat-model — detectBoundaryCrossings zoneOf fallback', () => {
  it('T-SEC-TM-DEF-001 skips flow whose membership points to a zoneId that does not exist', () => {
    // membership references "ghost" — no such TrustZone in zones. The
    // `zones.find(...) ?? null` fallback returns null so the flow is skipped
    // (fromZone !== null gate short-circuits before missingMitigations).
    const zones: TrustZone[] = [
      { id: 'public', label: 'public', level: 0 },
      { id: 'private', label: 'private', level: 2 },
    ];
    const flows: DataFlow[] = [
      {
        id: 'f1',
        from: 'client',
        to: 'server',
        data: 'creds',
        mitigations: [],
      },
    ];
    const membership = new Map([
      ['client', 'ghost'], // Unknown zone id → find returns undefined → ?? null.
      ['server', 'private'],
    ]);
    const crossings = detectBoundaryCrossings(zones, flows, membership);
    expect(crossings).toEqual([]);
  });

  it('T-SEC-TM-DEF-002 also skips when membership is entirely missing for a node', () => {
    // `membership.get(nodeId)` returns undefined so the earlier `if (!zoneId)
    // return null` short-circuits before find. Ensures both null-producing
    // paths in zoneOf are exercised.
    const zones: TrustZone[] = [
      { id: 'public', label: 'public', level: 0 },
    ];
    const flows: DataFlow[] = [
      {
        id: 'f2',
        from: 'nowhere',
        to: 'client',
        data: 'x',
        mitigations: [],
      },
    ];
    const membership = new Map<string, string>([['client', 'public']]);
    const crossings = detectBoundaryCrossings(zones, flows, membership);
    expect(crossings).toEqual([]);
  });
});

// =============================================================================
// sbom — versionInRange with mixed-length semver parts
// =============================================================================

describe('sbom — versionInRange mixed-length semver comparison', () => {
  it('T-SEC-SBOM-DEF-001 compares 1.2 vs 1.2.3 by padding missing parts to 0', () => {
    // `1.2` has 2 parts vs `1.2.3` has 3 — the compareSemver loop iterates
    // to Math.max(2, 3) = 3, then aParts[2] is undefined and hits `?? 0`.
    // The result is 1.2.0 < 1.2.3 so the >= clause should fail.
    expect(versionInRange('1.2', '>= 1.2.3')).toBe(false);
    expect(versionInRange('1.2', '< 1.2.3')).toBe(true);
    // Reverse — target has fewer parts.
    expect(versionInRange('1.2.3', '>= 1.2')).toBe(true);
    expect(versionInRange('1.2.3', '<= 1.2')).toBe(false);
    // Exact equality after padding — 1.2.0 vs 1.2.
    expect(versionInRange('1.2.0', '= 1.2')).toBe(true);
  });

  it('T-SEC-SBOM-DEF-002 falls back to literal equality for non-operator clauses', () => {
    // No comparison op — the `if (!match)` branch of matchClause returns
    // clause === version literally.
    expect(versionInRange('latest', 'latest')).toBe(true);
    expect(versionInRange('1.2.3', 'not-a-range')).toBe(false);
  });
});

// =============================================================================
// rate-limit — toRateLimitEvent emits 'allow' verdict for allowed decisions
// =============================================================================

describe('rate-limit — toRateLimitEvent allow-path verdict', () => {
  it('T-SEC-RL-DEF-001 emits allow verdict for an allowed decision', () => {
    // Only the deny path was covered before; the ternary in toRateLimitEvent
    // needs both sides exercised.
    const ev = toRateLimitEvent({
      provider: 'coraza',
      decision: {
        allowed: true,
        remaining: 5,
        resetAtMs: 42_000,
        reason: 'within budget',
      },
      clientId: 'ip:10.0.0.1',
      strategy: 'sliding-window',
      timestamp: 12_345,
    });
    expect(ev.verdict).toBe('allow');
    expect(ev.reason).toContain('sliding-window');
    expect(ev.reason).toContain('within budget');
  });
});

// =============================================================================
// real-driver — resolveRealtimeDriver env fallback + null endpoint fallbacks
// =============================================================================

describe('real-driver — resolveRealtimeDriver env default fallback', () => {
  it('T-SEC-RD-DEF-001 falls back to process.env when input.env is omitted', () => {
    const saved = process.env['KIWA_MODE'];
    delete process.env['KIWA_MODE'];
    try {
      // No `env` field — `?? process.env` fallback triggers. KIWA_MODE unset
      // so the driver stays mock.
      const r = resolveRealtimeDriver({ provider: 'helmet' });
      expect(r.useRealDriver).toBe(false);
      expect(r.reason).toContain('KIWA_MODE');
    } finally {
      if (saved !== undefined) {
        process.env['KIWA_MODE'] = saved;
      }
    }
  });
});

describe('real-driver — resolveEndpoint null-endpoint fallbacks', () => {
  it('T-SEC-RD-DEF-002 returns null endpoint + null apiKey for express-rate-limit with empty env', () => {
    // `env.KIWA_REDIS_URL ?? null` and `env.KIWA_REDIS_PASSWORD ?? null`.
    const r = resolveEndpoint('express-rate-limit', {});
    expect(r.endpoint).toBeNull();
    expect(r.apiKey).toBeNull();
  });

  it('T-SEC-RD-DEF-003 returns null endpoint for casbin with empty env', () => {
    // `env.KIWA_CASBIN_POLICY_PATH ?? null`. apiKey is a hardcoded literal
    // null in real-driver.ts (no fallback branch) — asserted for shape only.
    const r = resolveEndpoint('casbin', {});
    expect(r.endpoint).toBeNull();
    expect(r.apiKey).toBeNull();
  });

  it('T-SEC-RD-DEF-004 returns null endpoint for coraza with empty env', () => {
    // `env.KIWA_CORAZA_RULES_PATH ?? null`. apiKey is a hardcoded literal
    // null in real-driver.ts (no fallback branch) — asserted for shape only.
    const r = resolveEndpoint('coraza', {});
    expect(r.endpoint).toBeNull();
    expect(r.apiKey).toBeNull();
  });
});

// =============================================================================
// semantics/siem-audit — sealEvents on structured state with 0 events
// =============================================================================

describe('semantics/siem-audit — sealEvents empty-batch guard', () => {
  it('T-SEC-SIEM-DEF-001 throws when session is structured but structuredEvents is empty', () => {
    // The public API always pushes an event before flipping state to
    // 'structured', so the only way to reach this branch is by fabricating
    // the session object directly. That is fair game because SiemAuditSession
    // is an exported interface — external callers can (and in real
    // deployments will) reconstruct sessions from persisted state, and the
    // seal guard exists precisely to protect against a corrupted snapshot.
    const session: SiemAuditSession = {
      target: 'siem-splunk',
      sessionId: 's',
      state: 'structured',
      history: [],
      structuredEvents: [] as StructuredEvent[],
      sealHashChain: [],
    };
    expect(() => sealEvents(session, { previousHash: 'root' })).toThrow(
      '0 structured events',
    );
  });
});
