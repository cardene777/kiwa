import type {
  EntityStatement,
  ResolveTrustChainInput,
  TrustAnchor,
  TrustChainResult,
} from './types.js';

/**
 * Resolve a trust chain per OpenID Federation 1.0 §7. The chain walks from
 * the leaf entity (typically the RP or a subordinate OP) through zero-or-more
 * intermediates up to a trust anchor.
 *
 * Chain-walk rules (matches OIDF §7.2):
 *   - Every statement in the chain must have `iss` equal to the previous
 *     step's subject (the anchor is a virtual step past the last statement's
 *     iss).
 *   - Every statement must have `exp > now`.
 *   - The final statement's `iss` must equal the trust anchor's entity_id.
 *
 * The mock does not verify JWS signatures on the statements — the point is
 * to prove the chain-walk logic. Callers wanting to test signature
 * verification build the statements with dedicated fixtures.
 */
export function resolveTrustChain(input: ResolveTrustChainInput): TrustChainResult {
  const now = input.now ?? (() => Date.now());
  const nowSec = Math.floor(now() / 1000);

  const { leaf, intermediates, anchor } = input;

  // Build the ordered chain from leaf → anchor. The chain traversal walks
  // from the leaf's `iss` upward, hopping through intermediates by matching
  // each intermediate's `sub` to the previous statement's `iss`.
  const chain: EntityStatement[] = [leaf];
  const seenIssuers = new Set<string>([leaf.sub]);
  let currentIssuer = leaf.iss;

  // Guard cycle length so a malformed intermediate set with a cycle does
  // not loop forever. `intermediates.length + 2` is the maximum length of a
  // valid chain (every intermediate can appear once, plus leaf + anchor
  // slot).
  const maxSteps = intermediates.length + 2;
  let steps = 0;

  while (currentIssuer !== anchor.entity_id && steps < maxSteps) {
    steps += 1;

    // Find the intermediate whose `sub` matches the currentIssuer — that
    // intermediate is the step of the chain that describes the currentIssuer.
    const step = intermediates.find(
      (intermediate) => intermediate.sub === currentIssuer,
    );
    if (step === undefined) {
      return {
        valid: false,
        reason: `trust_chain: no intermediate describes "${currentIssuer}" — chain broken`,
      };
    }

    // Cycle detection. If we would re-enter an entity we already saw, the
    // chain contains a cycle and cannot resolve.
    if (seenIssuers.has(step.sub)) {
      return {
        valid: false,
        reason: `trust_chain: cycle detected at "${step.sub}"`,
      };
    }
    seenIssuers.add(step.sub);

    // Expiration check. A statement past its `exp` is treated as untrusted.
    if (typeof step.exp !== 'number' || step.exp <= nowSec) {
      return {
        valid: false,
        reason: `trust_chain: statement for "${step.sub}" expired — exp=${step.exp}, now=${nowSec}`,
      };
    }

    chain.push(step);
    currentIssuer = step.iss;
  }

  // If we exited the loop because we hit `maxSteps`, the chain is malformed.
  if (currentIssuer !== anchor.entity_id) {
    return {
      valid: false,
      reason: `trust_chain: exhausted intermediates without reaching anchor "${anchor.entity_id}"`,
    };
  }

  // Leaf expiration must also be inside the window.
  if (typeof leaf.exp !== 'number' || leaf.exp <= nowSec) {
    return {
      valid: false,
      reason: `trust_chain: leaf statement for "${leaf.sub}" expired — exp=${leaf.exp}, now=${nowSec}`,
    };
  }

  return {
    valid: true,
    chain,
    anchor,
  };
}

/**
 * Build a plain trust-anchor fixture for tests. Wraps the manual object
 * construction so tests import a single helper.
 */
export function createTrustAnchor(input: {
  entity_id: string;
  jwks?: TrustAnchor['jwks'];
  metadata?: TrustAnchor['metadata'];
}): TrustAnchor {
  return {
    entity_id: input.entity_id,
    jwks: input.jwks ?? { keys: [] },
    metadata: input.metadata ?? {},
  };
}

/**
 * Build a plain entity statement for tests. Sets sensible defaults for
 * `iat` / `exp` so tests only override the fields they care about.
 */
export function createEntityStatement(input: {
  iss: string;
  sub: string;
  jwks?: EntityStatement['jwks'];
  metadata?: EntityStatement['metadata'];
  iat?: number;
  exp?: number;
  now?: () => number;
}): EntityStatement {
  const now = input.now ?? (() => Date.now());
  const iatDefault = Math.floor(now() / 1000);
  return {
    iss: input.iss,
    sub: input.sub,
    jwks: input.jwks ?? { keys: [] },
    metadata: input.metadata ?? {},
    iat: input.iat ?? iatDefault,
    exp: input.exp ?? iatDefault + 3600,
  };
}
