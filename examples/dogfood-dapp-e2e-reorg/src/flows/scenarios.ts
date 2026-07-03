/**
 * Shared 4-scenario flow — the mock and real adapters walk the same op
 * sequence so the fidelity harness can diff the trace both emit. Each scenario
 * is 1 op the adapter interface exposes; keeping them as a stand-alone
 * function keeps the release-gate release_gate.spec + fidelity emit script +
 * unit tests exercising the exact same code path the harness exercises.
 */

import type { ReorgAdapter, ReorgScenarioResult } from '../adapters/interface.js';

export async function runAllScenarios(
  adapter: ReorgAdapter,
): Promise<ReorgScenarioResult[]> {
  const results: ReorgScenarioResult[] = [];
  for (const op of ['pendingTx', 'confirmedTx', 'transferEvent', 'nonceGap'] as const) {
    try {
      results.push(await adapter[op]());
    } catch {
      // Real-mode failures are recorded in the adapter trace; the harness
      // observes them via `adapter.traces()`, so swallowing the throw keeps
      // the run going. Mock failures still propagate through
      // `runAdapterMatrix` — see flows/fidelity.ts.
    }
  }
  return results;
}
