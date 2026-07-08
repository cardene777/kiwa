// v0.4 adapter interface (pair 深度 4 段拡張達成 5 例目 depth-4 record、 Mobile v1.53 rhythm 再現)
export {
  type AdapterInvocation,
  type AdapterMode,
  type AdapterResult,
  type DesktopAdapter,
} from './types.js';

export {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  makeMockAdapter,
  makeRealAdapter,
} from './mock-factory.js';

export {
  runFidelityCheck,
  summarizeFidelity,
  type FidelityDiff,
  type FidelitySummary,
} from './fidelity-harness.js';
