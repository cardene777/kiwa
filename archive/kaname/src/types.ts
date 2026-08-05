/**
 * @kiwa-lab/kaname v0.1 = spec-driven development toolkit for kiwa's
 * 3-layer specification model.
 *
 * The core idea: every specification item lives in exactly ONE of three layers.
 * Mixing them creates silent verification gaps.
 *
 * - `formal`  = Lean-verifiable state machines and pure contracts (v2.14+)
 * - `runtime` = side effects, integration, performance (vitest / real driver)
 * - `human`   = UX, business intent, non-mechanical judgment (PR review)
 */

export type SpecLayer = 'formal' | 'runtime' | 'human';

export interface SpecItem {
  /** Stable identifier, e.g. `AC-001`. Must be unique within a SpecDoc. */
  id: string;
  /** One-sentence acceptance criterion. */
  statement: string;
  /** Layer this item must be verified in. */
  layer: SpecLayer;
  /**
   * How this item will be verified.
   * - formal → Lean namespace or orchestrator name (e.g., `Transaction`)
   * - runtime → test path or category (e.g., `tests/integration/auth.test.ts`)
   * - human   → review checkpoint (e.g., `UX walkthrough`, `Product approval`)
   */
  verifyBy: string;
  /** Optional freeform notes. */
  notes?: string;
}

export interface SpecDoc {
  /** Human-readable title of the whole specification. */
  title: string;
  /** GitHub issue / Linear ID this spec covers, if any. */
  issueRef?: string;
  /** Ordered list of specification items. Order = source order. */
  items: readonly SpecItem[];
}

export interface SplitResult {
  /** Contents of `specFormal.md` — items with `layer === 'formal'`. */
  specFormal: string;
  /** Contents of `specRuntime.md` — items with `layer === 'runtime'` or `'human'`. */
  specRuntime: string;
  /** Coverage summary for downstream tooling. */
  summary: {
    total: number;
    formalCount: number;
    runtimeCount: number;
    humanCount: number;
  };
}

export interface ClassifyIssue {
  itemId: string;
  reason:
    | 'duplicate-id'
    | 'empty-statement'
    | 'unknown-layer'
    | 'empty-verify-by'
    | 'both-layers-touch-same-artifact';
  message: string;
}

export interface ClassifyReport {
  ok: boolean;
  issues: readonly ClassifyIssue[];
  perLayer: Readonly<Record<SpecLayer, number>>;
}
