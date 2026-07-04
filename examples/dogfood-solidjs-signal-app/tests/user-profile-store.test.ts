import { describe, expect, it } from 'vitest';
import {
  createUserProfileStore,
  makeDefaultFetcher,
  makeErroringFetcher,
} from '../src/store/user-profile.js';

describe('userProfile store (createResource lifecycle)', () => {
  it('T-DSSA-UPS-001 initial state=pending before await', async () => {
    const fetcher = makeDefaultFetcher({ id: 'u1', displayName: 'Ada', email: 'ada@ex.com' });
    const store = createUserProfileStore(fetcher);
    // Before the initial fetch settles, state should be `pending`.
    expect(store.handle.accessor.state).toBe('pending');
    await store.handle.initialFetch;
  });

  it('T-DSSA-UPS-002 state=ready + accessor()={profile} after await', async () => {
    const profile = { id: 'u1', displayName: 'Ada Lovelace', email: 'ada@ex.com' };
    const store = createUserProfileStore(makeDefaultFetcher(profile));
    await store.handle.initialFetch;
    expect(store.handle.accessor.state).toBe('ready');
    expect(store.handle.accessor()).toEqual(profile);
    expect(store.handle.accessor.loading).toBe(false);
  });

  it('T-DSSA-UPS-003 erroring fetcher transitions to state=errored', async () => {
    const store = createUserProfileStore(makeErroringFetcher('network down'));
    await store.handle.initialFetch;
    expect(store.handle.accessor.state).toBe('errored');
    expect(store.handle.accessor.error).toBeInstanceOf(Error);
    expect((store.handle.accessor.error as Error).message).toBe('network down');
  });

  it('T-DSSA-UPS-004 refresh() re-invokes fetcher + goes through refreshing', async () => {
    let calls = 0;
    const store = createUserProfileStore(async () => {
      calls += 1;
      return { id: `u${calls}`, displayName: `n${calls}`, email: `e${calls}@ex.com` };
    });
    await store.handle.initialFetch;
    expect(store.handle.accessor.state).toBe('ready');
    const refetchPromise = store.refresh();
    // synchronous check: state should already be `refreshing` after refetch() call
    expect(store.handle.accessor.state).toBe('refreshing');
    await refetchPromise;
    expect(store.handle.accessor.state).toBe('ready');
    expect(calls).toBe(2);
  });

  it('T-DSSA-UPS-005 waitReady() convenience returns settled value', async () => {
    const profile = { id: 'u1', displayName: 'Alan', email: 'alan@ex.com' };
    const store = createUserProfileStore(makeDefaultFetcher(profile));
    const value = await store.waitReady();
    expect(value).toEqual(profile);
  });

  it('T-DSSA-UPS-006 mutate() sets value + state=ready without fetching', async () => {
    const store = createUserProfileStore(makeDefaultFetcher({ id: 'u1', displayName: 'A', email: 'a@ex.com' }));
    await store.handle.initialFetch;
    store.handle.actions.mutate({ id: 'u2', displayName: 'B', email: 'b@ex.com' });
    expect(store.handle.accessor.state).toBe('ready');
    expect(store.handle.accessor()?.id).toBe('u2');
  });
});
