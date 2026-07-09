import {
  runFidelityCheck,
  summarizeFidelity,
  summarizeFidelityBehaviorDiff,
  type FidelityBehaviorSummary,
  type FidelityDiff,
  type FidelitySummary,
} from '@kiwa-lab/desktop';

export interface EarlyWarningReport {
  shapeContractPreserving: boolean;
  matchedPairs: number;
  totalPairs: number;
  axesWithBehaviorDiff: string[];
  totalMetadataDiffs: number;
  behaviorSummary: FidelityBehaviorSummary;
  shapeSummary: FidelitySummary;
}

/** Shape 契約 preserving 検証経路 (36 pair 全 matched を保証)。 */
export async function verifyShapeContract(): Promise<{
  diffs: FidelityDiff[];
  summary: FidelitySummary;
}> {
  const diffs = await runFidelityCheck({});
  const summary = summarizeFidelity(diffs);
  return { diffs, summary };
}

/** Behavior diff early warning 実運用経路。 */
export async function runEarlyWarningReport(): Promise<EarlyWarningReport> {
  const diffs = await runFidelityCheck({});
  const shapeSummary = summarizeFidelity(diffs);
  const behaviorSummary = summarizeFidelityBehaviorDiff(diffs);
  return {
    shapeContractPreserving: shapeSummary.matchedRatio === 1,
    matchedPairs: shapeSummary.matched,
    totalPairs: shapeSummary.total,
    axesWithBehaviorDiff: behaviorSummary.axesWithBehaviorDiff,
    totalMetadataDiffs: behaviorSummary.totalMetadataDiffs,
    behaviorSummary,
    shapeSummary,
  };
}

/** Per-axis diff drill-down (どの axis の どの step で behavior 差別化が起きているか)。 */
export async function drillDownAxisDiff(axis: string): Promise<{
  metadataKeys: string[];
  affectedNeutralEvents: string[];
}> {
  const diffs = await runFidelityCheck({});
  const axisDiffs = diffs.filter((d) => d.axis === axis);
  const metadataKeys = new Set<string>();
  const affectedNeutralEvents = new Set<string>();
  for (const d of axisDiffs) {
    for (const m of d.metadataDiffs) {
      metadataKeys.add(m.key);
      affectedNeutralEvents.add(m.neutralEvent);
    }
  }
  return {
    metadataKeys: Array.from(metadataKeys),
    affectedNeutralEvents: Array.from(affectedNeutralEvents),
  };
}
