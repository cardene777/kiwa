import type {
  BetterAuthOAuthProfile,
  BetterAuthProviderKind,
  BetterAuthProviderMock,
} from './types.js';

let profileCounter = 0;

function nextProviderAccountId(prefix: string): string {
  profileCounter += 1;
  return `${prefix}-${profileCounter}`;
}

function buildProfile(
  kind: BetterAuthProviderKind,
  input: { email?: string; sub?: string } | undefined,
): BetterAuthOAuthProfile {
  const providerAccountId = input?.sub ?? nextProviderAccountId(kind);
  const email = input?.email ?? `${providerAccountId}@example.test`;
  return { provider: kind, providerAccountId, email };
}

export function createBetterAuthGoogleProviderMock(): BetterAuthProviderMock {
  return {
    kind: 'google',
    id: 'google',
    name: 'Google',
    signIn: async (input) => buildProfile('google', input),
  };
}

export function createBetterAuthGithubProviderMock(): BetterAuthProviderMock {
  return {
    kind: 'github',
    id: 'github',
    name: 'GitHub',
    signIn: async (input) => buildProfile('github', input),
  };
}

export function buildBetterAuthProviderRegistry(
  kinds: BetterAuthProviderKind[],
): Record<BetterAuthProviderKind, BetterAuthProviderMock> {
  const registry: Partial<Record<BetterAuthProviderKind, BetterAuthProviderMock>> = {};
  for (const kind of kinds) {
    if (kind === 'google') registry.google = createBetterAuthGoogleProviderMock();
    else if (kind === 'github') registry.github = createBetterAuthGithubProviderMock();
    else throw new Error(`Unknown Better Auth provider kind: ${String(kind)}`);
  }
  return registry as Record<BetterAuthProviderKind, BetterAuthProviderMock>;
}

/** Test-only reset — restart the internal profile counter. */
export function __resetBetterAuthProviderCounter(): void {
  profileCounter = 0;
}
