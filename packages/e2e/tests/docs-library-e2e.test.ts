import { expect, it } from 'vitest';
import { startServer } from '../src/index.js';

it('validates the Fetch handler response in the how-to', async () => {
  const server = await startServer({
    kind: 'fetch',
    handler: async (request) => new URL(request.url).pathname === '/settings'
      ? new Response("<h1 data-testid='title'>Settings</h1>", { headers: { 'content-type': 'text/html' } })
      : new Response('not found', { status: 404 }),
  });

  try {
    const response = await fetch(`${server.baseUrl}/settings`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('data-testid');
  } finally {
    await server.close();
  }
});

it('validates the direct Node handler response in the how-to', async () => {
  const server = await startServer((request, response) => {
    if (request.url === '/health') {
      response.setHeader('content-type', 'text/html');
      response.end("<p data-testid='status'>ok</p>");
      return;
    }
    response.statusCode = 404;
    response.end('not found');
  });

  try {
    const response = await fetch(`${server.baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('>ok<');
  } finally {
    await server.close();
  }
});
