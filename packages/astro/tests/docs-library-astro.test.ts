import { expect, it } from 'vitest';
import {
  invokeEndpoint,
  kiwaAstroNotFound,
  renderAstroPage,
  setupAstroViewTransitionEnv,
} from '../src/index.js';

it('documents an endpoint JSON contract and page HTML contract', async () => {
  const endpoint = await invokeEndpoint({
    endpoint: async ({ request, params, cookies }) => {
      const body = await request.json() as { name: string };
      cookies.set('seen', 'true');
      return Response.json({ id: params.id, name: body.name }, { status: 201 });
    },
    url: 'http://localhost/api/profile/42', params: { id: '42' }, jsonBody: { name: 'Ada' },
  });
  expect(endpoint.response.status).toBe(201);
  await expect(endpoint.response.json()).resolves.toEqual({ id: '42', name: 'Ada' });
  const page = await renderAstroPage({
    page: ({ params }) => `<h1>Post ${params.slug}</h1>`,
    url: 'http://localhost/blog/first', params: { slug: 'first' },
  });
  expect(page).toMatchObject({ html: '<h1>Post first</h1>' });
  expect(page.response.status).toBe(200);
});

it('documents page signals and an unsupported visual transition', async () => {
  const notFound = await renderAstroPage({
    page: () => { throw kiwaAstroNotFound(); }, url: 'http://localhost/missing',
  });
  expect(notFound.response.status).toBe(404);
  const env = setupAstroViewTransitionEnv({
    fromPath: '/blog', toPath: '/blog/42', supportsViewTransitions: false,
  });
  const seen: string[] = [];
  env.on('astro:before-preparation', event => {
    seen.push(event.type);
  });
  env.on('astro:before-swap', event => {
    expect(event.viewTransition).toBeUndefined();
    seen.push(event.type);
  });
  env.on('astro:after-swap', event => {
    seen.push(event.type);
  });
  expect(await env.dispatchAll()).toMatchObject({ cancelled: false, swapCallCount: 1 });
  expect(seen).toEqual(['astro:before-preparation', 'astro:before-swap', 'astro:after-swap']);
});
