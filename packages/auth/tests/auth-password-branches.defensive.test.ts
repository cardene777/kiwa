import { describe, expect, it } from 'vitest';
import {
  hashPassword as hashPasswordBetterAuth,
  verifyPassword as verifyPasswordBetterAuth,
} from '../src/better-auth/password.js';
import {
  hashPassword as hashPasswordLucia,
  verifyPassword as verifyPasswordLucia,
} from '../src/lucia/password.js';

describe('better-auth/password defensive branches', () => {
  it('hashPassword throws on empty password', async () => {
    await expect(hashPasswordBetterAuth('')).rejects.toThrow(
      /must not be empty/,
    );
  });

  it('verifyPassword returns false when hash lacks scrypt prefix', async () => {
    expect(await verifyPasswordBetterAuth('bogus-hash', 'password')).toBe(
      false,
    );
  });

  it('verifyPassword returns false when hash has wrong parts count', async () => {
    // scrypt prefix present but no '$' delimiter → parts.length !== 2
    expect(await verifyPasswordBetterAuth('$scrypt$saltonly', 'pw')).toBe(
      false,
    );
  });

  it('verifyPassword returns false when hash has empty salt segment', async () => {
    expect(await verifyPasswordBetterAuth('$scrypt$$hashonly', 'pw')).toBe(
      false,
    );
  });

  it('hashPassword + verifyPassword round trip returns true for match', async () => {
    const hash = await hashPasswordBetterAuth('correct-pw');
    expect(await verifyPasswordBetterAuth(hash, 'correct-pw')).toBe(true);
    expect(await verifyPasswordBetterAuth(hash, 'wrong-pw')).toBe(false);
  });
});

describe('lucia/password defensive branches', () => {
  it('hashPassword throws on empty password', async () => {
    await expect(hashPasswordLucia('')).rejects.toThrow(/must not be empty/);
  });

  it('verifyPassword returns false when hash lacks argon2 prefix', async () => {
    expect(await verifyPasswordLucia('bogus-hash', 'password')).toBe(false);
  });

  it('verifyPassword returns false when hash has wrong parts count', async () => {
    expect(await verifyPasswordLucia('$argon2mock$saltonly', 'pw')).toBe(
      false,
    );
  });

  it('verifyPassword returns false when hash has empty salt segment', async () => {
    expect(await verifyPasswordLucia('$argon2mock$$hashonly', 'pw')).toBe(
      false,
    );
  });

  it('hashPassword + verifyPassword round trip returns true for match', async () => {
    const hash = await hashPasswordLucia('correct-pw');
    expect(await verifyPasswordLucia(hash, 'correct-pw')).toBe(true);
    expect(await verifyPasswordLucia(hash, 'wrong-pw')).toBe(false);
  });
});
