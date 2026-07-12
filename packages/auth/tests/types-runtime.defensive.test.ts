import { describe, expect, it } from 'vitest';
import { SESSION_STRATEGIES, isSessionStrategy } from '../src/types.js';
import { AUTH0_CONNECTIONS, isAuth0Connection } from '../src/auth0/types.js';
import { BETTER_AUTH_DATABASE_KINDS, isBetterAuthDatabaseKind } from '../src/better-auth/types.js';
import { CLERK_ORGANIZATION_ROLES, isClerkOrganizationRole } from '../src/clerk/types.js';
import { LUCIA_DATABASE_KINDS, isLuciaDatabaseKind } from '../src/lucia/types.js';
import { OAUTH21_GRANT_TYPES, isOAuth21GrantType } from '../src/oauth21/types.js';
import { TRUST_CHAIN_REASON_CODES, isTrustChainReasonCode } from '../src/oidc/types.js';
import { SYNC_FABRIC_VENDORS, isSyncFabricVendor } from '../src/passkey/types.js';
import { CABLE_STEPS, isCaBLEStep } from '../src/passkey/caBLE/types.js';
import { SUPABASE_IDENTITY_PROVIDERS, isSupabaseIdentityProvider } from '../src/supabase/types.js';
import { RLS_COMMANDS, isRlsCommand } from '../src/supabase-advanced/types.js';
import { WEBAUTHN_TRANSPORTS, isWebAuthnTransport } from '../src/webauthn/types.js';

describe('auth types.ts runtime const 12 file batch', () => {
  it('SessionStrategy has 2 members', () => {
    expect(SESSION_STRATEGIES).toEqual(['jwt', 'database']);
    expect(isSessionStrategy('jwt')).toBe(true);
    expect(isSessionStrategy('database')).toBe(true);
    expect(isSessionStrategy('unknown')).toBe(false);
  });

  it('Auth0Connection has 6 members', () => {
    expect(AUTH0_CONNECTIONS).toHaveLength(6);
    expect(isAuth0Connection('google-oauth2')).toBe(true);
    expect(isAuth0Connection('github')).toBe(true);
    expect(isAuth0Connection('unknown')).toBe(false);
  });

  it('BetterAuthDatabaseKind has 3 members', () => {
    expect(BETTER_AUTH_DATABASE_KINDS).toEqual(['prisma', 'drizzle', 'kysely']);
    expect(isBetterAuthDatabaseKind('prisma')).toBe(true);
    expect(isBetterAuthDatabaseKind('mongodb')).toBe(false);
  });

  it('ClerkOrganizationRole has 3 members', () => {
    expect(CLERK_ORGANIZATION_ROLES).toEqual(['owner', 'admin', 'member']);
    expect(isClerkOrganizationRole('owner')).toBe(true);
    expect(isClerkOrganizationRole('guest')).toBe(false);
  });

  it('LuciaDatabaseKind has 2 members', () => {
    expect(LUCIA_DATABASE_KINDS).toEqual(['sqlite', 'postgresql']);
    expect(isLuciaDatabaseKind('sqlite')).toBe(true);
    expect(isLuciaDatabaseKind('mysql')).toBe(false);
  });

  it('OAuth21GrantType has 2 members', () => {
    expect(OAUTH21_GRANT_TYPES).toEqual(['authorization_code', 'refresh_token']);
    expect(isOAuth21GrantType('authorization_code')).toBe(true);
    expect(isOAuth21GrantType('implicit')).toBe(false);
  });

  it('TrustChainReasonCode has 5 members', () => {
    expect(TRUST_CHAIN_REASON_CODES).toHaveLength(5);
    expect(isTrustChainReasonCode('broken_link')).toBe(true);
    expect(isTrustChainReasonCode('anchor_mismatch')).toBe(true);
    expect(isTrustChainReasonCode('unknown_code')).toBe(false);
  });

  it('SyncFabricVendor has 2 members', () => {
    expect(SYNC_FABRIC_VENDORS).toEqual(['icloud-keychain', 'google-password-manager']);
    expect(isSyncFabricVendor('icloud-keychain')).toBe(true);
    expect(isSyncFabricVendor('unknown')).toBe(false);
  });

  it('CaBLEStep has 5 members', () => {
    expect(CABLE_STEPS).toHaveLength(5);
    expect(isCaBLEStep('qr-code')).toBe(true);
    expect(isCaBLEStep('signature-roundtrip')).toBe(true);
    expect(isCaBLEStep('unknown-step')).toBe(false);
  });

  it('SupabaseIdentityProvider has 7 members', () => {
    expect(SUPABASE_IDENTITY_PROVIDERS).toHaveLength(7);
    expect(isSupabaseIdentityProvider('email')).toBe(true);
    expect(isSupabaseIdentityProvider('discord')).toBe(false);
  });

  it('RlsCommand has 5 members', () => {
    expect(RLS_COMMANDS).toEqual(['select', 'insert', 'update', 'delete', 'all']);
    expect(isRlsCommand('select')).toBe(true);
    expect(isRlsCommand('drop')).toBe(false);
  });

  it('WebAuthnTransport has 5 members', () => {
    expect(WEBAUTHN_TRANSPORTS).toEqual(['internal', 'usb', 'nfc', 'ble', 'hybrid']);
    expect(isWebAuthnTransport('usb')).toBe(true);
    expect(isWebAuthnTransport('serial')).toBe(false);
  });
});
