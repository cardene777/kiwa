/**
 * GH #1795 Round 2 — the callback route module itself.
 *
 * `rp-callback-verify.spec.ts` covers `runCallback`, but that leaves the
 * adapter unexecuted: a route that stopped calling `runCallback` would keep
 * every one of those cases green. Since the defect this PR fixes was exactly
 * "the helper existed but the route never called it", the adapter needs its
 * own execution.
 *
 * Nitro's auto-imports (`defineEventHandler`, `getCookie`, `readBody`,
 * `createError`, `useRuntimeConfig`, `$fetch`, `setCookie`, `deleteCookie`)
 * are globals at runtime. The suite installs stand-ins on `globalThis` before
 * importing the module, which is enough to run the handler outside Nitro.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { setupOidcEnv } from '@kiwa-lab/auth';
import type { JwksDocument } from '@kiwa-lab/auth';

const ISSUER = 'https://op.example.test';
const CLIENT_ID = 'rp-client';
const NONCE = 'nonce-abc';
const CODE = 'code-xyz';
const STATE = 'state-1';
const ACCESS_TOKEN = 'access-token-123';
const SUBJECT = 'user-42';

/** Error shape `createError` produces, carrying the status the route chose. */
interface RouteError extends Error {
  statusCode: number;
  statusMessage: string;
}

interface Globals {
  cookies: Record<string, string | undefined>;
  setCookies: Record<string, string>;
  deletedCookies: string[];
  fetches: string[];
  jwks: JwksDocument;
  idToken: string;
  userinfoSub: string;
  jwksFails: boolean;
}

let state: Globals;

/** Install the Nitro globals the route relies on. */
function installNitroGlobals(): void {
  const g = globalThis as Record<string, unknown>;

  g.defineEventHandler = (fn: unknown) => fn;
  g.readBody = async () => ({ code: CODE, state: STATE });
  g.getCookie = (_event: unknown, name: string) => state.cookies[name];
  g.setCookie = (_event: unknown, name: string, value: string) => {
    state.setCookies[name] = value;
  };
  g.deleteCookie = (_event: unknown, name: string) => {
    state.deletedCookies.push(name);
  };
  g.useRuntimeConfig = () => ({
    opIssuer: ISSUER,
    rpClientId: CLIENT_ID,
    rpRedirectUri: 'https://rp.example.test/callback',
  });
  g.createError = (init: { statusCode: number; statusMessage: string }) => {
    const err = new Error(init.statusMessage) as RouteError;
    err.statusCode = init.statusCode;
    err.statusMessage = init.statusMessage;
    return err;
  };
  g.$fetch = async (url: string) => {
    state.fetches.push(url);
    if (url.endsWith('/jwks')) {
      if (state.jwksFails) {
        throw new Error('network down');
      }
      return state.jwks;
    }
    if (url.endsWith('/token')) {
      return {
        access_token: ACCESS_TOKEN,
        id_token: state.idToken,
        token_type: 'Bearer',
        expires_in: 3600,
      };
    }
    if (url.endsWith('/userinfo')) {
      return { sub: state.userinfoSub, name: 'Test User' };
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
}

/**
 * Load the route module. The import is deferred to call time so the globals
 * are already installed when the module body runs `defineEventHandler`.
 *
 * Re-importing returns the cached module, which is fine: the handler resolves
 * every other helper from `globalThis` when it is invoked, so each test still
 * sees its own stand-ins.
 */
async function loadRoute(): Promise<(event: unknown) => Promise<unknown>> {
  const mod = await import('../rp/server/api/callback.post.js');
  return mod.default as (event: unknown) => Promise<unknown>;
}

/** Run the handler and return the error it threw, or `undefined` on success. */
async function runRoute(): Promise<RouteError | undefined> {
  const handler = await loadRoute();
  try {
    await handler({});
    return undefined;
  } catch (err) {
    return err as RouteError;
  }
}

beforeEach(async () => {
  const env = await setupOidcEnv({ issuer: ISSUER });
  state = {
    cookies: {
      rp_state: STATE,
      rp_nonce: NONCE,
      rp_code_verifier: 'verifier-1',
    },
    setCookies: {},
    deletedCookies: [],
    fetches: [],
    jwks: env.jwks.fetch(),
    idToken: env.signIdToken({
      sub: SUBJECT,
      aud: CLIENT_ID,
      nonce: NONCE,
      accessToken: ACCESS_TOKEN,
      code: CODE,
    }).jwt,
    userinfoSub: SUBJECT,
    jwksFails: false,
  };
  installNitroGlobals();
});

afterEach(() => {
  const g = globalThis as Record<string, unknown>;
  for (const name of [
    'defineEventHandler',
    'readBody',
    'getCookie',
    'setCookie',
    'deleteCookie',
    'useRuntimeConfig',
    'createError',
    '$fetch',
  ]) {
    delete g[name];
  }
});

describe('callback route — the adapter is wired to the verification', () => {
  it('stores the userinfo when the id_token verifies', async () => {
    const error = await runRoute();

    expect(error).toBeUndefined();
    expect(state.setCookies.rp_userinfo).toContain(SUBJECT);
    // The /authorize cookies are cleared so a replay fails the state gate.
    expect(state.deletedCookies).toContain('rp_state');
  });

  it('answers 401 and stores nothing when the id_token is signed by an unknown key', async () => {
    const other = await setupOidcEnv({ issuer: ISSUER });
    state.idToken = other.signIdToken({
      sub: SUBJECT,
      aud: CLIENT_ID,
      nonce: NONCE,
      accessToken: ACCESS_TOKEN,
      code: CODE,
    }).jwt;

    const error = await runRoute();

    expect(error?.statusCode).toBe(401);
    expect(error?.statusMessage).toContain('id_token rejected');
    expect(state.setCookies.rp_userinfo).toBeUndefined();
    // Verification precedes the profile fetch.
    expect(state.fetches.some((url) => url.endsWith('/userinfo'))).toBe(false);
  });

  it('answers 401 when the JWKS cannot be fetched', async () => {
    state.jwksFails = true;

    const error = await runRoute();

    expect(error?.statusCode).toBe(401);
    expect(error?.statusMessage).toContain('JWKS unavailable');
    expect(state.setCookies.rp_userinfo).toBeUndefined();
  });

  it('answers 401 when userinfo names a different subject', async () => {
    state.userinfoSub = 'someone-else';

    const error = await runRoute();

    expect(error?.statusCode).toBe(401);
    expect(error?.statusMessage).toContain('does not match');
    expect(state.setCookies.rp_userinfo).toBeUndefined();
  });

  it('answers 400 before touching the OP when state does not match', async () => {
    state.cookies.rp_state = 'other';

    const error = await runRoute();

    expect(error?.statusCode).toBe(400);
    expect(error?.statusMessage).toContain('CSRF gate');
    expect(state.fetches).toHaveLength(0);
  });
});
