export {
  createVectorClient,
  type VectorProvider,
  type VectorClient,
  type VectorRecord,
  type VectorMetadata,
  type UpsertResult,
  type CreateVectorClientOptions,
} from './client.js';

export {
  upsertVectors,
  type UpsertVectorsResult,
} from './upsert.js';

export {
  queryNearest,
  deleteVectors,
  type QueryOptions,
  type QueryMatch,
  type QueryResult,
  type DeleteResult,
  type DistanceMetric,
} from './query.js';

export {
  cosineSimilarity,
  euclideanDistance,
  dotProduct,
} from './distance.js';

export {
  upsertWithRetry, type RetryOptions,
  upsertBatch, type BatchUpsertResult,
  createIdempotencyCache, upsertIdempotent, type IdempotencyCache,
  createHookRegistry, upsertObservable, type HookRegistry, type HookCallback, type HookContext, type UpsertHookEvent,
  createCircuitBreaker, type CircuitBreaker, type CircuitBreakerOptions, type CircuitState,
} from './enhancements.js';
