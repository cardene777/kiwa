import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AuthAdapter, Doc } from '../src/adapters/interface.js';
import { makeMockAdapter, totpCode } from '../src/adapters/mock.js';
import { seedDocsFor } from '../src/adapters/real.js';
import {
  connectWithWeb3Wallet,
  enrollAndVerifyTotp,
  listMyDocs,
  onboardWithMagicLink,
  onboardWithOAuth,
  onboardWithPassword,
  ssoLoginFromEnterprise,
} from '../src/flows/user-flows.js';

let adapter: AuthAdapter;

beforeEach(async () => {
  adapter = await makeMockAdapter();
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-supabase (mock mode) — daily auth flows', () => {
  it('T-DFS-M-001 email + password onboarding yields a usable session', async () => {
    const result = await onboardWithPassword(adapter, {
      email: 'alice@example.test',
      password: 'strong-secret',
      userMetadata: { firstName: 'Alice' },
    });
    expect(result.userId).toBeTypeOf('string');
    expect(result.accessToken).toBeTypeOf('string');
  });

  it('T-DFS-M-002 magic link onboarding completes end-to-end', async () => {
    const result = await onboardWithMagicLink(adapter, {
      email: 'bob@example.test',
    });
    expect(result.accessToken).toBeTypeOf('string');
  });

  it('T-DFS-M-003 OAuth PKCE onboarding yields a session', async () => {
    const result = await onboardWithOAuth(adapter, {
      provider: 'github',
      redirectTo: 'https://dogfood.test/callback',
    });
    expect(result.accessToken).toBeTypeOf('string');
  });
});

describe('dogfood-supabase (mock mode) — RLS-protected docs', () => {
  it('T-DFS-M-004 owner sees only their own docs after RLS enforcement', async () => {
    const login = await onboardWithPassword(adapter, {
      email: 'owner@example.test',
      password: 'x',
    });
    const seed: Doc[] = seedDocsFor(login.userId);
    const visible = await listMyDocs(adapter, {
      accessToken: login.accessToken,
      seedDocs: seed,
    });
    expect(visible).toHaveLength(1);
    expect(visible[0]?.ownerId).toBe(login.userId);
  });
});

describe('dogfood-supabase (mock mode) — MFA + SSO + Web3', () => {
  it('T-DFS-M-005 TOTP enrolment lifts session to aal2', async () => {
    const login = await onboardWithPassword(adapter, {
      email: 'mfa@example.test',
      password: 'x',
    });
    const result = await enrollAndVerifyTotp(adapter, {
      accessToken: login.accessToken,
      codeProvider: totpCode,
    });
    expect(result.aal).toBe('aal2');
  });

  it('T-DFS-M-006 SSO SAML login registers user + returns a session', async () => {
    const result = await ssoLoginFromEnterprise(adapter, {
      idpDisplayName: 'Acme Corp',
      domain: 'acme.test',
      userEmail: 'employee@acme.test',
      firstName: 'Emp',
      lastName: 'Loyee',
      groups: ['engineering'],
    });
    expect(result.accessToken).toBeTypeOf('string');
  });

  it('T-DFS-M-007 Web3 SIWE connect binds address to session', async () => {
    const result = await connectWithWeb3Wallet(adapter, {
      domain: 'dogfood.test',
      uri: 'https://dogfood.test',
      privateKey: 'test-key-01',
    });
    expect(result.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(result.userId).toBeTypeOf('string');
  });
});

describe('dogfood-supabase (mock mode) — trace introspection', () => {
  it('T-DFS-M-008 every flow appends distinct trace ops', async () => {
    await onboardWithPassword(adapter, { email: 'alice@example.test', password: 'x' });
    const traces = adapter.traces();
    const ops = new Set(traces.map((t) => t.op));
    expect(ops.has('signUp')).toBe(true);
    expect(ops.has('signInWithPassword')).toBe(true);
  });
});
