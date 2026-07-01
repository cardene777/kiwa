import type { AuthProfile, ProviderKind, ProviderMock } from './types.js';

let profileCounter = 0;

function nextProviderAccountId(prefix: string): string {
  profileCounter += 1;
  return `${prefix}-${profileCounter}`;
}

function buildProfile(
  kind: ProviderKind,
  input: { email?: string; sub?: string; name?: string } | undefined,
): AuthProfile {
  const providerAccountId = input?.sub ?? nextProviderAccountId(kind);
  const email = input?.email ?? `${providerAccountId}@example.test`;
  const profile: AuthProfile = {
    provider: kind,
    providerAccountId,
    email,
  };
  if (input?.name !== undefined) {
    profile.name = input.name;
  }
  return profile;
}

export function createGoogleProviderMock(): ProviderMock {
  return {
    kind: 'google',
    id: 'google',
    name: 'Google',
    signIn: async (input) => buildProfile('google', input),
  };
}

export function createGithubProviderMock(): ProviderMock {
  return {
    kind: 'github',
    id: 'github',
    name: 'GitHub',
    signIn: async (input) => buildProfile('github', input),
  };
}

export function createEmailProviderMock(): ProviderMock {
  return {
    kind: 'email',
    id: 'email',
    name: 'Email',
    signIn: async (input) => {
      if (!input?.email) {
        throw new Error('Email provider requires an email address for the magic link');
      }
      return buildProfile('email', input);
    },
  };
}

export function buildProviderRegistry(
  kinds: ProviderKind[],
): Record<ProviderKind, ProviderMock> {
  const registry: Partial<Record<ProviderKind, ProviderMock>> = {};
  for (const kind of kinds) {
    if (kind === 'google') registry.google = createGoogleProviderMock();
    else if (kind === 'github') registry.github = createGithubProviderMock();
    else if (kind === 'email') registry.email = createEmailProviderMock();
    else throw new Error(`Unknown provider kind: ${String(kind)}`);
  }
  return registry as Record<ProviderKind, ProviderMock>;
}

/** Test-only reset — restart the internal profile counter. */
export function __resetProviderCounter(): void {
  profileCounter = 0;
}
