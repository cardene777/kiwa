import {
  computeSkipMatrix,
  probeCliAvailable,
  runFidelityCheckWithProbe,
  shouldSkipAxis,
  type DesktopAxis,
  type DesktopCliCommand,
  type DesktopTarget,
  type FidelityCheckWithProbeResult,
  type ProbeResult,
  type SpawnFn,
} from '@kiwa-lab/desktop';

/** Pattern 1 — 8 CLI 全て probe (which/where 実行) して availability 判定 */
export async function probeAllCliCommands(spawnFn?: SpawnFn): Promise<ProbeResult[]> {
  const commands: DesktopCliCommand[] = [
    'electron-builder',
    'electron-updater',
    'ffmpeg',
    'xclip',
    'osascript',
    'notify-send',
    'defaults',
    'reg',
  ];
  const results: ProbeResult[] = [];
  for (const command of commands) {
    const result = await probeCliAvailable(spawnFn ? { command, spawnFn } : { command });
    results.push(result);
  }
  return results;
}

/** Pattern 2 — 現 platform 特化 の skip decision drill-down */
export function getSkipDecisionsForCurrentPlatform(): {
  axis: DesktopAxis;
  target: DesktopTarget;
  skip: boolean;
  reason: string | null;
}[] {
  return computeSkipMatrix();
}

/** Pattern 3 — fidelity harness probe 統合 workflow */
export async function runProbeAwareFidelityCheck(): Promise<FidelityCheckWithProbeResult> {
  return runFidelityCheckWithProbe({});
}

/** Pattern 4 — 特定 axis + target の skip 判定 helper */
export function checkSkipForAxis(axis: DesktopAxis, target: DesktopTarget): {
  skip: boolean;
  reason: string | null;
} {
  return shouldSkipAxis(axis, target);
}
