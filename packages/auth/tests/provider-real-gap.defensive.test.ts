import { describe, expect, it } from 'vitest';
import {
  createBetterAuthGoogleProviderMock,
  createBetterAuthGithubProviderMock,
  buildBetterAuthProviderRegistry,
  __resetBetterAuthProviderCounter,
} from '../src/better-auth/providers.js';
import {
  createLuciaGoogleProviderMock,
  createLuciaGithubProviderMock,
  buildLuciaProviderRegistry,
  __resetLuciaProviderCounter,
} from '../src/lucia/providers.js';

describe('better-auth providers defensive branches', () => {
  it('createBetterAuthGoogleProviderMock signIn builds profile with default email', async () => {
    __resetBetterAuthProviderCounter();
    const provider = createBetterAuthGoogleProviderMock();
    const profile = await provider.signIn(undefined);
    expect(profile.provider).toBe('google');
    expect(profile.email).toContain('@example.test');
    expect(profile.providerAccountId).toContain('google');
  });

  it('createBetterAuthGoogleProviderMock signIn uses sub when provided', async () => {
    __resetBetterAuthProviderCounter();
    const provider = createBetterAuthGoogleProviderMock();
    const profile = await provider.signIn({ sub: 'sub-123', email: 'x@example.com' });
    expect(profile.providerAccountId).toBe('sub-123');
    expect(profile.email).toBe('x@example.com');
  });

  it('createBetterAuthGithubProviderMock signIn works with empty input', async () => {
    __resetBetterAuthProviderCounter();
    const provider = createBetterAuthGithubProviderMock();
    const profile = await provider.signIn({});
    expect(profile.provider).toBe('github');
    expect(profile.email).toContain('@example.test');
  });

  it('buildBetterAuthProviderRegistry returns google + github registries', () => {
    const registry = buildBetterAuthProviderRegistry(['google', 'github']);
    expect(registry.google.kind).toBe('google');
    expect(registry.github.kind).toBe('github');
  });

  it('buildBetterAuthProviderRegistry throws for unknown provider kind', () => {
    expect(() => buildBetterAuthProviderRegistry(['unknown' as never])).toThrow(
      /Unknown Better Auth provider kind/,
    );
  });
});

describe('lucia providers defensive branches', () => {
  it('createLuciaGoogleProviderMock signIn builds profile with default email', async () => {
    __resetLuciaProviderCounter();
    const provider = createLuciaGoogleProviderMock();
    const profile = await provider.signIn(undefined);
    expect(profile.provider).toBe('google');
    expect(profile.email).toContain('@example.test');
  });

  it('createLuciaGoogleProviderMock signIn uses sub when provided', async () => {
    __resetLuciaProviderCounter();
    const provider = createLuciaGoogleProviderMock();
    const profile = await provider.signIn({ sub: 'lucia-sub', email: 'z@example.com' });
    expect(profile.providerAccountId).toBe('lucia-sub');
    expect(profile.email).toBe('z@example.com');
  });

  it('createLuciaGithubProviderMock signIn works with empty input', async () => {
    __resetLuciaProviderCounter();
    const provider = createLuciaGithubProviderMock();
    const profile = await provider.signIn({});
    expect(profile.provider).toBe('github');
  });

  it('buildLuciaProviderRegistry returns google + github registries', () => {
    const registry = buildLuciaProviderRegistry(['google', 'github']);
    expect(registry.google.kind).toBe('google');
    expect(registry.github.kind).toBe('github');
  });

  it('buildLuciaProviderRegistry throws for unknown provider kind', () => {
    expect(() => buildLuciaProviderRegistry(['unknown' as never])).toThrow(
      /Unknown Lucia provider kind/,
    );
  });
});
