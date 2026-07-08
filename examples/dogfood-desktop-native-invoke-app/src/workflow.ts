import {
  probeAndInvoke,
  probeAndInvokeAll,
  type DesktopAxis,
  type DesktopTarget,
  type NativeInvokeMatrixSummary,
  type NativeInvokeResult,
  type SpawnFn,
} from '@kiwa-test/desktop';

/** Pattern 1 — 単一 axis / target で probeAndInvoke 実行 */
export async function invokeSingleAxis(input: {
  axis: DesktopAxis;
  target: DesktopTarget;
  spawnFn?: SpawnFn;
}): Promise<NativeInvokeResult> {
  return probeAndInvoke(input);
}

/** Pattern 2 — 12 axis × 3 target = 36 pair matrix 走査 */
export async function invokeAllAxes(spawnFn?: SpawnFn): Promise<NativeInvokeMatrixSummary> {
  return probeAndInvokeAll(spawnFn ? { spawnFn } : {});
}

/** Pattern 3 — 4 status 別 count report */
export interface StatusReport {
  invokedCount: number;
  cliUnavailableCount: number;
  axisSkippedCount: number;
  noCliMappingCount: number;
  totalCount: number;
}

export async function generateStatusReport(spawnFn?: SpawnFn): Promise<StatusReport> {
  const summary = await invokeAllAxes(spawnFn);
  return {
    invokedCount: summary.invoked.length,
    cliUnavailableCount: summary.cliUnavailable.length,
    axisSkippedCount: summary.axisSkipped.length,
    noCliMappingCount: summary.noCliMapping.length,
    totalCount: summary.total,
  };
}

/** Pattern 4 — invoked pair のみ spawnResult 抽出 */
export async function extractInvokedSpawnResults(spawnFn: SpawnFn): Promise<
  {
    axis: DesktopAxis;
    target: DesktopTarget;
    stdout: string;
    exitCode: number | null;
  }[]
> {
  const summary = await invokeAllAxes(spawnFn);
  return summary.invoked
    .filter((r) => r.spawnResult !== null)
    .map((r) => ({
      axis: r.axis,
      target: r.target,
      stdout: r.spawnResult!.stdout,
      exitCode: r.spawnResult!.exitCode,
    }));
}
