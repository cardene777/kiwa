import { evaluateFlag, type EvaluateFlagResult } from './evaluator.js';
import type { FlagClient, FlagUser } from './client.js';

export interface BatchEvaluateResult {
  total: number;
  results: EvaluateFlagResult[];
  byKey: Record<string, EvaluateFlagResult>;
}

/** batch evaluate: 複数 (key, user) pair を一括評価。 */
export function evaluateBatch(
  client: FlagClient,
  entries: readonly { key: string; user: FlagUser }[],
): BatchEvaluateResult {
  const results = entries.map(({ key, user }) => evaluateFlag(client, key, user));
  const byKey: Record<string, EvaluateFlagResult> = {};
  for (const r of results) byKey[r.key] = r;
  return { total: entries.length, results, byKey };
}
