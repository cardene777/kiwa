export {
  assertMobileRealDriverAvailable,
  readMobileRealDriverEnv,
  type MobileRealDriverAxis,
  type MobileRealDriverEnv,
} from './real-driver.js';

// v0.4 real driver adapter interface (pair 深度 4 段拡張達成 4 例目 depth-4 record)
export {
  type AdapterInvocation,
  type AdapterMode,
  type AdapterResult,
  type MobileAdapter,
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
} from './fidelity-harness.js';
