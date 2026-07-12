import { describe, expect, it } from 'vitest';
import { setupLuciaEnv } from '../src/lucia/setup-lucia-env.js';
import { createInMemoryLuciaAdapter } from '../src/lucia/adapter.js';

describe('lucia/setup-lucia-env defensive branches', () => {
  it('accepts pre-built adapter without recreating (isBuiltAdapter true)', async () => {
    const preBuilt = createInMemoryLuciaAdapter();
    // Seed a user via pre-built adapter to verify env reuses it
    await preBuilt.createUser({ email: 'a@example.com' });
    const env = await setupLuciaEnv({ database: preBuilt });
    const user = await env.database.getUserByEmail('a@example.com');
    expect(user).not.toBeNull();
  });

  it('creates in-memory adapter when database has kind but not full interface', async () => {
    // A plain object with just `kind` should be treated as options → new adapter
    const env = await setupLuciaEnv({ database: { kind: 'postgresql' } as never });
    expect(env.database).toBeDefined();
  });

  it('throws when providers empty', async () => {
    await expect(setupLuciaEnv({ providers: [] })).rejects.toThrow(
      /providers must contain at least one entry/,
    );
  });

  it('throws when sessionExpiration is zero or negative', async () => {
    await expect(setupLuciaEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration must be a positive number/,
    );
    await expect(setupLuciaEnv({ sessionExpiration: -1 })).rejects.toThrow(
      /sessionExpiration must be a positive number/,
    );
  });

  it('signUpWithPassword throws when email is empty', async () => {
    const env = await setupLuciaEnv();
    await expect(env.signUpWithPassword({ email: '', password: 'p' })).rejects.toThrow(
      /email is required/,
    );
  });
});
