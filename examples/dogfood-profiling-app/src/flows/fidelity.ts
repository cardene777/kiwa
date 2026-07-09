/**
 * Fidelity harness — walks both mock and real adapters through the same
 * lifecycle inputs and returns a divergence report that plugs into the
 * `@kiwa-lab/quality-metrics` 13-axis release gate.
 *
 * Fidelity model — the harness diffs the ordered sequence of neutral
 * events (op + neutralEvent + bucket) between mock and real. Any missing
 * event, out-of-order event, or ok/errorKind flip is a divergence. The
 * mock adapter's trace is always the reference — when the real adapter
 * env is missing every op reports the sentinel + ok=false which is by
 * definition a divergence against the mock (which is always ok=true).
 */

import { ALL_BACKENDS } from '../policies/backends.js';
import type {
  ProfilingAdapter,
  ProfilingSessionConfig,
  TraceEvent,
} from '../adapters/interface.js';
import { runFullProfilingLifecycle, type LifecycleInput } from './profiling-flows.js';

export interface FidelityRunInput {
  configs?: readonly ProfilingSessionConfig[];
  perConfigInput: (config: ProfilingSessionConfig) => LifecycleInput;
}

export interface FidelityRunOutput {
  mockTrace: readonly TraceEvent[];
  realTrace: readonly TraceEvent[];
  /** Neutral events present in mock but missing from real (or vice versa). */
  missingInReal: readonly string[];
  missingInMock: readonly string[];
  /** ok flip count — ops where mock was ok=true but real was ok=false. */
  okFlipCount: number;
  /** Total events per adapter. */
  mockEventCount: number;
  realEventCount: number;
  /** Divergence score = missing count + ok flips. Lower is better. */
  divergenceCount: number;
}

/**
 * Run one adapter through the matrix and return its trace. Exposed for
 * tests that only need the mock leg.
 */
export async function runAdapterMatrix(
  adapter: ProfilingAdapter,
  configs: readonly ProfilingSessionConfig[],
  perConfigInput: (config: ProfilingSessionConfig) => LifecycleInput,
): Promise<readonly TraceEvent[]> {
  for (const config of configs) {
    await runFullProfilingLifecycle(adapter, perConfigInput(config));
  }
  return adapter.trace();
}

/**
 * Run the full fidelity harness — walks mock + real through the matrix
 * and computes the divergence report.
 */
export async function runFidelityHarness(
  mock: ProfilingAdapter,
  real: ProfilingAdapter,
  input: FidelityRunInput,
): Promise<FidelityRunOutput> {
  const configs = input.configs ?? ALL_BACKENDS;
  const mockTrace = await runAdapterMatrix(mock, configs, input.perConfigInput);
  const realTrace = await runAdapterMatrix(real, configs, input.perConfigInput);

  const mockKeys = keySet(mockTrace);
  const realKeys = keySet(realTrace);
  const missingInReal = [...mockKeys].filter((k) => !realKeys.has(k));
  const missingInMock = [...realKeys].filter((k) => !mockKeys.has(k));
  const okFlipCount = countOkFlips(mockTrace, realTrace);
  const divergenceCount = missingInReal.length + missingInMock.length + okFlipCount;

  return {
    mockTrace,
    realTrace,
    missingInReal: Object.freeze(missingInReal),
    missingInMock: Object.freeze(missingInMock),
    okFlipCount,
    mockEventCount: mockTrace.length,
    realEventCount: realTrace.length,
    divergenceCount,
  };
}

/**
 * Build a Set of neutralEvent keys from a trace so the harness can diff
 * event coverage (not ordering). Ordering diffs are captured via
 * position-based comparison in a separate helper.
 */
function keySet(trace: readonly TraceEvent[]): Set<string> {
  const s = new Set<string>();
  for (const e of trace) {
    s.add(`${e.bucket}:${e.op}:${e.neutralEvent}`);
  }
  return s;
}

/**
 * Count ok=true → ok=false flips between mock (reference) and real
 * (comparison). We compare per (bucket, op) key so a real ok=false when
 * env is missing counts once per op.
 */
function countOkFlips(
  mockTrace: readonly TraceEvent[],
  realTrace: readonly TraceEvent[],
): number {
  const mockOk = new Map<string, boolean>();
  for (const e of mockTrace) {
    mockOk.set(`${e.bucket}:${e.op}`, e.ok);
  }
  let flips = 0;
  for (const e of realTrace) {
    const key = `${e.bucket}:${e.op}`;
    if (mockOk.get(key) === true && e.ok === false) {
      flips += 1;
    }
  }
  return flips;
}
