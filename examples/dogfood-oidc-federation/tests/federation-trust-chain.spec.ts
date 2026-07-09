/**
 * Sub-Issue v1.21-4d (federation-trust-chain) fidelity harness.
 *
 * Layers OpenID Federation 1.0 §7 chain-walk axes on top of the Sub-Issue
 * v1.21-4a/b/c stack. The wrapper in `src/lib/federation.ts` sits between the
 * dogfood app's Relying Party bootstrap path + the underlying
 * `@kiwa-lab/auth` `resolveTrustChain`. The harness exercises the four
 * Federation §7.2 chain-walk axes —
 *
 *   13. 3-step chain — leaf → intermediate → anchor resolves to a full ordered
 *       chain + the resolved anchor equals the expected trust anchor;
 *   14. broken link — an intermediate whose `sub` does not match the previous
 *       step's `iss` refuses; axis === `broken_link`;
 *   15. expired intermediate — an intermediate whose `exp <= now` refuses;
 *       axis === `expired_intermediate`;
 *   16. cycle detection — an intermediate set containing a cycle refuses
 *       without looping forever; axis === `cycle`.
 *
 * Every axis maps 1:1 onto a section in
 * `docs/quality-reports/auth/oidc-federation.md`.
 */

import { describe, expect, it } from 'vitest';
import {
  createOidcEntityStatement,
  createOidcTrustAnchor,
  type OidcEntityStatement,
  type TrustAnchor,
} from '@kiwa-lab/auth';
import {
  assertAnchorMatches,
  classifyFederationReason,
  describeChain,
  FederationChainError,
  mustResolveTrustChain,
  resolveTrustChain,
} from '../src/lib/federation.js';

const RP_ID = 'https://rp.example.test';
const INTERMEDIATE_ID = 'https://intermediate.example.test';
const ANCHOR_ID = 'https://anchor.example.test';

// Deterministic clock at 2026-01-01T00:00:00Z so the harness is stable.
const FIXED_NOW_MS = new Date('2026-01-01T00:00:00Z').getTime();
const nowFn = () => FIXED_NOW_MS;
const NOW_SEC = Math.floor(FIXED_NOW_MS / 1000);
const ONE_HOUR = 3600;

function buildLeaf(overrides: Partial<Parameters<typeof createOidcEntityStatement>[0]> = {}): OidcEntityStatement {
  return createOidcEntityStatement({
    iss: INTERMEDIATE_ID,
    sub: RP_ID,
    now: nowFn,
    exp: NOW_SEC + ONE_HOUR,
    ...overrides,
  });
}

function buildIntermediate(overrides: Partial<Parameters<typeof createOidcEntityStatement>[0]> = {}): OidcEntityStatement {
  return createOidcEntityStatement({
    iss: ANCHOR_ID,
    sub: INTERMEDIATE_ID,
    now: nowFn,
    exp: NOW_SEC + ONE_HOUR,
    ...overrides,
  });
}

function buildAnchor(): TrustAnchor {
  return createOidcTrustAnchor({ entity_id: ANCHOR_ID });
}

describe('axis 13 — 3-step chain resolution', () => {
  it('leaf → intermediate → anchor resolves to a full ordered chain', () => {
    const leaf = buildLeaf();
    const intermediate = buildIntermediate();
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      // Chain is ordered leaf (index 0) → intermediate (index 1); the anchor
      // is the terminal `iss` on the last statement, not a chain entry.
      expect(outcome.chain).toHaveLength(2);
      expect(outcome.chain[0]?.sub).toBe(RP_ID);
      expect(outcome.chain[1]?.sub).toBe(INTERMEDIATE_ID);
      expect(outcome.chain[1]?.iss).toBe(ANCHOR_ID);
      expect(outcome.anchor.entity_id).toBe(ANCHOR_ID);
    }
  });

  it('assertAnchorMatches passes when resolved anchor equals expected anchor', () => {
    const leaf = buildLeaf();
    const intermediate = buildIntermediate();
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now: nowFn,
    });
    expect(() => assertAnchorMatches(outcome, anchor)).not.toThrow();
  });

  it('assertAnchorMatches throws FederationChainError with axis=anchor_mismatch when resolved anchor differs from expected anchor', () => {
    const leaf = buildLeaf();
    const intermediate = buildIntermediate();
    const anchor = buildAnchor();
    const impostor = createOidcTrustAnchor({ entity_id: 'https://impostor.example.test' });
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now: nowFn,
    });
    // The resolver was fed the real anchor so it returns `ok:true` with the
    // real anchor. `assertAnchorMatches` compares that against the impostor
    // reference and throws with the `anchor_mismatch` axis pinned — this is
    // the sole live wrapper path that surfaces this axis since the
    // underlying resolver never emits `reason_code === 'anchor_mismatch'`
    // (walker exit paths collapse to `broken_link`).
    try {
      assertAnchorMatches(outcome, impostor);
      throw new Error('expected FederationChainError');
    } catch (err) {
      expect(err).toBeInstanceOf(FederationChainError);
      expect((err as FederationChainError).issue.axis).toBe('anchor_mismatch');
    }
  });

  it('mustResolveTrustChain returns chain + anchor for the happy path', () => {
    const leaf = buildLeaf();
    const intermediate = buildIntermediate();
    const anchor = buildAnchor();
    const { chain, anchor: resolvedAnchor } = mustResolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now: nowFn,
    });
    expect(chain).toHaveLength(2);
    expect(resolvedAnchor.entity_id).toBe(ANCHOR_ID);
  });

  it('describeChain renders leaf -> intermediate -> anchor', () => {
    const leaf = buildLeaf();
    const intermediate = buildIntermediate();
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now: nowFn,
    });
    if (outcome.ok) {
      expect(describeChain(outcome.chain)).toBe(
        `${RP_ID} -> ${INTERMEDIATE_ID} -> ${ANCHOR_ID}`,
      );
    }
  });

  it('describeChain returns "(empty chain)" for an empty chain', () => {
    expect(describeChain([])).toBe('(empty chain)');
  });
});

describe('axis 14 — broken link', () => {
  it('intermediate whose sub does not match the leaf iss refuses', () => {
    const leaf = buildLeaf();
    // Intermediate describes a *different* subject than the leaf's `iss` so
    // the chain-walker cannot find a matching intermediate for the leaf's
    // issuer and refuses.
    const stray = buildIntermediate({ sub: 'https://stray.example.test' });
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [stray],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('broken_link');
      expect(outcome.issue.reason).toMatch(/no intermediate describes/);
    }
  });

  it('empty intermediates + non-anchor leaf iss refuses as broken_link', () => {
    // Leaf issued by INTERMEDIATE_ID but no intermediate is provided — the
    // walker cannot resolve the leaf's issuer and refuses.
    const leaf = buildLeaf();
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('broken_link');
    }
  });

  it('mustResolveTrustChain throws FederationChainError with axis=broken_link', () => {
    const leaf = buildLeaf();
    const anchor = buildAnchor();
    try {
      mustResolveTrustChain({ leaf, intermediates: [], anchor, now: nowFn });
      throw new Error('expected FederationChainError');
    } catch (err) {
      expect(err).toBeInstanceOf(FederationChainError);
      expect((err as FederationChainError).issue.axis).toBe('broken_link');
    }
  });
});

describe('axis 15 — expired intermediate', () => {
  it('intermediate whose exp <= now refuses with axis=expired_intermediate', () => {
    const leaf = buildLeaf();
    const expiredIntermediate = buildIntermediate({
      exp: NOW_SEC - 1,
    });
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [expiredIntermediate],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('expired_intermediate');
      expect(outcome.issue.reason).toMatch(/expired/);
    }
  });

  it('expired leaf refuses with axis=expired_leaf', () => {
    const expiredLeaf = buildLeaf({ exp: NOW_SEC - 1 });
    const intermediate = buildIntermediate();
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf: expiredLeaf,
      intermediates: [intermediate],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('expired_leaf');
    }
  });

  it('intermediate exp exactly at now refuses (exp must be strictly future)', () => {
    const leaf = buildLeaf();
    // exp === now should refuse per resolver semantics `exp <= nowSec`.
    const boundary = buildIntermediate({ exp: NOW_SEC });
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [boundary],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('expired_intermediate');
    }
  });
});

describe('axis 16 — cycle detection', () => {
  it('two-step cycle A ↔ B triggers the cycle detector (walker path revisits INTERMEDIATE)', () => {
    // Build a set that forces the walker to actually enter its cycle-detect
    // branch: leaf.iss = INTERMEDIATE, intermediate A describes INTERMEDIATE
    // and issues to `other`, intermediate B describes `other` and issues back
    // to INTERMEDIATE. Walker path — step 1 picks A (sub=INTERMEDIATE),
    // records INTERMEDIATE in seenIssuers, advances currentIssuer→other;
    // step 2 picks B (sub=other), records other, advances currentIssuer
    // →INTERMEDIATE; step 3 picks A again (sub=INTERMEDIATE), seenIssuers
    // already has INTERMEDIATE, cycle-detect fires. Prior to CAR-432 this
    // test tolerated `cycle | broken_link` because the substring classifier
    // could not distinguish the two — reason_code now pins it.
    const leaf = buildLeaf();
    const other = 'https://intermediate-b.example.test';
    const a = buildIntermediate({ iss: other });
    const b = buildIntermediate({ sub: other, iss: INTERMEDIATE_ID });
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [a, b],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('cycle');
      expect(outcome.issue.reason).toMatch(/cycle detected/);
    }
  });

  it('walker path revisiting an entity fires cycle-detect even with a large intermediate set', () => {
    // Extended path — same A ↔ B pattern with two extra intermediates
    // (C, D) that also participate in the cycle. Walker path is
    // INTERMEDIATE → other → c → d → INTERMEDIATE, and cycle-detect fires on
    // the fifth step (finding stepA again with seenIssuers already holding
    // INTERMEDIATE). maxSteps = intermediates.length + 2 = 6 so the walker
    // has room to complete the loop before the exhaustion guard. Proves the
    // cycle detector works even when the walker traverses several hops
    // before revisiting a seen entity.
    const leaf = buildLeaf();
    const other = 'https://intermediate-b.example.test';
    const c = 'https://intermediate-c.example.test';
    const d = 'https://intermediate-d.example.test';
    const stepA = buildIntermediate({ iss: other });
    const stepB = buildIntermediate({ sub: other, iss: c });
    const stepC = buildIntermediate({ sub: c, iss: d });
    const stepD = buildIntermediate({ sub: d, iss: INTERMEDIATE_ID });
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [stepA, stepB, stepC, stepD],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('cycle');
      expect(outcome.issue.reason).toMatch(/cycle detected/);
    }
  });

  it('cycle where no intermediate describes the leaf iss surfaces as broken_link (walker never enters cycle)', () => {
    // Build a 10-node cycle among intermediates none of which describes the
    // leaf's issuer (INTERMEDIATE). Walker cannot find a step matching
    // currentIssuer = INTERMEDIATE and returns immediately — the cycle
    // never fires because the walker never enters the cycle path. This
    // pins the `broken_link` axis for the "disconnected cycle" case.
    const leaf = buildLeaf();
    const cycles: OidcEntityStatement[] = [];
    for (let i = 0; i < 10; i += 1) {
      cycles.push(
        buildIntermediate({
          sub: `https://cycle-${i}.example.test`,
          iss: `https://cycle-${(i + 1) % 10}.example.test`,
        }),
      );
    }
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: cycles,
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('broken_link');
    }
  });
});

describe('federation wrapper — cross-axis integration', () => {
  it('resolveTrustChain outcome ok=false pins the axis onto the failure mode (empty intermediates → broken_link)', () => {
    // Feed the wrapper an empty intermediates set and pin the failure axis
    // to `broken_link` — the walker cannot describe the leaf's issuer so
    // the resolver refuses immediately. This test formerly used a tolerant
    // `.not.toBe('structural')` assertion which masked axis drift.
    const leaf = buildLeaf();
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [],
      anchor,
      now: nowFn,
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issue.axis).toBe('broken_link');
    }
  });

  it('describeChain accepts the mock resolver output verbatim (round-trip)', () => {
    const leaf = buildLeaf();
    const intermediate = buildIntermediate();
    const anchor = buildAnchor();
    const outcome = resolveTrustChain({
      leaf,
      intermediates: [intermediate],
      anchor,
      now: nowFn,
    });
    if (outcome.ok) {
      const description = describeChain(outcome.chain);
      expect(description.split(' -> ')).toHaveLength(3);
      expect(description).toContain(RP_ID);
      expect(description).toContain(INTERMEDIATE_ID);
      expect(description).toContain(ANCHOR_ID);
    }
  });

  it('classifyFederationReason forwards every upstream reason_code 1:1', () => {
    // Pin the 5-way discriminator forwarding contract. Every upstream
    // `reason_code` must map onto the wrapper's identical-named axis so a
    // future upstream axis addition surfaces as a TypeScript compile error
    // instead of a silent `structural` fall-through.
    expect(classifyFederationReason('broken_link')).toBe('broken_link');
    expect(classifyFederationReason('cycle')).toBe('cycle');
    expect(classifyFederationReason('expired_intermediate')).toBe('expired_intermediate');
    expect(classifyFederationReason('expired_leaf')).toBe('expired_leaf');
    expect(classifyFederationReason('anchor_mismatch')).toBe('anchor_mismatch');
  });

  it('classifyFederationReason falls back to structural when reason_code is undefined', () => {
    // Safety net — an upstream resolver that never populates `reason_code`
    // (e.g., a hand-rolled `TrustChainResult` from a downstream shim) must
    // still classify as `structural` so the wrapper contract stays total.
    expect(classifyFederationReason(undefined)).toBe('structural');
  });
});
