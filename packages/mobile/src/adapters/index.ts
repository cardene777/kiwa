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

// v0.5 spawn driver (pair 深度 5 段拡張 1 例目 candidate、 depth-5 pattern 新設)
// v0.6 real spawn 実行 (depth-5 pattern 実装完成)
export {
  buildSpawnInvocation,
  cliForAxis,
  invokeMobileCli,
  invokeMobileCliWith,
  type MobileCliCommand,
  type SpawnInvocation,
  type SpawnResult,
} from './spawn-driver.js';

export {
  executeSpawn,
  sanitizeEnv,
  type SpawnExecutorInput,
  type SpawnExecutorResult,
  type SpawnFn,
} from './spawn-executor.js';
