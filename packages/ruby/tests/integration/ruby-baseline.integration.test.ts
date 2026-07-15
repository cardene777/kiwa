/**
 * integration test — ruby domain の end-to-end workflow (request → controller → AR query →
 * render → response) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createRubyAppEnv,
  dispatchRailsRequest,
  dispatchGenericRequest,
  renderERB,
  captureActiveRecord,
} from '../../src/index.js';

describe('ruby integration — request → controller → AR → render workflow', () => {
  it('T-INT-R-001 Rails: before_action → action → AR log → response まで通る', async () => {
    const env = createRubyAppEnv({ framework: 'rails' });
    const result = await dispatchRailsRequest(
      env,
      { method: 'POST', path: '/posts' },
      {
        beforeActions: [
          () => { env.recordAR({ op: 'find', model: 'CurrentUser', args: {} }); },
        ],
        action: async (req) => {
          env.recordAR({ op: 'create', model: 'Post', args: req.body });
          return { status: 201, body: '{"ok":true}', headers: {}, cookies: {}, session: {} };
        },
      },
    );
    expect(result.response.status).toBe(201);
    expect(result.beforeActionCount).toBe(1);
    const snap = captureActiveRecord(env);
    expect(snap.byOp.create).toBe(1);
    expect(snap.byOp.find).toBe(1);
  });

  it('T-INT-R-002 Sinatra: route lookup + handler dispatch', async () => {
    const env = createRubyAppEnv({
      framework: 'sinatra',
      routes: [
        {
          method: 'GET',
          path: '/api/health',
          handler: () => ({ status: 200, body: 'ok', headers: {}, cookies: {}, session: {} }),
        },
      ],
    });
    const r = await dispatchGenericRequest(env, { method: 'GET', path: '/api/health' });
    expect(r.matched).toBe(true);
    expect(r.response.body).toBe('ok');
  });

  it('T-INT-R-003 Roda: parametric route (`:id`) が match', async () => {
    const env = createRubyAppEnv({
      framework: 'roda',
      routes: [
        {
          method: 'GET',
          path: '/users/:id',
          handler: (req) => ({
            status: 200,
            body: `user-${req.path}`,
            headers: {},
            cookies: {},
            session: {},
          }),
        },
      ],
    });
    const r = await dispatchGenericRequest(env, { method: 'GET', path: '/users/42' });
    expect(r.matched).toBe(true);
    expect(r.response.body).toBe('user-/users/42');
  });

  it('T-INT-R-004 Hanami: ERB render を response body に埋込む', async () => {
    const env = createRubyAppEnv({
      framework: 'hanami',
      routes: [
        {
          method: 'GET',
          path: '/greet',
          handler: () => {
            const rendered = renderERB('<h1>Hello <%= name %></h1>', { name: 'kiwa' });
            return {
              status: 200,
              body: rendered.html,
              headers: { 'content-type': 'text/html' },
              cookies: {},
              session: {},
            };
          },
        },
      ],
    });
    const r = await dispatchGenericRequest(env, { method: 'GET', path: '/greet' });
    expect(r.response.body).toBe('<h1>Hello kiwa</h1>');
  });

  it('T-INT-R-005 未 match route = 404 default response', async () => {
    const env = createRubyAppEnv({ framework: 'sinatra' });
    const r = await dispatchGenericRequest(env, { method: 'GET', path: '/nope' });
    expect(r.matched).toBe(false);
    expect(r.response.status).toBe(404);
  });
});
