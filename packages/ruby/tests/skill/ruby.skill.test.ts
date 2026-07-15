/**
 * skill test — ruby skill が主要 API 5 種 (createRubyAppEnv / dispatchRailsRequest /
 * dispatchGenericRequest / renderERB / captureActiveRecord) を全て公開している + 4 framework
 * (rails / sinatra / roda / hanami) 全てで動作することを assertion。
 */
import { describe, expect, it } from 'vitest';
import {
  createRubyAppEnv,
  dispatchRailsRequest,
  dispatchGenericRequest,
  renderERB,
  captureActiveRecord,
} from '../../src/index.js';

describe('ruby skill assertions', () => {
  it('createRubyAppEnv が 4 framework 全てで instantiate 可能', () => {
    for (const framework of ['rails', 'sinatra', 'roda', 'hanami'] as const) {
      const env = createRubyAppEnv({ framework });
      expect(env.framework).toBe(framework);
    }
  });

  it('dispatchRailsRequest が response + renderCalls + beforeActionCount を返す', async () => {
    const env = createRubyAppEnv({ framework: 'rails' });
    const result = await dispatchRailsRequest(
      env,
      { method: 'GET', path: '/' },
      { action: async () => ({ status: 200, body: 'ok', headers: {}, cookies: {}, session: {} }) },
    );
    expect(result.response.status).toBe(200);
    expect(Array.isArray(result.renderCalls)).toBe(true);
    expect(typeof result.beforeActionCount).toBe('number');
  });

  it('dispatchGenericRequest が 3 framework 全てで route match', async () => {
    for (const framework of ['sinatra', 'roda', 'hanami'] as const) {
      const env = createRubyAppEnv({
        framework,
        routes: [
          {
            method: 'GET',
            path: '/x',
            handler: () => ({ status: 200, body: framework, headers: {}, cookies: {}, session: {} }),
          },
        ],
      });
      const r = await dispatchGenericRequest(env, { method: 'GET', path: '/x' });
      expect(r.matched).toBe(true);
      expect(r.response.body).toBe(framework);
    }
  });

  it('renderERB が variables + missing を正しく collect', () => {
    const r = renderERB('<%= x %><%= y %>', { x: 'a' });
    expect(r.html).toBe('a');
    expect(r.variables).toEqual(['x', 'y']);
    expect(r.missing).toEqual(['y']);
  });

  it('captureActiveRecord snapshot が queries を全 preserve', () => {
    const env = createRubyAppEnv({ framework: 'rails' });
    env.recordAR({ op: 'create', model: 'Post', args: { title: 't' } });
    const snap = captureActiveRecord(env);
    expect(snap.queries[0]!.op).toBe('create');
    expect(snap.queries[0]!.model).toBe('Post');
  });
});
