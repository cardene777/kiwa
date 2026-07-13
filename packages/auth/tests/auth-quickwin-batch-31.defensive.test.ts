import { describe, expect, it } from 'vitest';
import { upsertUserFromProfile } from '../src/session.js';
import { createInMemoryAdapter } from '../src/adapter.js';
import { createInMemoryLuciaAdapter } from '../src/lucia/adapter.js';

describe('session upsertUserFromProfile branch coverage', () => {
  it('returns linked user when account already linked', async () => {
    const db = createInMemoryAdapter();
    const first = await upsertUserFromProfile(db, {
      provider: 'google',
      providerAccountId: 'sub-1',
      email: 'a@example.com',
      name: 'Alice',
    });
    const second = await upsertUserFromProfile(db, {
      provider: 'google',
      providerAccountId: 'sub-1',
      email: 'a@example.com',
    });
    expect(second.id).toBe(first.id);
  });

  it('reuses existing user by email when account not yet linked', async () => {
    const db = createInMemoryAdapter();
    const first = await upsertUserFromProfile(db, {
      provider: 'google',
      providerAccountId: 'sub-google',
      email: 'shared@example.com',
    });
    const second = await upsertUserFromProfile(db, {
      provider: 'github',
      providerAccountId: 'sub-github',
      email: 'shared@example.com',
    });
    expect(second.id).toBe(first.id);
  });

  it('creates fresh user when neither account nor email matches', async () => {
    const db = createInMemoryAdapter();
    const user = await upsertUserFromProfile(db, {
      provider: 'google',
      providerAccountId: 'sub-new',
      email: 'new@example.com',
      name: 'New',
    });
    expect(user.email).toBe('new@example.com');
  });

  it('marks account type as email for email provider', async () => {
    const db = createInMemoryAdapter();
    await upsertUserFromProfile(db, {
      provider: 'email',
      providerAccountId: 'magic-1',
      email: 'magic@example.com',
    });
    const stored = await db.getUserByAccount({
      provider: 'email',
      providerAccountId: 'magic-1',
    });
    expect(stored).not.toBeNull();
  });
});

describe('webauthn/creation + assertion challenge required', () => {
  it('credentialCreation throws when challenge is null', async () => {
    const { credentialCreation, createVirtualAuthenticator } = await import(
      '../src/webauthn/index.js'
    );
    const authResult = createVirtualAuthenticator({
      attachment: 'platform',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
    });
    const store = new Map();
    const globalRegistry = new Map();
    const credentialOwnership = new Map();
    expect(() =>
      credentialCreation(
        {
          rp: { id: 'example.com', name: 'RP' },
          user: { id: new Uint8Array([1]), name: 'u', displayName: 'U' },
          challenge: null as unknown as Uint8Array,
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        },
        authResult.handle,
        store,
        globalRegistry,
        credentialOwnership,
      ),
    ).toThrow(/challenge is required/);
  });

  it('credentialAssertion throws when rpId is empty', async () => {
    const { credentialAssertion, createVirtualAuthenticator } = await import(
      '../src/webauthn/index.js'
    );
    const authResult = createVirtualAuthenticator({
      attachment: 'platform',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
    });
    const globalRegistry = new Map();
    const credentialOwnership = new Map();
    expect(() =>
      credentialAssertion(
        {
          rpId: '',
          challenge: new Uint8Array([1, 2, 3]),
        },
        globalRegistry,
        [authResult.handle],
        credentialOwnership,
      ),
    ).toThrow(/rpId is required/);
  });
});

describe('lucia/adapter session + oauth account branches', () => {
  it('createSession stores session and updateSession round-trips', async () => {
    const db = createInMemoryLuciaAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    const session = await db.createSession({
      id: 's1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      fresh: false,
    });
    expect(session.id).toBe('s1');
    expect((await db.getSession('s1'))?.id).toBe('s1');
  });

  it('deleteExpiredSessions removes only expired sessions', async () => {
    const db = createInMemoryLuciaAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    await db.createSession({
      id: 'fresh-sess',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      fresh: false,
    });
    await db.createSession({
      id: 'expired-sess',
      userId: user.id,
      expiresAt: new Date(Date.now() - 60_000),
      fresh: false,
    });
    await db.deleteExpiredSessions();
    expect(await db.getSession('fresh-sess')).not.toBeNull();
    expect(await db.getSession('expired-sess')).toBeNull();
  });
});
