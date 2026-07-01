import type {
  LuciaOAuthProfile,
  LuciaProviderKind,
  LuciaProviderMock,
} from './types.js';

let profileCounter = 0;

function nextProviderAccountId(prefix: string): string {
  profileCounter += 1;
  return `${prefix}-${profileCounter}`;
}

function buildProfile(
  kind: LuciaProviderKind,
  input: { email?: string; sub?: string } | undefined,
): LuciaOAuthProfile {
  const providerAccountId = input?.sub ?? nextProviderAccountId(kind);
  const email = input?.email ?? `${providerAccountId}@example.test`;
  return { provider: kind, providerAccountId, email };
}

export function createLuciaGoogleProviderMock(): LuciaProviderMock {
  return {
    kind: 'google',
    id: 'google',
    name: 'Google',
    signIn: async (input) => buildProfile('google', input),
  };
}

export function createLuciaGithubProviderMock(): LuciaProviderMock {
  return {
    kind: 'github',
    id: 'github',
    name: 'GitHub',
    signIn: async (input) => buildProfile('github', input),
  };
}

export function buildLuciaProviderRegistry(
  kinds: LuciaProviderKind[],
): Record<LuciaProviderKind, LuciaProviderMock> {
  const registry: Partial<Record<LuciaProviderKind, LuciaProviderMock>> = {};
  for (const kind of kinds) {
    if (kind === 'google') registry.google = createLuciaGoogleProviderMock();
    else if (kind === 'github') registry.github = createLuciaGithubProviderMock();
    else throw new Error(`Unknown Lucia provider kind: ${String(kind)}`);
  }
  return registry as Record<LuciaProviderKind, LuciaProviderMock>;
}

/** Test-only reset — restart the internal profile counter. */
export function __resetLuciaProviderCounter(): void {
  profileCounter = 0;
}
