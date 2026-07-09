import {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  runFidelityCheck,
  summarizeFidelity,
  type AdapterInvocation,
  type AdapterResult,
  type MobileAxis,
  type MobileTarget,
} from '@kiwa-lab/mobile';

const ALL_AXES: MobileAxis[] = [
  'react-native',
  'expo',
  'metro',
  'navigation',
  'reanimated',
  'async-storage',
  'secure-storage',
  'fabric',
  'turbo-modules',
  'codegen',
  'new-architecture',
];

const ALL_TARGETS: MobileTarget[] = ['ios', 'android', 'web'];

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
  const diffs = await runFidelityCheck(ALL_AXES, ALL_TARGETS);
  const summary = summarizeFidelity(diffs);
  return { diffs, summary };
}

export { ALL_AXES, ALL_TARGETS };
