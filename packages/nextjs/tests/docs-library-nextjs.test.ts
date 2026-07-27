import { expect, it } from 'vitest';
import {
  invokeMiddleware,
  invokeParallelRoutes,
  invokeServerAction,
  middlewareActions,
  NOT_FOUND_SYMBOL,
  REDIRECT_SYMBOL,
  renderServerComponent,
} from '../src/index.js';

type LoginDependencies = { redirect: (url: string) => never };
async function login(formData: FormData, dependencies: LoginDependencies) {
  if (!formData.get('email')) throw new Error('email required');
  return dependencies.redirect('/dashboard');
}
const dependencies = {
  redirect: (url: string): never => { throw { [REDIRECT_SYMBOL]: true, url, type: 'replace' }; },
};

it('validates the Quickstart redirect and validation contracts', async () => {
  const formData = new FormData();
  formData.set('email', 'user@example.test');
  const redirected = await invokeServerAction({ action: login, formData, args: [dependencies] });
  expect(redirected.error).toBeUndefined();
  expect(redirected.env.redirect?.url).toBe('/dashboard');
  const invalid = await invokeServerAction({ action: login, formData: new FormData(), args: [dependencies] });
  expect(invalid.env.redirect).toBeNull();
  expect(invalid.error).toMatchObject({ message: 'email required' });
});

it('validates the middleware, RSC signal, and slot fallback how-to', async () => {
  const middleware = async (request: { cookies: ReadonlyMap<string, string> }) =>
    request.cookies.get('session') ? middlewareActions.next() : middlewareActions.redirect('/login');
  expect((await invokeMiddleware({ middleware, url: 'https://example.com/dashboard' })).env.action)
    .toMatchObject({ kind: 'redirect', url: '/login', status: 307 });

  const result = await renderServerComponent({ component: async () => { throw { [NOT_FOUND_SYMBOL]: true }; } });
  expect((result.signal as { [NOT_FOUND_SYMBOL]?: true })?.[NOT_FOUND_SYMBOL]).toBe(true);

  const routes = await invokeParallelRoutes({
    layout: ({ slots }) => ({ tag: 'layout', modal: slots.modal }), children: () => ({ tag: 'page' }),
    slots: [{ slot: 'modal', component: null, defaultFallback: () => ({ tag: 'default-modal' }) }],
  });
  expect(routes.slotResults[0]).toMatchObject({ usedDefault: true, tree: { tag: 'default-modal' } });
});
