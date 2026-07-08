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
  summarizeFidelityBehaviorDiff,
  type FidelityBehaviorSummary,
  type FidelityDiff,
  type FidelitySummary,
  type MetadataDiff,
} from './fidelity-harness.js';

// v0.7 real behavior runner (behavior diff early warning 実運用開始)
export { REAL_AXIS_RUNNERS } from './real-runner.js';

// v0.8 native binding availability probe + skip 経路
export {
  computeSkipMatrix,
  platformGate,
  probeCliAvailable,
  shouldSkipAxis,
  type NodePlatform,
  type PlatformGate,
  type ProbeInput,
  type ProbeResult,
} from './probe.js';

export {
  runFidelityCheckWithProbe,
  type FidelityCheckWithProbeResult,
  type SkippedPair,
} from './fidelity-harness.js';

// v0.9 実 native binding 呼出 (probe + invoke 統合)
export {
  probeAndInvoke,
  probeAndInvokeAll,
  type InvokeStatus,
  type NativeInvokeInput,
  type NativeInvokeMatrixSummary,
  type NativeInvokeResult,
} from './native-invoke.js';

// v1.0 invoke-cache layer (depth-6 pattern 2 例目確定 candidate、 Desktop v0.9 → v1.0)
export {
  InvokeCache,
  buildCacheKey,
  withCache,
  type CacheStatus,
  type CachedInvokeEntry,
  type CachedNativeInvokeResult,
  type InvokeCacheConfig,
} from './invoke-cache.js';

// v0.5 spawn stub 契約層 + v0.6 実 spawn (depth-5 pattern 2 例目確定、 depth-6 pattern 新設 candidate、 Mobile v1.54-v1.55 rhythm 再現)
export {
  buildSpawnInvocation,
  cliForAxis,
  invokeDesktopCli,
  invokeDesktopCliWith,
  type DesktopCliCommand,
  type SpawnInvocation,
  type SpawnResult,
} from './spawn-driver.js';

// v0.6 spawn executor (Mobile v0.6 pattern 転用)
export {
  executeSpawn,
  sanitizeEnv,
  type SpawnExecutorInput,
  type SpawnExecutorResult,
  type SpawnFn,
} from './spawn-executor.js';
