import {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  runFidelityCheck,
  summarizeFidelity,
  type AdapterInvocation,
  type AdapterResult,
  type DesktopAxis,
  type DesktopTarget,
} from '@kiwa-lab/desktop';

const ALL_AXES: DesktopAxis[] = [
  'electron',
  'tauri',
  'webview',
  'auto-updater',
  'fs-permissions',
  'notification',
  'menu-bar',
  'tray-icon',
  'screen-recording',
  'global-shortcut',
  'clipboard',
  'dark-mode',
];

const ALL_TARGETS: DesktopTarget[] = ['macos', 'windows', 'linux'];

export async function runAllMockAdapters(): Promise<AdapterResult[]> {
  const results: AdapterResult[] = [];
  for (const axis of ALL_AXES) {
    for (const target of ALL_TARGETS) {
      const inv: AdapterInvocation = { scanId: `mock-${axis}-${target}`, target, mode: 'mock' };
      results.push(await MOCK_ADAPTERS[axis].scan(inv));
    }
  }
  return results;
}

export async function runAllRealAdapters(): Promise<AdapterResult[]> {
  const results: AdapterResult[] = [];
  for (const axis of ALL_AXES) {
    for (const target of ALL_TARGETS) {
      const inv: AdapterInvocation = { scanId: `real-${axis}-${target}`, target, mode: 'real' };
      results.push(await REAL_ADAPTERS[axis].scan(inv));
    }
  }
  return results;
}

export async function runFullFidelityCheck() {
  const diffs = await runFidelityCheck({ axes: ALL_AXES, targets: ALL_TARGETS });
  const summary = summarizeFidelity(diffs);
  return { diffs, summary };
}

export { ALL_AXES, ALL_TARGETS };
