import { createResourceStub, type ResourceHandle } from '@kiwa-lab/solidjs';

/**
 * UserProfile store — a `createResourceStub` wrapping an async fetcher.
 * The fetcher is injectable so tests can drive the resource through the
 * full `unresolved -> pending -> ready` transition (and force error /
 * refresh paths on demand).
 *
 * The store exposes `handle` (the underlying ResourceHandle) so tests can
 * assert on `accessor.state` transitions directly, plus a `waitReady()`
 * convenience that awaits `initialFetch` and asserts a terminal state.
 */
export interface UserProfile {
  readonly id: string;
  readonly displayName: string;
  readonly email: string;
}

export interface UserProfileStore {
  readonly handle: ResourceHandle<UserProfile>;
  readonly waitReady: () => Promise<UserProfile | undefined>;
  readonly refresh: () => Promise<UserProfile | undefined>;
}

export type UserProfileFetcher = () => Promise<UserProfile>;

export function createUserProfileStore(fetcher: UserProfileFetcher): UserProfileStore {
  const handle = createResourceStub<UserProfile>(fetcher);
  return {
    handle,
    waitReady: async () => {
      await handle.initialFetch;
      return handle.accessor();
    },
    refresh: async () => handle.actions.refetch(),
  };
}

/** Deterministic fetcher used by the dogfood's mock-mode tests. */
export function makeDefaultFetcher(profile: UserProfile): UserProfileFetcher {
  return async () => profile;
}

/** Failing fetcher — feeds the error boundary path. */
export function makeErroringFetcher(message: string): UserProfileFetcher {
  return async () => {
    throw new Error(message);
  };
}
