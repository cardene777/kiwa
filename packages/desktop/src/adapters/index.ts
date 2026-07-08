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

// v0.5 spawn stub 契約層 (depth-5 pattern 2 例目 candidate、 Mobile v1.54 rhythm 再現)
export {
  buildSpawnInvocation,
  cliForAxis,
  invokeDesktopCli,
  type DesktopCliCommand,
  type SpawnInvocation,
  type SpawnResult,
} from './spawn-driver.js';
