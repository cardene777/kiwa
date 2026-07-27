import {
  createInMemoryAdapter,
  setupAuth0Env,
  setupBetterAuthEnv,
  setupClerkEnv,
  setupLuciaEnv,
  setupNextAuthEnv,
  setupSupabaseAuthEnv,
} from '@kiwa-lab/auth';
import { afterEach, describe, expect, it } from 'vitest';

const environments: Array<{ stop(): Promise<void> }> = [];

function keep<T extends { stop(): Promise<void> }>(environment: T): T {
  environments.push(environment);
  return environment;
}

afterEach(async () => {
  await Promise.all(environments.splice(0).map((environment) => environment.stop()));
});

describe('library documentation authentication recipes', () => {
  it('keeps a NextAuth database session and removes it on sign-out', async () => {
    const database = createInMemoryAdapter();
    const nextAuth = keep(
      await setupNextAuthEnv({
        providers: ['github'],
        database,
        session: { strategy: 'database' },
      }),
    );

    const signed = await nextAuth.signIn('github', { email: 'alice@example.test' });
    expect((await database.getUserByEmail('alice@example.test'))?.id).toBe(signed.user.id);

    await nextAuth.signOut(signed.session.sessionToken);
    await expect(nextAuth.getSession(signed.session.sessionToken)).resolves.toBeNull();
  });

  it('keeps a Lucia password session bound to its user', async () => {
    const lucia = keep(await setupLuciaEnv({ database: { kind: 'postgresql' } }));
    const signed = await lucia.signUpWithPassword({
      email: 'alice@example.test',
      password: 'correct-horse-battery-staple',
    });
    const validated = await lucia.validateSession(signed.session.id);

    expect(lucia.database.kind).toBe('postgresql');
    expect(validated?.user.email).toBe('alice@example.test');
    expect(validated?.session.userId).toBe(signed.user.id);
  });

  it('creates a Better Auth session when a magic link is consumed', async () => {
    const betterAuth = keep(
      await setupBetterAuthEnv({ plugins: ['emailAndPassword', 'magicLink'] }),
    );
    const { token } = await betterAuth.sendMagicLink({ email: 'alice@example.test' });
    const signed = await betterAuth.consumeMagicLink({
      email: 'alice@example.test',
      token,
    });

    expect(signed.user.emailVerified).toBe(true);
    expect(signed.session.userId).toBe(signed.user.id);
  });

  it('exposes the Clerk organization role in a verified token', async () => {
    const clerk = keep(
      await setupClerkEnv({
        users: [{ primaryEmailAddress: 'alice@example.test' }],
        orgs: [{ name: 'Acme', slug: 'acme', createdByEmail: 'alice@example.test' }],
        tokens: [{ userEmail: 'alice@example.test', organizationSlug: 'acme' }],
      }),
    );
    const token = clerk.seededTokens['alice@example.test']?.token;
    if (!token) throw new Error('seeded token missing');

    const claims = await clerk.verifyToken(token);
    expect(claims.sub).toMatch(/^user_/);
    expect(claims.org_role).toBe('owner');
    expect(claims.org_slug).toBe('acme');
  });

  it('checks the Auth0 API audience and custom role claim', async () => {
    const auth0 = keep(
      await setupAuth0Env({
        tenant: 'kiwa-test',
        audience: 'https://api.kiwa.test/',
        users: [
          {
            email: 'alice@example.test',
            password: 'pw-1',
            app_metadata: { role: 'admin' },
          },
        ],
        actions: {
          'post-login': [(_event, api) => {
            api.accessToken.setCustomClaim('https://kiwa.test/roles', ['admin']);
          }],
        },
      }),
    );
    const signed = await auth0.authenticate.signIn({
      email: 'alice@example.test',
      password: 'pw-1',
    });
    const claims = await auth0.verifyAccessToken(signed.access_token);

    expect(claims.aud).toBe('https://api.kiwa.test/');
    expect(claims['https://kiwa.test/roles']).toEqual(['admin']);
  });

  it('rejects a Supabase token issued by another environment', async () => {
    const supabase = keep(
      await setupSupabaseAuthEnv({
        users: [
          {
            email: 'alice@example.test',
            password: 'secret',
            emailConfirmed: true,
          },
        ],
      }),
    );
    const other = keep(await setupSupabaseAuthEnv());
    const { session } = await supabase.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });

    await expect(other.verifyToken(session.accessToken)).rejects.toThrow(/signature mismatch/);
  });
});
