/**
 * OpenID Federation 1.0 §7 trust chain wrapper — layers dogfood-app-specific
 * fidelity assertions on top of `@kiwa/auth`'s `resolveTrustChain`.
 * Sub-Issue v1.21-4d (this state) exercises the four Federation §7.2 chain-walk
 * axes end-to-end. The wrapper does not re-implement chain traversal — the
 * underlying `resolveOidcTrustChain` already walks `iss` → `sub` linkage,
 * checks `exp > now`, and detects cycles. The wrapper adds:
 *   - a `FederationIssue` discriminator that forwards the upstream
 *     `TrustChainReasonCode` tag (`broken_link` / `cycle` /
 *     `expired_intermediate` / `expired_leaf`) 1:1 to the wrapper's
 *     `FederationChainAxis` so tests pin the failure axis without grepping
 *     the underlying reason string (v1.21 follow-up — GH #880 / CAR-432);
 *   - `anchor_mismatch` axis that only `assertAnchorMatches` constructs
 *     (walker exit paths inside `@kiwa/auth` collapse onto
 *     `broken_link` when they exhaust intermediates, so this axis lives on
 *     the wrapper side alone);
 *   - a `mustResolveTrustChain` variant that throws on failure so the RP
 *     bootstrap path can treat the return value as an always-valid chain;
 *   - a `describeChain` helper that renders the chain as a human-readable
 *     `iss → sub` sequence for docs + release-gate reports.
 *
 * The four Sub-Issue v1.21-4d federation fidelity axes covered by
 * `tests/federation-trust-chain.spec.ts` —
 *
 * | axis | assertion |
 * |---|---|
 * | 13. 3-step chain | leaf → intermediate → anchor resolves to a full ordered chain; anchor === expected trust anchor |
 * | 14. broken link | intermediate whose `sub` does not match the previous step's `iss` refuses; axis === `broken_link` |
 * | 15. expired intermediate | intermediate whose `exp <= now` refuses; axis === `expired_intermediate` |
 * | 16. cycle detection | intermediate set containing a cycle refuses without looping; axis === `cycle` |
 *
 * Every axis maps 1:1 onto a section in
 * `docs/quality-reports/auth/oidc-federation.md`.
 */

import {
  resolveOidcTrustChain,
  type OidcEntityStatement,
  type ResolveTrustChainInput,
  type TrustAnchor,
  type TrustChainReasonCode,
  type TrustChainResult,
} from '@kiwa/auth';

/**
 * Fidelity axis a federation trust-chain failure maps onto. The wrapper
 * classifies the underlying `reason` string into one of these tags so tests can
 * assert on the failure mode without regexing.
 */
export type FederationChainAxis =
  | 'broken_link'
  | 'expired_intermediate'
  | 'expired_leaf'
  | 'cycle'
  | 'anchor_mismatch'
  | 'structural';

/**
 * Structured chain-resolution issue produced by the wrapper on failure. `axis`
 * pins the fidelity axis the failure belongs to; `reason` echoes the
 * underlying resolver's raw message for debuggability.
 */
export interface FederationIssue {
  axis: FederationChainAxis;
  reason: string;
}

/**
 * Discriminated wrapper result. `ok=true` carries the ordered chain + the
 * matched anchor; `ok=false` carries a structured {@link FederationIssue}
 * so tests pin the axis.
 */
export type FederationResolveOutcome =
  | {
      ok: true;
      chain: readonly OidcEntityStatement[];
      anchor: TrustAnchor;
    }
  | { ok: false; issue: FederationIssue };

/**
 * Classify a failure result from the underlying resolver onto one of the
 * federation fidelity axes. Consumes the structured `reason_code`
 * discriminator emitted by `@kiwa/auth`'s `resolveTrustChain` since
 * v1.21 — the `reason_code` axis tag is upstream SSOT, the wrapper is a
 * 1:1 forwarder。
 *
 * `reason_code` が undefined の場合 (未来の upstream regression or 手動生成の
 * `TrustChainResult` を受けた場合) の safety net として `structural` を返す。
 * 通常の resolver は必ず `reason_code` を emit するため実運用では起きない。
 *
 * `anchor_mismatch` は underlying resolver からは emit されない (walker が
 * 到達点の anchor 検査を行うため常に broken_link に集約される)。 wrapper
 * 上の `anchor_mismatch` axis は `assertAnchorMatches` が別 anchor を
 * expected として渡された時に別経路で構築される — 詳細は同関数を参照。
 */
export function classifyFederationReason(
  reason_code: TrustChainReasonCode | undefined,
): FederationChainAxis {
  if (reason_code === undefined) {
    return 'structural';
  }
  return reason_code;
}

/**
 * Resolve a trust chain through the wrapper. Returns a discriminated outcome so
 * callers can pattern-match on the failure axis. The underlying resolver is
 * invoked once — every axis assertion the mock performs is folded into a
 * single `valid` / `reason` shape which the wrapper then unpacks.
 */
export function resolveTrustChain(input: ResolveTrustChainInput): FederationResolveOutcome {
  const result: TrustChainResult = resolveOidcTrustChain(input);
  if (result.valid && result.chain !== undefined && result.anchor !== undefined) {
    return { ok: true, chain: result.chain, anchor: result.anchor };
  }
  const reason = result.reason ?? 'trust_chain: resolution failed without reason';
  return {
    ok: false,
    issue: {
      axis: classifyFederationReason(result.reason_code),
      reason,
    },
  };
}

/**
 * Error thrown by {@link mustResolveTrustChain} when resolution fails. Carries
 * the same {@link FederationIssue} the discriminated wrapper would report so
 * downstream catch blocks can inspect the axis without re-classifying.
 */
export class FederationChainError extends Error {
  constructor(public issue: FederationIssue) {
    super(`trust_chain: ${issue.axis} — ${issue.reason}`);
    this.name = 'FederationChainError';
  }
}

/**
 * Resolve a trust chain and throw on failure. Useful for the RP bootstrap path
 * where the caller wants to treat the return value as an always-valid chain
 * (any failure produces a startup abort upstream).
 */
export function mustResolveTrustChain(input: ResolveTrustChainInput): {
  chain: readonly OidcEntityStatement[];
  anchor: TrustAnchor;
} {
  const outcome = resolveTrustChain(input);
  if (outcome.ok) {
    return { chain: outcome.chain, anchor: outcome.anchor };
  }
  throw new FederationChainError(outcome.issue);
}

/**
 * Assert the resolved chain's anchor entity_id matches the expected anchor.
 * Federation §7.2 requires the final step's `iss` to equal the trust anchor's
 * entity_id — the underlying resolver already enforces this, but the extra
 * check lets tests pin the resolved anchor against an independent reference so
 * an accidental resolver swap (mock vs another implementation) still trips
 * the fidelity harness.
 */
export function assertAnchorMatches(
  outcome: FederationResolveOutcome,
  expected: TrustAnchor,
): asserts outcome is { ok: true; chain: readonly OidcEntityStatement[]; anchor: TrustAnchor } {
  if (!outcome.ok) {
    throw new FederationChainError(outcome.issue);
  }
  if (outcome.anchor.entity_id !== expected.entity_id) {
    throw new FederationChainError({
      axis: 'anchor_mismatch',
      reason: `trust_chain: resolved anchor "${outcome.anchor.entity_id}" does not match expected "${expected.entity_id}"`,
    });
  }
}

/**
 * Render a resolved chain as a human-readable `sub → iss` sequence. Used by
 * the release-gate report to show which entities participated in the chain
 * without dumping the full JWKS bodies. Format: `leafSub -> intermediateSub -> anchor`
 * so a reader can eyeball the delegation without decoding statements.
 */
export function describeChain(chain: readonly OidcEntityStatement[]): string {
  if (chain.length === 0) {
    return '(empty chain)';
  }
  const nodes: string[] = [];
  for (const step of chain) {
    nodes.push(step.sub);
  }
  // Add the terminal iss (the trust anchor's entity_id) so the description
  // shows the full walk up to the anchor.
  const last = chain[chain.length - 1];
  if (last !== undefined) {
    nodes.push(last.iss);
  }
  return nodes.join(' -> ');
}
