import { expect, test } from 'vitest';
import {
  batch,
  createResourceStub,
  h,
  invokeSolidRoute,
  mockEffect,
  mockSignal,
  redirect,
} from '../src/index.js';

test('the how-to separates a redirect from page rendering', async () => {
  const result = await invokeSolidRoute({
    page: () => h('p', null, 'This page must not render'),
    load: async () => {
      throw redirect('/login', 302);
    },
  });
  expect(result).toMatchObject({ tree: null, redirect: { url: '/login', status: 302 } });
  expect(result.error).toBeUndefined();
});

test('the how-to batches profile fields and refreshes the resource', async () => {
  const [firstName, setFirstName] = mockSignal('Ada');
  const [lastName, setLastName] = mockSignal('Lovelace');
  let renders = 0;
  const effect = mockEffect(() => {
    void firstName();
    void lastName();
    renders += 1;
  });
  const baseline = renders;
  batch(() => {
    setFirstName('Grace');
    setLastName('Hopper');
  });
  expect(renders).toBe(baseline + 1);

  let requests = 0;
  const { accessor, actions, initialFetch } = createResourceStub(async () => {
    requests += 1;
    return { displayName: `user-${requests}` };
  });
  await initialFetch;
  const refreshing = actions.refetch();
  expect(accessor.state).toBe('refreshing');
  await refreshing;
  expect(accessor()).toEqual({ displayName: 'user-2' });
  effect.dispose();
});
