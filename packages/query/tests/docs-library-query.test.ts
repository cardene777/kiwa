import { expect, it } from 'vitest';
import {
  createOptimisticUpdate,
  createQueryClient,
  fetchQuery,
  mutate,
  subscribeToQuery,
} from '../src/index.js';

it('documents cache hit, stale fetch, and forced fetch with a controlled clock', async () => {
  let now = 1_000;
  const client = createQueryClient({ defaultStaleMs: 60_000, now: () => now });
  let calls = 0;
  const loadProfile = async () => ({ name: `revision ${++calls}` });

  expect(await fetchQuery(client, ['profile', 'u-1'], loadProfile)).toMatchObject({
    data: { name: 'revision 1' }, fromCache: false, fetchCount: 1,
  });
  expect(await fetchQuery(client, ['profile', 'u-1'], loadProfile)).toMatchObject({
    data: { name: 'revision 1' }, fromCache: true, fetchCount: 1, staleAgeMs: 0,
  });
  now += 60_000;
  expect(await fetchQuery(client, ['profile', 'u-1'], loadProfile)).toMatchObject({
    data: { name: 'revision 2' }, fromCache: false, fetchCount: 2,
  });
  expect(await fetchQuery(client, ['profile', 'u-1'], loadProfile, { force: true })).toMatchObject({
    data: { name: 'revision 3' }, fromCache: false, fetchCount: 3,
  });
});

it('documents successful invalidation, failure retention, and subscription cleanup', async () => {
  const client = createQueryClient();
  const states: string[] = [];
  const subscription = subscribeToQuery(client, ['profile', 'u-1'], state => states.push(state.status));
  await fetchQuery(client, ['profile', 'u-1'], async () => ({ name: 'before' }));
  expect(await mutate(client, async (name: string) => ({ name }), 'after', {
    invalidateKeys: [['profile', 'u-1']],
  })).toEqual({ result: { name: 'after' }, invalidated: ['["profile","u-1"]'] });
  expect(states).toEqual(['loading', 'success', 'idle']);
  subscription.unsubscribe();
  await fetchQuery(client, ['profile', 'u-1'], async () => ({ name: 'after' }));
  expect(states).toEqual(['loading', 'success', 'idle']);

  await expect(mutate(client, async () => { throw new Error('profile update failed'); }, undefined, {
    invalidateKeys: [['profile', 'u-1']],
  })).rejects.toThrow('profile update failed');
  expect(client.snapshot()).toMatchObject([{ data: { name: 'after' }, status: 'success' }]);
});

it('documents rollback of a failed optimistic update', () => {
  const update = createOptimisticUpdate({ completed: false });
  update.applyOptimistic({ completed: true });
  expect(update.current()).toEqual({ completed: true });
  update.rollback();
  expect(update.current()).toEqual({ completed: false });
  expect(update.isPending()).toBe(false);
});
