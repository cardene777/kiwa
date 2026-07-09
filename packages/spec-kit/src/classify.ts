import type { ClassifyIssue, ClassifyReport, SpecDoc, SpecLayer } from './types.js';

/**
 * Statically classify a SpecDoc and surface layer-model violations.
 *
 * Rules enforced:
 *   1. every item must have a non-empty statement
 *   2. every item must have a non-empty verifyBy target
 *   3. every item must declare a known layer (formal / runtime / human)
 *   4. every item id is unique within the doc
 *   5. no formal item may reuse a verifyBy target that a runtime item also names
 *      (this catches the "specified twice, verified nowhere" pattern where the
 *      author put the same acceptance criterion in both layers hoping one side
 *      would catch it — always ends in a silent gap).
 */
export function classify(doc: SpecDoc): ClassifyReport {
  const issues: ClassifyIssue[] = [];
  const seenIds = new Set<string>();
  const verifyByToLayer = new Map<string, SpecLayer>();
  const perLayer = { formal: 0, runtime: 0, human: 0 } as Record<SpecLayer, number>;

  for (const item of doc.items) {
    if (seenIds.has(item.id)) {
      issues.push({
        itemId: item.id,
        reason: 'duplicate-id',
        message: `duplicate item id "${item.id}"; item ids must be unique within a SpecDoc`,
      });
      continue;
    }
    seenIds.add(item.id);

    if (!item.statement || item.statement.trim() === '') {
      issues.push({
        itemId: item.id,
        reason: 'empty-statement',
        message: `item "${item.id}" has an empty statement; every item must be a non-trivial acceptance criterion`,
      });
    }
    if (!item.verifyBy || item.verifyBy.trim() === '') {
      issues.push({
        itemId: item.id,
        reason: 'empty-verify-by',
        message: `item "${item.id}" has no verifyBy target; every item must declare where it will be verified`,
      });
    }
    if (item.layer !== 'formal' && item.layer !== 'runtime' && item.layer !== 'human') {
      issues.push({
        itemId: item.id,
        reason: 'unknown-layer',
        message: `item "${item.id}" has unknown layer "${item.layer as string}"; expected one of formal / runtime / human`,
      });
      continue;
    }
    perLayer[item.layer] += 1;

    const existing = verifyByToLayer.get(item.verifyBy);
    if (existing !== undefined && existing !== item.layer) {
      issues.push({
        itemId: item.id,
        reason: 'both-layers-touch-same-artifact',
        message: `item "${item.id}" verifies via "${item.verifyBy}" which is already claimed by a "${existing}" item; the same artifact must not straddle two layers`,
      });
    }
    verifyByToLayer.set(item.verifyBy, item.layer);
  }

  return {
    ok: issues.length === 0,
    issues,
    perLayer,
  };
}
