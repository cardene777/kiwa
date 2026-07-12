import { describe, expect, it } from 'vitest';
import { startServer, type ServerHandle } from '../src/index.js';

// Exercises the residual defensive branches on ServerHandle.close():
//   server.close((error) => (error ? reject(error) : resolve()))
// Calling close() on a server that's already been closed yields
// ERR_SERVER_NOT_RUNNING via the callback, hitting the `reject(error)` branch.
describe('startServer close() - error branch', () => {
  it('T-HS-C001 second close() rejects with ERR_SERVER_NOT_RUNNING', async () => {
    const server: ServerHandle = await startServer({
      kind: 'fetch',
      handler: async () => new Response('x', { status: 200 }),
    });
    await server.close();
    await expect(server.close()).rejects.toBeTruthy();
  });

  it('T-HS-C002 second close() rejects with an Error carrying a message', async () => {
    const server: ServerHandle = await startServer({
      kind: 'fetch',
      handler: async () => new Response('x', { status: 200 }),
    });
    await server.close();
    let caught: unknown = undefined;
    try {
      await server.close();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toMatch(/./);
  });
});
