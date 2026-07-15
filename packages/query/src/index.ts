export {
  createQueryClient,
  type QueryProvider,
  type QueryClient,
  type QueryKey,
  type QueryState,
  type QueryStatus,
  type CreateQueryClientOptions,
} from './client.js';

export {
  fetchQuery,
  type FetchQueryOptions,
  type FetchQueryResult,
  type QueryFn,
} from './fetch.js';

export {
  mutate,
  type MutateOptions,
  type MutateResult,
  type MutationFn,
} from './mutation.js';

export {
  invalidateQuery,
  type InvalidateResult,
} from './invalidate.js';

export {
  subscribeToQuery,
  type Subscription,
  type QueryListener,
} from './subscription.js';

// v2.1 extensions
export {
  createInfiniteQuery,
  createOptimisticUpdate,
  prefetchQueries,
  retryWithBackoff,
  withTimeout,
  createObservabilityHook,
  type InfiniteQueryOptions,
  type InfiniteQueryState,
  type OptimisticUpdate,
  type PrefetchOptions,
  type PrefetchResult,
  type RetryOptions,
  type RetryResult,
  type ObservabilityHook,
} from './extensions.js';
